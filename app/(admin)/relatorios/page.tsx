import { format, startOfMonth, endOfMonth } from 'date-fns'
import { requireAdmin } from '@/lib/actions/_guards'
import {
  getHeatmapOcupacao,
  getMetricasCarteira,
  getMetricasMensais,
  getMetricasPorPlataforma,
  getRankingImoveis,
} from '@/lib/actions/analytics'
import { getImoveis } from '@/lib/actions/imoveis'
import { getProprietarios } from '@/lib/actions/proprietarios'
import { PageHeader } from '@/components/ui/page-header'
import { RelatoriosClient } from './relatorios-client'
import type {
  MetricasCarteira,
  MetricasMensais,
  MetricasPorPlataforma,
  RankingImovel,
} from '@/types'

export const dynamic = 'force-dynamic'

type Search = {
  data_inicio?: string
  data_fim?: string
  imovel_id?: string
  proprietario_id?: string
  bairro?: string
}

type ImovelRaw = {
  id: string
  nome_interno: string
  bairro: string
}

type ProprietarioRaw = {
  id: string
  nome: string
}

const KPIS_VAZIOS: MetricasCarteira = {
  revpar: 0,
  adr: 0,
  taxa_ocupacao: 0,
  lead_time_medio: 0,
  taxa_cancelamento: 0,
  receita_total: 0,
  custo_operacional: 0,
  margem_liquida: 0,
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const g = await requireAdmin()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Relatórios" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {g.error}
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const hoje = new Date()
  const dataInicio = sp.data_inicio ?? format(startOfMonth(hoje), 'yyyy-MM-dd')
  const dataFim = sp.data_fim ?? format(endOfMonth(hoje), 'yyyy-MM-dd')

  const filtro = {
    data_inicio: dataInicio,
    data_fim: dataFim,
    imovel_id: sp.imovel_id || undefined,
    proprietario_id: sp.proprietario_id || undefined,
    bairro: sp.bairro || undefined,
  }

  const [kpisRes, mensaisRes, plataformasRes, rankingRes, heatmapRes, imoveisRes, propsRes] =
    await Promise.all([
      getMetricasCarteira(filtro),
      getMetricasMensais(filtro),
      getMetricasPorPlataforma(filtro),
      getRankingImoveis(filtro),
      getHeatmapOcupacao(sp.imovel_id, hoje.getFullYear()),
      getImoveis(),
      getProprietarios(),
    ])

  const kpis: MetricasCarteira = kpisRes.data ?? KPIS_VAZIOS
  const mensais: MetricasMensais[] = mensaisRes.data ?? []
  const plataformas: MetricasPorPlataforma[] = plataformasRes.data ?? []
  const ranking: RankingImovel[] = rankingRes.data ?? []
  const heatmap: Record<string, number> = heatmapRes.data ?? {}

  const imoveis = ((imoveisRes.data ?? []) as ImovelRaw[]).map((i) => ({
    id: i.id,
    nome_interno: i.nome_interno,
    bairro: i.bairro,
  }))
  const proprietarios = ((propsRes.data ?? []) as ProprietarioRaw[]).map((p) => ({
    id: p.id,
    nome: p.nome,
  }))
  const bairros = Array.from(new Set(imoveis.map((i) => i.bairro).filter(Boolean))).sort()

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Relatórios"
        descricao="Métricas de desempenho da carteira, ocupação, plataformas e ranking de imóveis."
      />
      <RelatoriosClient
        kpis={kpis}
        mensais={mensais}
        plataformas={plataformas}
        ranking={ranking}
        heatmap={heatmap}
        ano={hoje.getFullYear()}
        filtroInicial={{
          data_inicio: dataInicio,
          data_fim: dataFim,
          imovel_id: sp.imovel_id ?? '',
          proprietario_id: sp.proprietario_id ?? '',
          bairro: sp.bairro ?? '',
        }}
        imoveis={imoveis}
        proprietarios={proprietarios}
        bairros={bairros}
      />
    </div>
  )
}
