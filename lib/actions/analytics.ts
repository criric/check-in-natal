'use server'

import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
} from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './_guards'
import {
  FiltroRelatorioSchema,
  type FiltroRelatorioInput,
} from '@/lib/validations'
import {
  Plataforma,
  StatusImovel,
  StatusReserva,
  type ActionResult,
  type MetricasCarteira,
  type MetricasMensais,
  type MetricasPorPlataforma,
  type RankingImovel,
} from '@/types'

const CUSTO_LIMPEZA_PADRAO = 80

type ReservaRow = {
  id: string
  imovel_id: string
  data_checkin: string
  data_checkout: string
  valor_bruto: number
  valor_liquido_proprietario: number | null
  taxa_plataforma: number
  plataforma: string | null
  status: string
  created_at: string | null
  nota_hospede: number | null
}

type ImovelRow = {
  id: string
  nome_interno: string
  bairro: string
  status: string
  comissao_percentual: number
}

function reservaConta(r: { status: string }): boolean {
  return (
    r.status !== StatusReserva.Cancelada && r.status !== StatusReserva.NoShow
  )
}

function noitesReserva(r: { data_checkin: string; data_checkout: string }): number {
  return Math.max(
    differenceInCalendarDays(parseISO(r.data_checkout), parseISO(r.data_checkin)),
    0,
  )
}

async function carregarBase(filtro: FiltroRelatorioInput): Promise<{
  reservas: ReservaRow[]
  imoveis: ImovelRow[]
  manutencoes: { custo_real: number | null; imovel_id: string }[]
  limpezas: { imovel_id: string }[]
  error?: string
}> {
  const supabase = await createClient()

  let qImoveis = supabase
    .from('imoveis')
    .select('id, nome_interno, bairro, status, comissao_percentual')
    .eq('status', StatusImovel.Ativo)
  if (filtro.imovel_id) qImoveis = qImoveis.eq('id', filtro.imovel_id)
  if (filtro.proprietario_id)
    qImoveis = qImoveis.eq('proprietario_id', filtro.proprietario_id)
  if (filtro.bairro) qImoveis = qImoveis.ilike('bairro', `%${filtro.bairro}%`)

  const { data: imoveis, error: imErr } = await qImoveis
  if (imErr) return { reservas: [], imoveis: [], manutencoes: [], limpezas: [], error: imErr.message }
  const idsImoveis = (imoveis ?? []).map((i) => i.id)
  if (idsImoveis.length === 0) {
    return { reservas: [], imoveis: imoveis ?? [], manutencoes: [], limpezas: [] }
  }

  const { data: reservas, error: rErr } = await supabase
    .from('reservas')
    .select(
      'id, imovel_id, data_checkin, data_checkout, valor_bruto, valor_liquido_proprietario, taxa_plataforma, plataforma, status, created_at, nota_hospede',
    )
    .in('imovel_id', idsImoveis)
    .lte('data_checkin', filtro.data_fim)
    .gte('data_checkout', filtro.data_inicio)
  if (rErr) return { reservas: [], imoveis: [], manutencoes: [], limpezas: [], error: rErr.message }

  const { data: manutencoes } = await supabase
    .from('manutencoes')
    .select('imovel_id, custo_real, status, data_resolucao')
    .in('imovel_id', idsImoveis)
    .gte('data_resolucao', filtro.data_inicio)
    .lte('data_resolucao', filtro.data_fim)

  const { data: limpezas } = await supabase
    .from('limpezas')
    .select('imovel_id, status, data_agendada')
    .in('imovel_id', idsImoveis)
    .gte('data_agendada', filtro.data_inicio)
    .lte('data_agendada', `${filtro.data_fim}T23:59:59.999Z`)

  return {
    reservas: (reservas ?? []) as ReservaRow[],
    imoveis: (imoveis ?? []) as ImovelRow[],
    manutencoes: (manutencoes ?? []) as {
      custo_real: number | null
      imovel_id: string
    }[],
    limpezas: (limpezas ?? []) as { imovel_id: string }[],
  }
}

