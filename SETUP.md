# Activity Map — Setup Guide

## 1. Supabase

1. Create a project at supabase.com
2. Go to **SQL Editor** → run `supabase/migrations/001_init.sql`
3. Go to **Storage** → create a bucket named `pin-attachments` (set to **Public**)
4. Go to **Project Settings → API** → copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
   - JWT Secret (under JWT Settings)

## 2. Environment variables (frontend)

```sh
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8787
```

## 3. Cloudflare Worker (local dev)

```sh
cd worker
npm install

# Set secrets for local dev (creates .dev.vars)
echo 'SUPABASE_URL="https://xxxx.supabase.co"' >> .dev.vars
echo 'SUPABASE_SERVICE_KEY="eyJ..."' >> .dev.vars
echo 'SUPABASE_JWT_SECRET="your-jwt-secret"' >> .dev.vars

npm run dev   # runs on http://localhost:8787
```

## 4. Frontend (local dev)

```sh
# From project root:
npm install
npm run dev   # runs on http://localhost:5173, proxies /api → worker
```

## 5. Seed initial groups

In Supabase SQL Editor, add your groups:

```sql
insert into public.groups (name, description, color) values
  ('Group A', 'First organization', '#3b82f6'),
  ('Group B', 'Second organization', '#10b981'),
  ('Group C', 'Third organization', '#f59e0b');
```

Then assign users to groups via the Dashboard or SQL:
```sql
update public.profiles set group_id = '<group-uuid>' where id = '<user-uuid>';
```

## 6. Deploy

### Frontend → Cloudflare Pages
```sh
npm run build
# Upload the `dist/` folder in Cloudflare Dashboard → Pages → Deploy
# Or connect your GitHub repo for auto-deploy
# Add env vars in Pages settings:
#   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL (Worker URL)
```

### Worker → Cloudflare Workers
```sh
cd worker
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_JWT_SECRET
npm run deploy
```

## Architecture

```
Browser (React + Leaflet)
  │
  ├── Auth + File upload ──────────→ Supabase JS client (direct)
  │                                    ├── Auth (email/password)
  │                                    └── Storage (images, videos, xlsx)
  │
  └── Pin CRUD ───────────────────→ Cloudflare Worker (Hono)
                                       └── Supabase REST API (service key)
```
