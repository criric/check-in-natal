'use server'

import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { requireProprietario } from './_guards'
import { StatusRepasse, StatusReserva, type ActionResult } from '@/types'

export type RepasseMesAtual = {
  id?: string
  mes: number
  ano: number
  receita_bruta: number
  comissao_gestora: number
  deducoes: number
  valor_repassado: number
  status?: StatusRepasse
  data_repasse?: string
  pdf_url?: string
}

export type ProximaReservaPortal = {
  id: string
  data_checkin: string
  data_checkout: string
  noites: number
  plataforma: string
  imovel_nome: string
  imovel_bairro: string
}

export type ResumoPortal = {
  repasse_mes: RepasseMesAtual
  receita_12m: Array<{ mes: string; receita: number }>
  proximas_reservas: ProximaReservaPortal[]
  ocupacao_mes: number
  ocupacao_media_carteira: number
  total_imoveis_ativos: number
  receita_acumulada_ano: number
}

export async function getResumoProprietario(): Promise<ActionResult<ResumoPortal>> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) {
    return { error: 'Proprietário não vinculado ao usuário' }
  }

  const supabase = await createClient()
  const propId = g.user.proprietario_id

  const { data: imoveis, error: imErr } = await supabase
    .from('imoveis')
    .select('id, status, comissao_percentual')
    .eq('proprietario_id', propId)
  if (imErr) return { error: imErr.message }

  const idsImoveis = (imoveis ?? []).map((i) => i.id)
  const total_imoveis_ativos = (imoveis ?? []).filter(
    (i) => i.status === 'ativo',
  ).length

  if (idsImoveis.length === 0) {
    return {
      data: {
        repasse_mes: {
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          receita_bruta: 0,
          comissao_gestora: 0,
          deducoes: 0,
          valor_repassado: 0,
        },
        receita_12m: [],
        proximas_reservas: [],
        ocupacao_mes: 0,
        ocupacao_media_carteira: 0,
        total_imoveis_ativos: 0,
        receita_acumulada_ano: 0,
      },
    }
  }

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()

  // Repasse do mês mais recente disponível para o proprietário (pode não existir ainda)
  const { data: repasses } = await supabase
    .from('repasses')
    .select(
      'id, competencia_mes, competencia_ano, receita_bruta, comissao_gestora, deducoes_manutencao, deducoes_outros, valor_repassado, status, data_repasse, pdf_url',
    )
    .eq('proprietario_id', propId)
    .order('competencia_ano', { ascending: false })
    .order('competencia_mes', { ascending: false })
    .limit(1)

  const ultRepasse = (repasses ?? [])[0]
  const repasse_mes: RepasseMesAtual = ultRepasse
    ? {
        id: ultRepasse.id,
        mes: ultRepasse.competencia_mes,
        ano: ultRepasse.competencia_ano,
        receita_bruta: Number(ultRepasse.receita_bruta ?? 0),
        comissao_gestora: Number(ultRepasse.comissao_gestora ?? 0),
        deducoes:
          Number(ultRepasse.deducoes_manutencao ?? 0) +
          Number(ultRepasse.deducoes_outros ?? 0),
        valor_repassado: Number(ultRepasse.valor_repassado ?? 0),
        status: ultRepasse.status as StatusRepasse,
        data_repasse: ultRepasse.data_repasse ?? undefined,
        pdf_url: ultRepasse.pdf_url ?? undefined,
      }
    : {
        mes: mesAtual,
        ano: anoAtual,
        receita_bruta: 0,
        comissao_gestora: 0,
        deducoes: 0,
        valor_repassado: 0,
      }

  // Receita dos últimos 12 meses (a partir das reservas com checkout no período)
  const inicio12m = format(startOfMonth(subMonths(hoje, 11)), 'yyyy-MM-dd')
  const fim12m = format(endOfMonth(hoje), 'yyyy-MM-dd')

  const { data: reservas } = await supabase
    .from('reservas')
    .select(
      'data_checkin, data_checkout, valor_bruto, valor_liquido_proprietario, status, plataforma, nome_hospede, imovel:imoveis!inner(id, nome_interno, bairro, proprietario_id)',
    )
    .gte('data_checkout', inicio12m)
    .lte('data_checkout', fim12m)
    .in('imovel_id', idsImoveis)

  const reservasValidas = (reservas ?? []).filter(
    (r) =>
      r.status !== StatusReserva.Cancelada &&
      r.status !== StatusReserva.NoShow,
  )

  const buckets = new Map<string, number>()
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(hoje, i)
    const key = format(d, 'yyyy-MM')
    buckets.set(key, 0)
  }
  for (const r of reservasValidas) {
    const key = r.data_checkout.slice(0, 7)
    buckets.set(
      key,
      (buckets.get(key) ?? 0) + Number(r.valor_liquido_proprietario ?? 0),
    )
  }
  const receita_12m = Array.from(buckets.entries()).map(([mes, receita]) => ({
    mes,
    receita: Number(receita.toFixed(2)),
  }))

  const receita_acumulada_ano = reservasValidas
    .filter((r) => r.data_checkout.startsWith(String(anoAtual)))
    .reduce((s, r) => s + Number(r.valor_liquido_proprietario ?? 0), 0)

  // Próximas reservas
  const hojeStr = format(hoje, 'yyyy-MM-dd')
  const { data: futuras } = await supabase
    .from('reservas')
    .select(
      'id, data_checkin, data_checkout, plataforma, imovel:imoveis!inner(nome_interno, bairro)',
    )
    .in('imovel_id', idsImoveis)
    .gte('data_checkin', hojeStr)
    .order('data_checkin', { ascending: true })
    .limit(3)

  const proximas_reservas: ProximaReservaPortal[] = (futuras ?? []).map((r) => ({
    id: r.id,
    data_checkin: r.data_checkin,
    data_checkout: r.data_checkout,
    noites: differenceInCalendarDays(
      parseISO(r.data_checkout),
      parseISO(r.data_checkin),
    ),
    plataforma: r.plataforma ?? 'outro',
    imovel_nome:
      (r.imovel as unknown as { nome_interno: string })?.nome_interno ?? '',
    imovel_bairro:
      (r.imovel as unknown as { bairro: string })?.bairro ?? '',
  }))

  // Ocupação do mês atual para os imóveis do proprietário
  const inicioMes = startOfMonth(hoje)
  const fimMes = endOfMonth(hoje)
  const diasMes = differenceInCalendarDays(fimMes, inicioMes) + 1

  let noitesOcupadasProp = 0
  for (const r of reservasValidas) {
    const ci = parseISO(r.data_checkin)
    const co = parseISO(r.data_checkout)
    const inicioInter = ci > inicioMes ? ci : inicioMes
    const fimInter = co < fimMes ? co : fimMes
    const diff = differenceInCalendarDays(fimInter, inicioInter)
    if (diff > 0) noitesOcupadasProp += diff
  }
  const ocupacao_mes =
    idsImoveis.length > 0 && diasMes > 0
      ? Number(
          (
            (noitesOcupadasProp / (idsImoveis.length * diasMes)) *
            100
          ).toFixed(1),
        )
      : 0

  // Média da carteira (todos os imóveis ativos do sistema)
  const { data: imoveisCarteira } = await supabase
    .from('imoveis')
    .select('id')
    .eq('status', 'ativo')
  const idsCarteira = (imoveisCarteira ?? []).map((i) => i.id)
  let ocupacao_media_carteira = 0
  if (idsCarteira.length > 0) {
    const { data: reservasCart } = await supabase
      .from('reservas')
      .select('data_checkin, data_checkout, status')
      .in('imovel_id', idsCarteira)
      .gte('data_checkout', format(inicioMes, 'yyyy-MM-dd'))
      .lte('data_checkin', format(fimMes, 'yyyy-MM-dd'))
    let noitesCart = 0
    for (const r of (reservasCart ?? []).filter(
      (x) =>
        x.status !== StatusReserva.Cancelada &&
        x.status !== StatusReserva.NoShow,
    )) {
      const ci = parseISO(r.data_checkin)
      const co = parseISO(r.data_checkout)
      const inicioInter = ci > inicioMes ? ci : inicioMes
      const fimInter = co < fimMes ? co : fimMes
      const diff = differenceInCalendarDays(fimInter, inicioInter)
      if (diff > 0) noitesCart += diff
    }
    ocupacao_media_carteira = Number(
      ((noitesCart / (idsCarteira.length * diasMes)) * 100).toFixed(1),
    )
  }

  return {
    data: {
      repasse_mes,
      receita_12m,
      proximas_reservas,
      ocupacao_mes,
      ocupacao_media_carteira,
      total_imoveis_ativos,
      receita_acumulada_ano: Number(receita_acumulada_ano.toFixed(2)),
    },
  }
}