export async function getMetricasCarteira(
  filtro: FiltroRelatorioInput,
): Promise<ActionResult<MetricasCarteira>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = FiltroRelatorioSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const f = parsed.data

  const base = await carregarBase(f)
  if (base.error) return { error: base.error }
  const { reservas, imoveis, manutencoes, limpezas } = base

  const diasPeriodo =
    differenceInCalendarDays(parseISO(f.data_fim), parseISO(f.data_inicio)) + 1
  const numImoveis = imoveis.length

  const validas = reservas.filter(reservaConta)
  const noitesOcupadas = validas.reduce((s, r) => s + noitesReserva(r), 0)
  const receitaTotal = validas.reduce((s, r) => s + Number(r.valor_bruto), 0)
  const comissaoTotal = validas.reduce((s, r) => {
    const imv = imoveis.find((i) => i.id === r.imovel_id)
    const pct = Number(imv?.comissao_percentual ?? 0)
    return s + Number(r.valor_bruto) * (pct / 100)
  }, 0)

  const leadTimes = validas
    .filter((r) => !!r.created_at)
    .map((r) =>
      Math.max(
        differenceInCalendarDays(parseISO(r.data_checkin), parseISO(r.created_at!)),
        0,
      ),
    )
  const leadTimeMedio = leadTimes.length
    ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
    : 0

  const canceladas = reservas.filter(
    (r) => r.status === StatusReserva.Cancelada,
  ).length
  const taxaCancelamento = reservas.length
    ? (canceladas / reservas.length) * 100
    : 0

  const custoManut = manutencoes.reduce(
    (s, m) => s + Number(m.custo_real ?? 0),
    0,
  )
  const custoLimpezas = limpezas.length * CUSTO_LIMPEZA_PADRAO
  const custoOperacional = custoManut + custoLimpezas

  const revpar =
    numImoveis > 0 && diasPeriodo > 0
      ? receitaTotal / (numImoveis * diasPeriodo)
      : 0
  const adr = noitesOcupadas > 0 ? receitaTotal / noitesOcupadas : 0
  const taxaOcupacao =
    numImoveis > 0 && diasPeriodo > 0
      ? (noitesOcupadas / (numImoveis * diasPeriodo)) * 100
      : 0
  const margemLiquida =
    comissaoTotal > 0 ? ((comissaoTotal - custoOperacional) / comissaoTotal) * 100 : 0

  return {
    data: {
      revpar: Number(revpar.toFixed(2)),
      adr: Number(adr.toFixed(2)),
      taxa_ocupacao: Number(taxaOcupacao.toFixed(2)),
      lead_time_medio: Number(leadTimeMedio.toFixed(1)),
      taxa_cancelamento: Number(taxaCancelamento.toFixed(2)),
      receita_total: Number(receitaTotal.toFixed(2)),
      custo_operacional: Number(custoOperacional.toFixed(2)),
      margem_liquida: Number(margemLiquida.toFixed(2)),
    },
  }
}

