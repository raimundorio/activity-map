import { Hono } from 'hono'
import { cors } from 'hono/cors'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  SUPABASE_JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://activity-map.pages.dev'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
}))

// Verify Supabase JWT and return user payload
async function verifyJWT(token: string, secret: string): Promise<{ sub: string } | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !sigB64) return null

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

    const valid = await crypto.subtle.verify('HMAC', key, sig, data)
    if (!valid) return null

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

function supabaseHeaders(env: Env) {
  return {
    'Content-Type': 'application/json',
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  }
}

// Middleware: require auth
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  const payload = await verifyJWT(token, c.env.SUPABASE_JWT_SECRET)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  c.set('userId' as never, payload.sub)
  return next()
})

// GET /api/pins — list all pins with attachments and group info
app.get('/api/pins', async (c) => {
  const url = `${c.env.SUPABASE_URL}/rest/v1/pins?select=*,group:groups(*),profile:profiles(*,group:groups(*)),attachments(*)&order=created_at.desc`
  const res = await fetch(url, { headers: supabaseHeaders(c.env) })
  const data = await res.json()
  return c.json(data)
})

// POST /api/pins — create a pin (user must belong to a group)
app.post('/api/pins', async (c) => {
  const userId = c.get('userId' as never) as string
  const body = await c.req.json<{ lat: number; lng: number; title: string; description?: string }>()

  // Fetch user's group
  const profileRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=group_id`,
    { headers: supabaseHeaders(c.env) },
  )
  const [profile] = await profileRes.json<{ group_id: string | null }[]>()
  if (!profile?.group_id) return c.json({ error: 'User has no group assigned' }, 403)

  const pinRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/pins`, {
    method: 'POST',
    headers: { ...supabaseHeaders(c.env), Prefer: 'return=representation' },
    body: JSON.stringify({
      lat: body.lat,
      lng: body.lng,
      title: body.title,
      description: body.description ?? null,
      user_id: userId,
      group_id: profile.group_id,
    }),
  })
  const [pin] = await pinRes.json<{ id: string }[]>()
  return c.json(pin, 201)
})

// DELETE /api/pins/:id — delete pin (owner only)
app.delete('/api/pins/:id', async (c) => {
  const userId = c.get('userId' as never) as string
  const pinId = c.req.param('id')

  const checkRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/pins?id=eq.${pinId}&user_id=eq.${userId}&select=id`,
    { headers: supabaseHeaders(c.env) },
  )
  const rows = await checkRes.json<unknown[]>()
  if (!rows.length) return c.json({ error: 'Not found or not owner' }, 404)

  await fetch(`${c.env.SUPABASE_URL}/rest/v1/pins?id=eq.${pinId}`, {
    method: 'DELETE',
    headers: supabaseHeaders(c.env),
  })
  return c.json({ ok: true })
})

// POST /api/pins/:id/attachments — add attachment metadata
app.post('/api/pins/:id/attachments', async (c) => {
  const userId = c.get('userId' as never) as string
  const pinId = c.req.param('id')
  const body = await c.req.json<{ type: string; url: string; name: string }>()

  const checkRes = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/pins?id=eq.${pinId}&user_id=eq.${userId}&select=id`,
    { headers: supabaseHeaders(c.env) },
  )
  const rows = await checkRes.json<unknown[]>()
  if (!rows.length) return c.json({ error: 'Not found or not owner' }, 404)

  const attRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/attachments`, {
    method: 'POST',
    headers: { ...supabaseHeaders(c.env), Prefer: 'return=representation' },
    body: JSON.stringify({ pin_id: pinId, type: body.type, url: body.url, name: body.name }),
  })
  const [att] = await attRes.json<unknown[]>()
  return c.json(att, 201)
})

export default app