export type ImovelDoProprietario = {
  id: string
  nome_interno: string
  bairro: string
  cidade?: string
  status: string
  capacidade_hospedes?: number
  numero_quartos?: number
  numero_banheiros?: number
  tipo?: string
  foto_principal?: string
  taxa_ocupacao_mes: number
  receita_mes: number
  nota_media: number
}

export async function getImoveisDoProprietario(): Promise<
  ActionResult<ImovelDoProprietario[]>
> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) return { error: 'Proprietário não vinculado' }

  const supabase = await createClient()
  const hoje = new Date()
  const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd')
  const diasMes =
    differenceInCalendarDays(endOfMonth(hoje), startOfMonth(hoje)) + 1

  const { data, error } = await supabase
    .from('imoveis')
    .select(
      `
      id, nome_interno, bairro, cidade, status, tipo,
      capacidade_hospedes, numero_quartos, numero_banheiros,
      fotos:fotos_imoveis(url, ordem),
      reservas(data_checkin, data_checkout, valor_bruto, valor_liquido_proprietario, status, nota_hospede)
    `,
    )
    .eq('proprietario_id', g.user.proprietario_id)
    .order('nome_interno', { ascending: true })

  if (error) return { error: error.message }

  const rows: ImovelDoProprietario[] = (data ?? []).map((row) => {
    const fotos = (row.fotos ?? []) as { url: string; ordem: number }[]
    const principal = fotos.slice().sort((a, b) => a.ordem - b.ordem)[0]

    const reservas = (row.reservas ?? []) as {
      data_checkin: string
      data_checkout: string
      valor_bruto: number
      valor_liquido_proprietario: number | null
      status: string
      nota_hospede: number | null
    }[]

    const validas = reservas.filter(
      (r) =>
        r.status !== StatusReserva.Cancelada &&
        r.status !== StatusReserva.NoShow,
    )

    let noites = 0
    let receita = 0
    for (const r of validas) {
      if (r.data_checkin <= fimMes && r.data_checkout >= inicioMes) {
        const ci = parseISO(r.data_checkin)
        const co = parseISO(r.data_checkout)
        const a = ci > parseISO(inicioMes) ? ci : parseISO(inicioMes)
        const b = co < parseISO(fimMes) ? co : parseISO(fimMes)
        const diff = differenceInCalendarDays(b, a)
        if (diff > 0) noites += diff
      }
      if (
        r.data_checkout >= inicioMes &&
        r.data_checkout <= fimMes &&
        r.valor_liquido_proprietario != null
      ) {
        receita += Number(r.valor_liquido_proprietario)
      }
    }
    const ocupacao = diasMes > 0 ? (noites / diasMes) * 100 : 0
    const notas = validas
      .map((r) => r.nota_hospede)
      .filter((n): n is number => n != null)
    const nota = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0

    return {
      id: row.id,
      nome_interno: row.nome_interno,
      bairro: row.bairro,
      cidade: row.cidade ?? undefined,
      status: row.status,
      tipo: row.tipo ?? undefined,
      capacidade_hospedes: row.capacidade_hospedes ?? undefined,
      numero_quartos: row.numero_quartos ?? undefined,
      numero_banheiros: row.numero_banheiros ?? undefined,
      foto_principal: principal?.url ?? undefined,
      taxa_ocupacao_mes: Number(ocupacao.toFixed(1)),
      receita_mes: Number(receita.toFixed(2)),
      nota_media: Number(nota.toFixed(1)),
    }
  })

  return { data: rows }
}

