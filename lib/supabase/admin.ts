import { createClient } from '@supabase/supabase-js'

// Nunca exponha este cliente em código que rode no browser.
// Bypass de RLS — use só em Server Actions / Route Handlers
// para operações privilegiadas (criar usuário Auth, anon inserts, etc).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
