import { NextResponse } from 'next/server'
import { LeadSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarAdminNovoLead } from '@/lib/utils/emails'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = LeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 },
      )
    }
    const d = parsed.data

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('leads')
      .insert({
        nome: d.nome,
        telefone: d.telefone,
        email: d.email || null,
        bairro_imovel: d.bairro_imovel ?? null,
        mensagem: d.mensagem ?? null,
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Erro ao salvar lead' },
        { status: 500 },
      )
    }

    // Notifica admin em background — falhas não afetam a resposta
    notificarAdminNovoLead({
      nome: d.nome,
      telefone: d.telefone,
      email: d.email || undefined,
      bairro_imovel: d.bairro_imovel,
      mensagem: d.mensagem,
    }).catch(() => {})

    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
