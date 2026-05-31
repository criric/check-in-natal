import { createBrowserClient } from '@supabase/ssr'

// Quando rodar `npm run gen:types`, troque para:
//   createBrowserClient<Database>(...)
// importando o tipo de '@/types/database.types'.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