export type DetalheImovelPortal = {
  id: string
  nome_interno: string
  endereco_completo: string
  bairro: string
  cidade?: string
  status: string
  tipo?: string
  capacidade_hospedes?: number
  numero_quartos?: number
  numero_banheiros?: number
  andar?: number
  nome_condominio?: string
  fotos: Array<{ url: string; legenda?: string }>
  avaliacoes: Array<{
    nota: number
    comentario?: string
    data_checkout: string
    plataforma?: string
  }>
}

export async function getDetalheImovelPortal(
  imovelId: string,
): Promise<ActionResult<DetalheImovelPortal>> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) return { error: 'Proprietário não vinculado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select(
      `
      id, nome_interno, endereco_completo, bairro, cidade, status, tipo,
      capacidade_hospedes, numero_quartos, numero_banheiros, andar, nome_condominio,
      fotos:fotos_imoveis(url, legenda, ordem),
      reservas(data_checkout, nota_hospede, comentario_hospede, plataforma, status)
    `,
    )
    .eq('id', imovelId)
    .eq('proprietario_id', g.user.proprietario_id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Imóvel não encontrado' }

  const fotos = ((data.fotos ?? []) as {
    url: string
    legenda?: string
    ordem: number
  }[])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((f) => ({ url: f.url, legenda: f.legenda }))

  const avaliacoes = ((data.reservas ?? []) as {
    data_checkout: string
    nota_hospede: number | null
    comentario_hospede: string | null
    plataforma: string | null
    status: string
  }[])
    .filter((r) => r.nota_hospede != null)
    .sort((a, b) => b.data_checkout.localeCompare(a.data_checkout))
    .slice(0, 5)
    .map((r) => ({
      nota: Number(r.nota_hospede),
      comentario: r.comentario_hospede ?? undefined,
      data_checkout: r.data_checkout,
      plataforma: r.plataforma ?? undefined,
    }))

  return {
    data: {
      id: data.id,
      nome_interno: data.nome_interno,
      endereco_completo: data.endereco_completo,
      bairro: data.bairro,
      cidade: data.cidade ?? undefined,
      status: data.status,
      tipo: data.tipo ?? undefined,
      capacidade_hospedes: data.capacidade_hospedes ?? undefined,
      numero_quartos: data.numero_quartos ?? undefined,
      numero_banheiros: data.numero_banheiros ?? undefined,
      andar: data.andar ?? undefined,
      nome_condominio: data.nome_condominio ?? undefined,
      fotos,
      avaliacoes,
    },
  }
}

