import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Valida se o e-mail informado pertence a um proprietário cadastrado.
 * O envio do magic link em si é feito pelo browser via signInWithOtp,
 * garantindo que o code_verifier (PKCE) seja armazenado corretamente.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = createAdminClient()

    const { data: prop, error: propError } = await admin
      .from('proprietarios')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (propError) {
      return NextResponse.json(
        { error: 'Erro ao validar o e-mail' },
        { status: 500 },
      )
    }

    if (!prop) {
      return NextResponse.json(
        { error: 'E-mail não encontrado entre os proprietários' },
        { status: 404 },
      )
    }

    return NextResponse.json({ valid: true })
  } catch (e) {
    console.error('[validate-proprietario] unexpected error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
