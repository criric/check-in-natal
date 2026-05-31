'use server'

import { revalidatePath } from 'next/cache'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  GerarRepasseSchema,
  type GerarRepasseInput,
} from '@/lib/validations'
import { gerarPdfRepasse, type DadosRepasse } from '@/lib/utils/pdf'
import { enviarExtratoRepasse } from '@/lib/utils/emails'
import { formatMesAno } from '@/lib/utils/formatters'
import {
  Plataforma,
  StatusRepasse,
  StatusReserva,
  type ActionResult,
  type PreviewRepasse,
} from '@/types'

const PDF_BUCKET = 'repasses-pdf'

export type RepassesFilters = {
  proprietario_id?: string
  imovel_id?: string
  mes?: number
  ano?: number
  status?: StatusRepasse
}

type ReservaRow = {
  id: string
  data_checkin: string
  data_checkout: string
  plataforma: string | null
  valor_bruto: number
  taxa_plataforma: number
  valor_liquido_proprietario: number | null
  status: string
}

function reservaContaParaRepasse(r: ReservaRow): boolean {
  return (
    r.status !== StatusReserva.Cancelada && r.status !== StatusReserva.NoShow
  )
}

export async function calcularRepassePreview(
  imovelId: string,
  mes: number,
  ano: number,
): Promise<ActionResult<PreviewRepasse>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()

  const { data: imovel, error: imErr } = await supabase
    .from('imoveis')
    .select('id, comissao_percentual')
    .eq('id', imovelId)
    .maybeSingle()
  if (imErr) return { error: imErr.message }
  if (!imovel) return { error: 'Imóvel não encontrado' }

  const comissaoPct = Number(imovel.comissao_percentual ?? 0)

  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('reservas')
    .select(
      'id, data_checkin, data_checkout, plataforma, valor_bruto, taxa_plataforma, valor_liquido_proprietario, status',
    )
    .eq('imovel_id', imovelId)
    .gte('data_checkout', inicio)
    .lte('data_checkout', fim)
    .order('data_checkout', { ascending: true })

  if (error) return { error: error.message }

  const reservas = ((data ?? []) as ReservaRow[]).filter(reservaContaParaRepasse)

  let receita_bruta = 0
  let valor_liquido_total = 0
  const itens = reservas.map((r) => {
    const noites = differenceInCalendarDays(
      parseISO(r.data_checkout),
      parseISO(r.data_checkin),
    )
    const valor_bruto = Number(r.valor_bruto)
    const taxa = Number(r.taxa_plataforma)
    const baseLiquida = valor_bruto - taxa
    const valor_liquido =
      r.valor_liquido_proprietario != null
        ? Number(r.valor_liquido_proprietario)
        : Number((baseLiquida * (1 - comissaoPct / 100)).toFixed(2))

    receita_bruta += valor_bruto
    valor_liquido_total += valor_liquido
    return {
      id: r.id,
      data_checkin: r.data_checkin,
      data_checkout: r.data_checkout,
      noites,
      plataforma: (r.plataforma as Plataforma) ?? Plataforma.Outro,
      valor_bruto,
      taxa_plataforma: taxa,
      valor_liquido,
    }
  })

  const comissao_valor = Number(((receita_bruta) * (comissaoPct / 100)).toFixed(2))

  return {
    data: {
      receita_bruta: Number(receita_bruta.toFixed(2)),
      comissao_percentual: comissaoPct,
      comissao_valor,
      valor_liquido_total: Number(valor_liquido_total.toFixed(2)),
      num_reservas: itens.length,
      reservas: itens,
    },
  }
}