export type ReservaPortal = {
  id: string
  data_checkin: string
  data_checkout: string
  noites: number
  plataforma: string
  valor_bruto: number
  comissao_estimada: number
  valor_liquido: number
  status: string
  nota_hospede?: number
  imovel_nome: string
}

export async function getReservasProprietario(filtro?: {
  data_inicio?: string
  data_fim?: string
}): Promise<ActionResult<ReservaPortal[]>> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) return { error: 'Proprietário não vinculado' }

  const supabase = await createClient()
  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, comissao_percentual, nome_interno')
    .eq('proprietario_id', g.user.proprietario_id)
  const idsImoveis = (imoveis ?? []).map((i) => i.id)
  if (idsImoveis.length === 0) return { data: [] }
  const comissoes = new Map<string, { pct: number; nome: string }>(
    (imoveis ?? []).map((i) => [
      i.id,
      {
        pct: Number(i.comissao_percentual ?? 0),
        nome: i.nome_interno,
      },
    ]),
  )

  let q = supabase
    .from('reservas')
    .select(
      'id, imovel_id, data_checkin, data_checkout, valor_bruto, taxa_plataforma, valor_liquido_proprietario, plataforma, status, nota_hospede',
    )
    .in('imovel_id', idsImoveis)
    .order('data_checkin', { ascending: false })

  if (filtro?.data_inicio) q = q.gte('data_checkin', filtro.data_inicio)
  if (filtro?.data_fim) q = q.lte('data_checkout', filtro.data_fim)

  const { data, error } = await q
  if (error) return { error: error.message }

  const out: ReservaPortal[] = (data ?? []).map((r) => {
    const noites = differenceInCalendarDays(
      parseISO(r.data_checkout),
      parseISO(r.data_checkin),
    )
    const info = comissoes.get(r.imovel_id)
    const pct = info?.pct ?? 0
    const valor_bruto = Number(r.valor_bruto)
    const taxa = Number(r.taxa_plataforma ?? 0)
    const valor_liquido =
      r.valor_liquido_proprietario != null
        ? Number(r.valor_liquido_proprietario)
        : Number(((valor_bruto - taxa) * (1 - pct / 100)).toFixed(2))
    const comissao_estimada = Number(((valor_bruto - taxa) * (pct / 100)).toFixed(2))

    return {
      id: r.id,
      data_checkin: r.data_checkin,
      data_checkout: r.data_checkout,
      noites,
      plataforma: r.plataforma ?? 'outro',
      valor_bruto,
      comissao_estimada,
      valor_liquido,
      status: r.status,
      nota_hospede: r.nota_hospede ?? undefined,
      imovel_nome: info?.nome ?? '',
    }
  })

  return { data: out }
}

