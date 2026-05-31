import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Quando rodar `npm run gen:types`, troque para:
//   createServerClient<Database>(...)
// importando o tipo de '@/types/database.types'.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: {
            name: string
            value: string
            options: CookieOptions
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Chamada de set fora de um Server Action / Route Handler.
          }
        },
      },
    },
  )
}