export async function gerarRepasse(
  input: GerarRepasseInput,
): Promise<ActionResult<{ id: string; pdf_url: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = GerarRepasseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('repasses')
    .select('id')
    .eq('imovel_id', d.imovel_id)
    .eq('competencia_mes', d.competencia_mes)
    .eq('competencia_ano', d.competencia_ano)
    .maybeSingle()
  if (existente) {
    return { error: 'Já existe repasse para este imóvel nesta competência' }
  }

  // Imóvel + proprietário
  const { data: imovel, error: imErr } = await admin
    .from('imoveis')
    .select(
      `
      id, nome_interno, endereco_completo, bairro, comissao_percentual,
      proprietario:proprietarios!inner(id, nome, email, cpf_cnpj)
    `,
    )
    .eq('id', d.imovel_id)
    .maybeSingle()
  if (imErr) return { error: imErr.message }
  if (!imovel) return { error: 'Imóvel não encontrado' }

  const proprietario = (imovel as unknown as {
    proprietario: { id: string; nome: string; email: string; cpf_cnpj: string }
  }).proprietario

  const preview = await calcularRepassePreview(
    d.imovel_id,
    d.competencia_mes,
    d.competencia_ano,
  )
  if (preview.error || !preview.data) {
    return { error: preview.error ?? 'Erro ao calcular preview' }
  }

  const valor_repassado = Number(
    (
      preview.data.valor_liquido_total -
      (d.deducoes_manutencao ?? 0) -
      (d.deducoes_outros ?? 0)
    ).toFixed(2),
  )

  const { data: repasse, error: insErr } = await admin
    .from('repasses')
    .insert({
      proprietario_id: proprietario.id,
      imovel_id: d.imovel_id,
      competencia_mes: d.competencia_mes,
      competencia_ano: d.competencia_ano,
      receita_bruta: preview.data.receita_bruta,
      comissao_gestora: preview.data.comissao_valor,
      deducoes_manutencao: d.deducoes_manutencao,
      deducoes_outros: d.deducoes_outros,
      valor_repassado,
      status: StatusRepasse.Pendente,
      observacoes: d.observacoes ?? null,
    })
    .select('id')
    .single()

  if (insErr || !repasse) {
    return { error: insErr?.message ?? 'Erro ao criar repasse' }
  }

  // Gera PDF
  const dadosPdf: DadosRepasse = {
    proprietario: {
      nome: proprietario.nome,
      cpf_cnpj: proprietario.cpf_cnpj,
      email: proprietario.email,
    },
    imovel: {
      nome_interno: imovel.nome_interno,
      endereco_completo: imovel.endereco_completo,
      bairro: imovel.bairro,
    },
    competencia: { mes: d.competencia_mes, ano: d.competencia_ano },
    data_emissao: new Date().toISOString().slice(0, 10),
    reservas: preview.data.reservas.map((r) => ({
      data_checkin: r.data_checkin,
      data_checkout: r.data_checkout,
      noites: r.noites,
      plataforma: r.plataforma,
      valor_bruto: r.valor_bruto,
      taxa_plataforma: r.taxa_plataforma,
      valor_liquido: r.valor_liquido,
    })),
    receita_bruta: preview.data.receita_bruta,
    comissao_percentual: preview.data.comissao_percentual,
    comissao_valor: preview.data.comissao_valor,
    deducoes_manutencao: d.deducoes_manutencao,
    deducoes_outros: d.deducoes_outros,
    valor_repassado,
    observacoes: d.observacoes,
  }

  let pdfUrl = ''
  try {
    const pdfBuffer = await gerarPdfRepasse(dadosPdf)
    const pdfPath = `${proprietario.id}/${d.competencia_ano}-${String(d.competencia_mes).padStart(2, '0')}-${repasse.id}.pdf`

    const { error: upErr } = await admin.storage
      .from(PDF_BUCKET)
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (upErr) {
      return { error: `Erro ao subir PDF: ${upErr.message}` }
    }

    const { data: pub } = admin.storage.from(PDF_BUCKET).getPublicUrl(pdfPath)
    pdfUrl = pub.publicUrl

    await admin
      .from('repasses')
      .update({ pdf_url: pdfUrl })
      .eq('id', repasse.id)
  } catch (e) {
    return {
      error: `Erro ao gerar PDF: ${e instanceof Error ? e.message : 'desconhecido'}`,
    }
  }

  // Dispara e-mail (não bloqueia em caso de falha)
  try {
    await enviarExtratoRepasse(
      proprietario.email,
      proprietario.nome,
      formatMesAno(d.competencia_mes, d.competencia_ano),
      valor_repassado,
      pdfUrl,
      {
        receitaBruta: preview.data.receita_bruta,
        comissao: preview.data.comissao_valor,
        deducoes: (d.deducoes_manutencao ?? 0) + (d.deducoes_outros ?? 0),
      },
    )
  } catch {
    // ignora
  }

  revalidatePath('/repasses')
  return { data: { id: repasse.id, pdf_url: pdfUrl } }
}

export async function getRepasses(
  filters?: RepassesFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('repasses')
    .select(
      `
      *,
      proprietario:proprietarios!inner(id, nome, email),
      imovel:imoveis!inner(id, nome_interno, bairro)
    `,
    )
    .order('competencia_ano', { ascending: false })
    .order('competencia_mes', { ascending: false })

  if (filters?.proprietario_id)
    query = query.eq('proprietario_id', filters.proprietario_id)
  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
  if (filters?.mes) query = query.eq('competencia_mes', filters.mes)
  if (filters?.ano) query = query.eq('competencia_ano', filters.ano)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function marcarRepassePago(
  id: string,
  data_repasse: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_repasse)) {
    return { error: 'Data inválida (formato esperado: YYYY-MM-DD)' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('repasses')
    .update({ status: StatusRepasse.Pago, data_repasse })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/repasses')
  return { data: { id } }
}
