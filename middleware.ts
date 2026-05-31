import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole } from '@/types'

const ADMIN_PREFIXES = [
  '/dashboard',
  '/imoveis',
  '/proprietarios',
  '/reservas',
  '/repasses',
  '/relatorios',
  '/limpezas',
  '/manutencoes',
  '/vistorias',
  '/configuracoes',
]

const PROPRIETARIO_PREFIXES = ['/portal']

function matchesAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: {
            name: string
            value: string
            options: CookieOptions
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAdminRoute = matchesAny(pathname, ADMIN_PREFIXES)
  const isProprietarioRoute = matchesAny(pathname, PROPRIETARIO_PREFIXES)

  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = user.user_metadata?.role
    if (role !== UserRole.Admin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  if (isProprietarioRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = user.user_metadata?.role
    if (role !== UserRole.Proprietario) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