export type RepassePortal = {
  id: string
  competencia_mes: number
  competencia_ano: number
  receita_bruta: number
  comissao_gestora: number
  deducoes: number
  valor_repassado: number
  status: StatusRepasse
  data_repasse?: string
  pdf_url?: string
  imovel_nome: string
}

export async function getRepassesProprietario(): Promise<
  ActionResult<RepassePortal[]>
> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) return { error: 'Proprietário não vinculado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('repasses')
    .select(
      `id, competencia_mes, competencia_ano, receita_bruta, comissao_gestora,
       deducoes_manutencao, deducoes_outros, valor_repassado, status,
       data_repasse, pdf_url, imovel:imoveis!inner(nome_interno)`,
    )
    .eq('proprietario_id', g.user.proprietario_id)
    .order('competencia_ano', { ascending: false })
    .order('competencia_mes', { ascending: false })

  if (error) return { error: error.message }

  const rows: RepassePortal[] = (data ?? []).map((r) => ({
    id: r.id,
    competencia_mes: r.competencia_mes,
    competencia_ano: r.competencia_ano,
    receita_bruta: Number(r.receita_bruta ?? 0),
    comissao_gestora: Number(r.comissao_gestora ?? 0),
    deducoes:
      Number(r.deducoes_manutencao ?? 0) + Number(r.deducoes_outros ?? 0),
    valor_repassado: Number(r.valor_repassado ?? 0),
    status: r.status as StatusRepasse,
    data_repasse: r.data_repasse ?? undefined,
    pdf_url: r.pdf_url ?? undefined,
    imovel_nome:
      (r.imovel as unknown as { nome_interno: string })?.nome_interno ?? '',
  }))

  return { data: rows }
}

export async function getManutencoesProprietario(): Promise<
  ActionResult<unknown[]>
> {
  const g = await requireProprietario()
  if (!g.ok) return { error: g.error }
  if (!g.user.proprietario_id) return { error: 'Proprietário não vinculado' }

  const supabase = await createClient()
  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id')
    .eq('proprietario_id', g.user.proprietario_id)
  const ids = (imoveis ?? []).map((i) => i.id)
  if (ids.length === 0) return { data: [] }

  const { data, error } = await supabase
    .from('manutencoes')
    .select(
      `
      *,
      imovel:imoveis!inner(id, nome_interno)
    `,
    )
    .in('imovel_id', ids)
    .order('data_abertura', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}
