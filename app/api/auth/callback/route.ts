import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Rota de callback para magic link gerado pelo Admin SDK.
 *
 * Quando o Supabase processa o link e redireciona para cá, traz
 * token_hash + type na query string. O cliente SSR troca esses parâmetros
 * por uma sessão e grava os cookies — sem precisar de PKCE no browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('[auth/callback] full URL:', request.url)
  console.log('[auth/callback] all params:', Object.fromEntries(searchParams.entries()))
  console.log('[auth/callback] parsed:', { tokenHash: !!tokenHash, type, code: !!code, error, errorDescription })

  const supabase = await createClient()

  // Fluxo token_hash — gerado pelo admin.generateLink
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    })

    console.log('[auth/callback] verifyOtp error:', error)

    if (!error) {
      return NextResponse.redirect(new URL('/portal', origin))
    }
  }

  // Fluxo PKCE — fallback para signInWithOtp client-side
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[auth/callback] exchangeCodeForSession error:', error)

    if (!error) {
      return NextResponse.redirect(new URL('/portal', origin))
    }
  }

  // Falha: redireciona para a página de magic link com flag de erro
  return NextResponse.redirect(new URL('/magic-link?error=auth', origin))
}
