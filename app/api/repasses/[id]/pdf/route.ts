import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: repasse, error } = await supabase
    .from('repasses')
    .select('id, pdf_url, proprietario_id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!repasse) {
    return NextResponse.json({ error: 'Repasse não encontrado' }, { status: 404 })
  }
  if (!repasse.pdf_url) {
    return NextResponse.json({ error: 'PDF ainda não gerado' }, { status: 404 })
  }

  const role = user.user_metadata?.role
  if (role !== UserRole.Admin) {
    // Proprietário só pode ver os próprios repasses — RLS já garante, mas reforçamos
    const { data: prop } = await supabase
      .from('proprietarios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!prop || prop.id !== repasse.proprietario_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  return NextResponse.redirect(repasse.pdf_url)
}