export async function getMetricasMensais(
  filtro: FiltroRelatorioInput,
): Promise<ActionResult<MetricasMensais[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = FiltroRelatorioSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const f = parsed.data
  const base = await carregarBase(f)
  if (base.error) return { error: base.error }
  const { reservas, imoveis } = base

  const validas = reservas.filter(reservaConta)
  const numImoveis = imoveis.length
  const buckets = new Map<string, {
    receita_bruta: number
    receita_liquida: number
    noites_ocupadas: number
    num_reservas: number
    notas: number[]
  }>()

  for (const r of validas) {
    const mes = r.data_checkin.slice(0, 7)
    const b = buckets.get(mes) ?? {
      receita_bruta: 0,
      receita_liquida: 0,
      noites_ocupadas: 0,
      num_reservas: 0,
      notas: [],
    }
    b.receita_bruta += Number(r.valor_bruto)
    b.receita_liquida += Number(r.valor_liquido_proprietario ?? 0)
    b.noites_ocupadas += noitesReserva(r)
    b.num_reservas += 1
    if (r.nota_hospede != null) b.notas.push(Number(r.nota_hospede))
    buckets.set(mes, b)
  }

  const out: MetricasMensais[] = []
  for (const [mes, b] of buckets) {
    const [ano, mesNum] = mes.split('-').map(Number)
    const diasMes = new Date(ano, mesNum, 0).getDate()
    const ocupacao =
      numImoveis > 0 ? (b.noites_ocupadas / (numImoveis * diasMes)) * 100 : 0
    const notaMedia = b.notas.length
      ? b.notas.reduce((a, b) => a + b, 0) / b.notas.length
      : 0
    out.push({
      mes,
      receita_bruta: Number(b.receita_bruta.toFixed(2)),
      receita_liquida: Number(b.receita_liquida.toFixed(2)),
      noites_ocupadas: b.noites_ocupadas,
      taxa_ocupacao: Number(ocupacao.toFixed(2)),
      num_reservas: b.num_reservas,
      nota_media: Number(notaMedia.toFixed(2)),
    })
  }

  out.sort((a, b) => a.mes.localeCompare(b.mes))
  return { data: out }
}

export async function getMetricasPorPlataforma(
  filtro: FiltroRelatorioInput,
): Promise<ActionResult<MetricasPorPlataforma[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = FiltroRelatorioSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const f = parsed.data
  const base = await carregarBase(f)
  if (base.error) return { error: base.error }
  const validas = base.reservas.filter(reservaConta)

  const buckets = new Map<string, { num: number; receita: number }>()
  let totalReceita = 0
  for (const r of validas) {
    const plat = (r.plataforma as Plataforma) ?? Plataforma.Outro
    const b = buckets.get(plat) ?? { num: 0, receita: 0 }
    b.num += 1
    b.receita += Number(r.valor_bruto)
    totalReceita += Number(r.valor_bruto)
    buckets.set(plat, b)
  }

  const out: MetricasPorPlataforma[] = []
  for (const [plat, b] of buckets) {
    out.push({
      plataforma: plat,
      num_reservas: b.num,
      receita_total: Number(b.receita.toFixed(2)),
      ticket_medio: b.num > 0 ? Number((b.receita / b.num).toFixed(2)) : 0,
      percentual:
        totalReceita > 0
          ? Number(((b.receita / totalReceita) * 100).toFixed(2))
          : 0,
    })
  }
  out.sort((a, b) => b.receita_total - a.receita_total)
  return { data: out }
}

export async function getRankingImoveis(
  filtro: FiltroRelatorioInput,
): Promise<ActionResult<RankingImovel[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = FiltroRelatorioSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const f = parsed.data
  const base = await carregarBase(f)
  if (base.error) return { error: base.error }

  const diasPeriodo =
    differenceInCalendarDays(parseISO(f.data_fim), parseISO(f.data_inicio)) + 1

  const ranking: RankingImovel[] = base.imoveis.map((imv) => {
    const rsv = base.reservas.filter(
      (r) => r.imovel_id === imv.id && reservaConta(r),
    )
    const noites = rsv.reduce((s, r) => s + noitesReserva(r), 0)
    const receita = rsv.reduce((s, r) => s + Number(r.valor_bruto), 0)
    const comissao = receita * (Number(imv.comissao_percentual ?? 0) / 100)
    const notas = rsv
      .map((r) => r.nota_hospede)
      .filter((n): n is number => n != null)
    const notaMedia = notas.length
      ? notas.reduce((a, b) => a + b, 0) / notas.length
      : 0

    const manuts = base.manutencoes.filter((m) => m.imovel_id === imv.id)
    const limps = base.limpezas.filter((l) => l.imovel_id === imv.id)
    const custoOp =
      manuts.reduce((s, m) => s + Number(m.custo_real ?? 0), 0) +
      limps.length * CUSTO_LIMPEZA_PADRAO

    const revpar = diasPeriodo > 0 ? receita / diasPeriodo : 0
    const adr = noites > 0 ? receita / noites : 0
    const ocupacao = diasPeriodo > 0 ? (noites / diasPeriodo) * 100 : 0
    const margem = comissao > 0 ? ((comissao - custoOp) / comissao) * 100 : 0

    return {
      imovel_id: imv.id,
      nome_interno: imv.nome_interno,
      bairro: imv.bairro,
      revpar: Number(revpar.toFixed(2)),
      adr: Number(adr.toFixed(2)),
      taxa_ocupacao: Number(ocupacao.toFixed(2)),
      receita_mes: Number(receita.toFixed(2)),
      custo_operacional: Number(custoOp.toFixed(2)),
      margem: Number(margem.toFixed(2)),
      nota_media: Number(notaMedia.toFixed(2)),
    }
  })

  ranking.sort((a, b) => b.revpar - a.revpar)
  return { data: ranking }
}

