import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wecyqzgyyydhzzhjyrxn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY3lxemd5eXlkaHp6aGp5cnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ4MDEsImV4cCI6MjA5NzI5MDgwMX0.VSQ5tm-w4khfr6wsmN-sL8g8QRunGaGf6M4QFlTUB6w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
