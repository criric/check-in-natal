'use server'

import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
  subYears,
} from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './_guards'
import { calcularTaxaOcupacao } from '@/lib/utils/metricas'
import {
  Plataforma,
  StatusImovel,
  StatusReserva,
  type ActionResult,
} from '@/types'

export type ImovelDashboard = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number
  latitude?: number
  longitude?: number
  proprietario: { id: string; nome: string }
  proxima_reserva?: {
    data_checkin: string
    data_checkout: string
    plataforma: Plataforma
    nome_hospede?: string
  }
  ocupado_hoje: boolean
  em_manutencao: boolean
  taxa_ocupacao_mes: number
  receita_mes: number
  nota_media: number
  total_avaliacoes: number
}

export type DashboardKpis = {
  imoveis_ativos: number
  imoveis_ativos_variacao_pct: number
  ocupacao_hoje_pct: number
  ocupacao_7dias: Array<{ data: string; pct: number }>
  receita_mes: number
  receita_mes_variacao_pct: number
  avaliacao_media: number
  total_avaliacoes: number
}

export type DashboardData = {
  kpis: DashboardKpis
  imoveis: ImovelDashboard[]
}

type ReservaRow = {
  id: string
  imovel_id: string
  data_checkin: string
  data_checkout: string
  valor_bruto: number
  plataforma: Plataforma | null
  status: string
  nome_hospede: string | null
  nota_hospede: number | null
}

type ImovelRow = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number
  latitude: number | null
  longitude: number | null
  proprietario: { id: string; nome: string }
}