export async function getHeatmapOcupacao(
  imovelId?: string,
  ano?: number,
): Promise<ActionResult<Record<string, number>>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const targetAno = ano ?? new Date().getFullYear()
  const dataInicio = `${targetAno}-01-01`
  const dataFim = `${targetAno}-12-31`

  const supabase = await createClient()
  let qImoveis = supabase
    .from('imoveis')
    .select('id')
    .eq('status', StatusImovel.Ativo)
  if (imovelId) qImoveis = qImoveis.eq('id', imovelId)
  const { data: imoveis, error: imErr } = await qImoveis
  if (imErr) return { error: imErr.message }
  const ids = (imoveis ?? []).map((i) => i.id)
  if (ids.length === 0) return { data: {} }

  const { data: reservas, error: rErr } = await supabase
    .from('reservas')
    .select('imovel_id, data_checkin, data_checkout, status')
    .in('imovel_id', ids)
    .lte('data_checkin', dataFim)
    .gte('data_checkout', dataInicio)
  if (rErr) return { error: rErr.message }

  const noitesPorDia = new Map<string, number>()
  for (const r of reservas ?? []) {
    if (!reservaConta(r as { status: string })) continue
    let cursor = parseISO(r.data_checkin)
    const fim = parseISO(r.data_checkout)
    while (cursor < fim) {
      const key = format(cursor, 'yyyy-MM-dd')
      noitesPorDia.set(key, (noitesPorDia.get(key) ?? 0) + 1)
      cursor = addDays(cursor, 1)
    }
  }

  const out: Record<string, number> = {}
  let cursor = parseISO(dataInicio)
  const limite = parseISO(dataFim)
  while (cursor <= limite) {
    const key = format(cursor, 'yyyy-MM-dd')
    const ocupados = noitesPorDia.get(key) ?? 0
    if (imovelId) {
      out[key] = ocupados > 0 ? 1 : 0
    } else {
      out[key] = ids.length > 0 ? Number(((ocupados / ids.length) * 100).toFixed(0)) : 0
    }
    cursor = addDays(cursor, 1)
  }
  return { data: out }
}

export async function getLeadTimePorMes(
  filtro: FiltroRelatorioInput,
): Promise<ActionResult<Array<{ mes: string; lead_time_medio: number }>>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = FiltroRelatorioSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const f = parsed.data
  const base = await carregarBase(f)
  if (base.error) return { error: base.error }

  const buckets = new Map<string, number[]>()
  for (const r of base.reservas.filter(reservaConta)) {
    if (!r.created_at) continue
    const mes = r.data_checkin.slice(0, 7)
    const lt = Math.max(
      differenceInCalendarDays(parseISO(r.data_checkin), parseISO(r.created_at)),
      0,
    )
    const arr = buckets.get(mes) ?? []
    arr.push(lt)
    buckets.set(mes, arr)
  }

  const out = Array.from(buckets.entries())
    .map(([mes, arr]) => ({
      mes,
      lead_time_medio: Number(
        (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
      ),
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  return { data: out }
}