function isValida(r: { status: string }): boolean {
  return (
    r.status !== StatusReserva.Cancelada && r.status !== StatusReserva.NoShow
  )
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const hoje = new Date()
  const hojeStr = format(hoje, 'yyyy-MM-dd')
  const inicioMes = startOfMonth(hoje)
  const fimMes = endOfMonth(hoje)
  const inicioMesStr = format(inicioMes, 'yyyy-MM-dd')
  const fimMesStr = format(fimMes, 'yyyy-MM-dd')
  const diasMes = differenceInCalendarDays(fimMes, inicioMes) + 1

  const mesAnterior = subMonths(hoje, 1)
  const inicioMesAnt = format(startOfMonth(mesAnterior), 'yyyy-MM-dd')
  const fimMesAnt = format(endOfMonth(mesAnterior), 'yyyy-MM-dd')

  const inicioMesAnoAnt = format(
    startOfMonth(subYears(hoje, 1)),
    'yyyy-MM-dd',
  )
  const fimMesAnoAnt = format(endOfMonth(subYears(hoje, 1)), 'yyyy-MM-dd')

  const seteDiasAtras = format(addDays(hoje, -6), 'yyyy-MM-dd')

  const { data: imoveisRaw, error: imErr } = await supabase
    .from('imoveis')
    .select(
      `id, nome_interno, bairro, status, comissao_percentual,
       latitude, longitude,
       proprietario:proprietarios!inner(id, nome)`,
    )
    .order('nome_interno', { ascending: true })

  if (imErr) return { error: imErr.message }
  const imoveis = (imoveisRaw ?? []) as unknown as ImovelRow[]
  const idsImoveis = imoveis.map((i) => i.id)

  if (idsImoveis.length === 0) {
    return {
      data: {
        kpis: {
          imoveis_ativos: 0,
          imoveis_ativos_variacao_pct: 0,
          ocupacao_hoje_pct: 0,
          ocupacao_7dias: [],
          receita_mes: 0,
          receita_mes_variacao_pct: 0,
          avaliacao_media: 0,
          total_avaliacoes: 0,
        },
        imoveis: [],
      },
    }
  }

  const inicioJanela = inicioMesAnoAnt
  const fimJanela = fimMesStr

  const { data: reservasRaw, error: rErr } = await supabase
    .from('reservas')
    .select(
      'id, imovel_id, data_checkin, data_checkout, valor_bruto, plataforma, status, nome_hospede, nota_hospede',
    )
    .in('imovel_id', idsImoveis)
    .gte('data_checkout', inicioJanela)
    .lte('data_checkin', fimJanela)

  if (rErr) return { error: rErr.message }
  const reservas = (reservasRaw ?? []) as ReservaRow[]

  // ─── KPI 1: Imóveis Ativos ────────────────────────────────
  const ativosAtual = imoveis.filter((i) => i.status === StatusImovel.Ativo).length
  // Aproximação: usamos created_at não disponível aqui — taxa de variação heurística
  // Comparar com criados antes do mês anterior: por simplicidade retornamos 0% (sem histórico de status).
  const imoveisAtivosVariacao = 0

  // ─── KPI 2: Ocupação Hoje ─────────────────────────────────
  const ativosAtuaisIds = imoveis
    .filter((i) => i.status === StatusImovel.Ativo)
    .map((i) => i.id)
  const ocupadosHojeSet = new Set<string>()
  for (const r of reservas) {
    if (!isValida(r)) continue
    if (r.data_checkin <= hojeStr && hojeStr < r.data_checkout) {
      ocupadosHojeSet.add(r.imovel_id)
    }
  }
  const ocupacaoHojePct =
    ativosAtuaisIds.length > 0
      ? (Array.from(ocupadosHojeSet).filter((id) => ativosAtuaisIds.includes(id))
          .length /
          ativosAtuaisIds.length) *
        100
      : 0

  const ocupacao7dias: Array<{ data: string; pct: number }> = []
  for (let i = 6; i >= 0; i--) {
    const dia = format(addDays(hoje, -i), 'yyyy-MM-dd')
    const ocupados = new Set<string>()
    for (const r of reservas) {
      if (!isValida(r)) continue
      if (r.data_checkin <= dia && dia < r.data_checkout) {
        if (ativosAtuaisIds.includes(r.imovel_id)) ocupados.add(r.imovel_id)
      }
    }
    const pct =
      ativosAtuaisIds.length > 0
        ? (ocupados.size / ativosAtuaisIds.length) * 100
        : 0
    ocupacao7dias.push({ data: dia, pct: Number(pct.toFixed(1)) })
  }

  // ─── KPI 3: Receita do Mês ────────────────────────────────
  const reservasMes = reservas.filter(
    (r) =>
      isValida(r) &&
      r.data_checkin >= inicioMesStr &&
      r.data_checkin <= fimMesStr,
  )
  const receitaMes = reservasMes.reduce((s, r) => s + Number(r.valor_bruto ?? 0), 0)
  const reservasMesAnoAnt = reservas.filter(
    (r) =>
      isValida(r) &&
      r.data_checkin >= inicioMesAnoAnt &&
      r.data_checkin <= fimMesAnoAnt,
  )
  const receitaMesAnoAnt = reservasMesAnoAnt.reduce(
    (s, r) => s + Number(r.valor_bruto ?? 0),
    0,
  )
  const receitaVariacaoPct =
    receitaMesAnoAnt > 0
      ? ((receitaMes - receitaMesAnoAnt) / receitaMesAnoAnt) * 100
      : 0

  // ─── KPI 4: Avaliação Média ───────────────────────────────
  const notas = reservas
    .map((r) => r.nota_hospede)
    .filter((n): n is number => n != null)
  const avaliacaoMedia =
    notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0

  // ─── Enriquecer cada imóvel ───────────────────────────────
  const imoveisEnriched: ImovelDashboard[] = imoveis.map((imv) => {
    const rsv = reservas.filter((r) => r.imovel_id === imv.id)
    const futuras = rsv
      .filter((r) => isValida(r) && r.data_checkin >= hojeStr)
      .sort((a, b) => a.data_checkin.localeCompare(b.data_checkin))
    const proxima = futuras[0]

    const reservasMesImv = rsv.filter(
      (r) =>
        isValida(r) &&
        r.data_checkin <= fimMesStr &&
        r.data_checkout >= inicioMesStr,
    )
    const taxaOcupacaoMes = calcularTaxaOcupacao(
      reservasMesImv.map((r) => ({
        data_checkin: r.data_checkin,
        data_checkout: r.data_checkout,
        valor_bruto: Number(r.valor_bruto ?? 0),
        status: r.status,
      })),
      diasMes,
    )
    const receitaImv = rsv
      .filter(
        (r) =>
          isValida(r) &&
          r.data_checkin >= inicioMesStr &&
          r.data_checkin <= fimMesStr,
      )
      .reduce((s, r) => s + Number(r.valor_bruto ?? 0), 0)

    const notasImv = rsv
      .map((r) => r.nota_hospede)
      .filter((n): n is number => n != null)
    const notaMediaImv =
      notasImv.length > 0
        ? notasImv.reduce((a, b) => a + b, 0) / notasImv.length
        : 0

    return {
      id: imv.id,
      nome_interno: imv.nome_interno,
      bairro: imv.bairro,
      status: imv.status,
      comissao_percentual: Number(imv.comissao_percentual),
      latitude: imv.latitude != null ? Number(imv.latitude) : undefined,
      longitude: imv.longitude != null ? Number(imv.longitude) : undefined,
      proprietario: imv.proprietario,
      proxima_reserva: proxima
        ? {
            data_checkin: proxima.data_checkin,
            data_checkout: proxima.data_checkout,
            plataforma: (proxima.plataforma ?? Plataforma.Outro) as Plataforma,
            nome_hospede: proxima.nome_hospede ?? undefined,
          }
        : undefined,
      ocupado_hoje: ocupadosHojeSet.has(imv.id),
      em_manutencao: imv.status === StatusImovel.Manutencao,
      taxa_ocupacao_mes: Number(taxaOcupacaoMes.toFixed(1)),
      receita_mes: Number(receitaImv.toFixed(2)),
      nota_media: Number(notaMediaImv.toFixed(1)),
      total_avaliacoes: notasImv.length,
    }
  })

  return {
    data: {
      kpis: {
        imoveis_ativos: ativosAtual,
        imoveis_ativos_variacao_pct: Number(imoveisAtivosVariacao.toFixed(1)),
        ocupacao_hoje_pct: Number(ocupacaoHojePct.toFixed(1)),
        ocupacao_7dias: ocupacao7dias,
        receita_mes: Number(receitaMes.toFixed(2)),
        receita_mes_variacao_pct: Number(receitaVariacaoPct.toFixed(1)),
        avaliacao_media: Number(avaliacaoMedia.toFixed(1)),
        total_avaliacoes: notas.length,
      },
      imoveis: imoveisEnriched,
    },
  }
}
