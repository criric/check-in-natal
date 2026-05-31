'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Clock,
  Coins,
  Download,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { KpiCard } from '@/components/ui/kpi-card'
import { Progress } from '@/components/ui/progress'
import { exportarCSV } from '@/lib/actions/export'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { ExportTarget } from '@/types'
import type {
  MetricasCarteira,
  MetricasMensais,
  MetricasPorPlataforma,
  RankingImovel,
} from '@/types'

const CORES_PLATAFORMA: Record<string, string> = {
  airbnb: '#FF5A5F',
  booking: '#003580',
  direto: '#22c55e',
  outro: '#94a3b8',
}

const PLATAFORMA_LABEL: Record<string, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking',
  direto: 'Direto',
  outro: 'Outro',
}

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function abrevMes(yyyyMM: string): string {
  const [, m] = yyyyMM.split('-')
  const idx = Number(m) - 1
  return MESES_ABREV[idx] ?? yyyyMM
}

export type FiltroState = {
  data_inicio: string
  data_fim: string
  imovel_id: string
  proprietario_id: string
  bairro: string
}

export type ImovelOpt = { id: string; nome_interno: string; bairro: string }
export type ProprietarioOpt = { id: string; nome: string }

export type RelatoriosClientProps = {
  kpis: MetricasCarteira
  mensais: MetricasMensais[]
  plataformas: MetricasPorPlataforma[]
  ranking: RankingImovel[]
  heatmap: Record<string, number>
  ano: number
  filtroInicial: FiltroState
  imoveis: ImovelOpt[]
  proprietarios: ProprietarioOpt[]
  bairros: string[]
}

export function RelatoriosClient({
  kpis,
  mensais,
  plataformas,
  ranking,
  heatmap,
  ano,
  filtroInicial,
  imoveis,
  proprietarios,
  bairros,
}: RelatoriosClientProps) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<FiltroState>(filtroInicial)
  const [pendingFiltro, startFiltro] = useTransition()
  const [pendingExport, startExport] = useTransition()

  const aplicar = () => {
    const params = new URLSearchParams()
    if (filtro.data_inicio) params.set('data_inicio', filtro.data_inicio)
    if (filtro.data_fim) params.set('data_fim', filtro.data_fim)
    if (filtro.imovel_id) params.set('imovel_id', filtro.imovel_id)
    if (filtro.proprietario_id)
      params.set('proprietario_id', filtro.proprietario_id)
    if (filtro.bairro) params.set('bairro', filtro.bairro)
    startFiltro(() => {
      router.push(`/relatorios?${params.toString()}`)
      router.refresh()
    })
  }

  const exportarReservasCsv = () => {
    startExport(async () => {
      const res = await exportarCSV({
        target: ExportTarget.Reservas,
        data_inicio: filtro.data_inicio,
        data_fim: filtro.data_fim,
        imovel_id: filtro.imovel_id || undefined,
        proprietario_id: filtro.proprietario_id || undefined,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? 'Falha ao exportar')
        return
      }
      downloadCsv(
        res.data,
        `reservas-${filtro.data_inicio}-a-${filtro.data_fim}.csv`,
      )
      toast.success('Reservas exportadas')
    })
  }

  return (
    <>
      <FiltrosBar
        filtro={filtro}
        setFiltro={setFiltro}
        imoveis={imoveis}
        proprietarios={proprietarios}
        bairros={bairros}
        onAplicar={aplicar}
        onExportar={exportarReservasCsv}
        pendingFiltro={pendingFiltro}
        pendingExport={pendingExport}
      />

      <section className="mb-6">
        <KpiGrid kpis={kpis} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          titulo="Receita mensal"
          descricao="Receita bruta e comissão da gestora por mês"
        >
          <ReceitaChart mensais={mensais} />
        </ChartCard>

        <ChartCard
          titulo="Ocupação mensal"
          descricao="Taxa de ocupação x média do período"
        >
          <OcupacaoChart mensais={mensais} />
        </ChartCard>

        <ChartCard
          titulo="Receita por plataforma"
          descricao="Distribuição da receita bruta no período"
        >
          <PlataformaChart plataformas={plataformas} />
        </ChartCard>

        <ChartCard
          titulo={`Heatmap de ocupação · ${ano}`}
          descricao="Intensidade da ocupação dia a dia (semanas)"
        >
          <HeatmapCalendario heatmap={heatmap} ano={ano} />
        </ChartCard>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-navy-800">
              Ranking de imóveis
            </h2>
            <p className="text-sm text-ink-muted">
              Ordenado por RevPAR · clique nos cabeçalhos para reordenar.
            </p>
          </div>
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Sm}
            leadingIcon={<Download className="h-4 w-4" />}
            onClick={() => exportarRankingCsv(ranking)}
          >
            Exportar ranking
          </Button>
        </div>
        <RankingTable ranking={ranking} />
      </section>
    </>
  )
}

// ─── Filtros ────────────────────────────────────────────────────

function FiltrosBar({
  filtro,
  setFiltro,
  imoveis,
  proprietarios,
  bairros,
  onAplicar,
  onExportar,
  pendingFiltro,
  pendingExport,
}: {
  filtro: FiltroState
  setFiltro: (f: FiltroState) => void
  imoveis: ImovelOpt[]
  proprietarios: ProprietarioOpt[]
  bairros: string[]
  onAplicar: () => void
  onExportar: () => void
  pendingFiltro: boolean
  pendingExport: boolean
}) {
  const selectCls =
    'h-9 rounded-md border border-line-strong bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-200'
  const inputCls =
    'h-9 rounded-md border border-line-strong bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-200'

  return (
    <div className="mb-6 rounded-lg border border-line bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="De">
          <input
            type="date"
            value={filtro.data_inicio}
            onChange={(e) =>
              setFiltro({ ...filtro, data_inicio: e.target.value })
            }
            className={inputCls}
          />
        </Campo>
        <Campo label="Até">
          <input
            type="date"
            value={filtro.data_fim}
            onChange={(e) => setFiltro({ ...filtro, data_fim: e.target.value })}
            className={inputCls}
          />
        </Campo>
        <Campo label="Imóvel">
          <select
            value={filtro.imovel_id}
            onChange={(e) =>
              setFiltro({ ...filtro, imovel_id: e.target.value })
            }
            className={selectCls}
          >
            <option value="">Todos</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome_interno}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Proprietário">
          <select
            value={filtro.proprietario_id}
            onChange={(e) =>
              setFiltro({ ...filtro, proprietario_id: e.target.value })
            }
            className={selectCls}
          >
            <option value="">Todos</option>
            {proprietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Bairro">
          <select
            value={filtro.bairro}
            onChange={(e) => setFiltro({ ...filtro, bairro: e.target.value })}
            className={selectCls}
          >
            <option value="">Todos</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Campo>

        <div className="ml-auto flex items-end gap-2">
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            loading={pendingFiltro}
            onClick={onAplicar}
          >
            Aplicar
          </Button>
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Sm}
            leadingIcon={<Download className="h-4 w-4" />}
            loading={pendingExport}
            onClick={onExportar}
          >
            Exportar reservas
          </Button>
        </div>
      </div>
    </div>
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      {children}
    </label>
  )
}

// ─── KPIs ───────────────────────────────────────────────────────

function KpiGrid({ kpis }: { kpis: MetricasCarteira }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        titulo="RevPAR"
        valor={formatCurrency(kpis.revpar)}
        descricao="Receita por unidade disponível"
        icone={<TrendingUp size={88} />}
      />
      <KpiCard
        titulo="ADR"
        valor={formatCurrency(kpis.adr)}
        descricao="Diária média"
        icone={<Coins size={88} />}
      />
      <KpiCard
        titulo="Taxa de ocupação"
        valor={`${kpis.taxa_ocupacao.toFixed(1)}%`}
        descricao="Noites ocupadas / disponíveis"
        icone={<CalendarDays size={88} />}
      />
      <KpiCard
        titulo="Lead time médio"
        valor={`${kpis.lead_time_medio.toFixed(0)} dias`}
        descricao="Antecedência das reservas"
        icone={<Clock size={88} />}
      />
      <KpiCard
        titulo="Taxa de cancelamento"
        valor={`${kpis.taxa_cancelamento.toFixed(1)}%`}
        descricao="Sobre o total de reservas"
        icone={<TrendingDown size={88} />}
      />
      <KpiCard
        titulo="Margem líquida"
        valor={`${kpis.margem_liquida.toFixed(1)}%`}
        descricao="Comissão menos custos operacionais"
        icone={<Percent size={88} />}
      />
      <KpiCard
        titulo="Receita total"
        valor={formatCurrency(kpis.receita_total)}
        descricao="Bruto da carteira no período"
        icone={<Receipt size={88} />}
      />
      <KpiCard
        titulo="Custo operacional"
        valor={formatCurrency(kpis.custo_operacional)}
        descricao="Manutenções + limpezas"
        icone={<Wrench size={88} />}
      />
    </div>
  )
}

// ─── Charts ─────────────────────────────────────────────────────

function ChartCard({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-white p-4 shadow-xs">
      <div className="mb-3">
        <h3 className="font-display text-base text-navy-800">{titulo}</h3>
        {descricao ? (
          <p className="text-xs text-ink-muted">{descricao}</p>
        ) : null}
      </div>
      <div className="min-h-[260px] flex-1">{children}</div>
    </div>
  )
}

const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #E6DECB',
  borderRadius: 8,
  fontSize: 12,
  padding: '6px 10px',
  boxShadow: '0 4px 10px -2px rgba(11, 26, 43, 0.08)',
}

function ReceitaChart({ mensais }: { mensais: MetricasMensais[] }) {
  const dados = mensais.map((m) => ({
    mes: abrevMes(m.mes),
    bruta: m.receita_bruta,
    comissao: m.receita_bruta - m.receita_liquida,
  }))

  if (dados.length === 0) {
    return <EmptyChart />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dados} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6DECB" vertical={false} />
        <XAxis
          dataKey="mes"
          stroke="#7A8899"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E6DECB' }}
        />
        <YAxis
          stroke="#7A8899"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: '#F5EFE6' }}
          formatter={(v) => formatCurrency(Number(v ?? 0))}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
        />
        <Bar
          stackId="rec"
          dataKey="bruta"
          name="Receita bruta"
          fill="#325571"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          stackId="rec"
          dataKey="comissao"
          name="Comissão da gestora"
          fill="#C8A668"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function OcupacaoChart({ mensais }: { mensais: MetricasMensais[] }) {
  const dados = mensais.map((m) => ({
    mes: abrevMes(m.mes),
    ocupacao: m.taxa_ocupacao,
  }))
  const media = mensais.length
    ? mensais.reduce((s, m) => s + m.taxa_ocupacao, 0) / mensais.length
    : 0
  const dadosComMedia = dados.map((d) => ({ ...d, media }))

  if (dados.length === 0) {
    return <EmptyChart />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={dadosComMedia}
        margin={{ top: 5, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="rel-ocupacao-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8A668" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#C8A668" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6DECB" vertical={false} />
        <XAxis
          dataKey="mes"
          stroke="#7A8899"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E6DECB' }}
        />
        <YAxis
          stroke="#7A8899"
          fontSize={12}
          unit="%"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ stroke: '#A98851', strokeWidth: 1 }}
          formatter={(v) => `${Number(v ?? 0).toFixed(1)}%`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="plainline"
        />
        <Area
          type="monotone"
          dataKey="ocupacao"
          name="Ocupação"
          stroke="#A98851"
          strokeWidth={2}
          fill="url(#rel-ocupacao-grad)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="media"
          name="Média"
          stroke="#7A8899"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          fill="transparent"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function PlataformaChart({
  plataformas,
}: {
  plataformas: MetricasPorPlataforma[]
}) {
  if (plataformas.length === 0) {
    return <EmptyChart />
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={plataformas}
          dataKey="receita_total"
          nameKey="plataforma"
          outerRadius={90}
          innerRadius={40}
          paddingAngle={2}
          isAnimationActive
          label={(p) => {
            const payload = (p as { payload?: MetricasPorPlataforma }).payload
            if (!payload) return ''
            const nome = PLATAFORMA_LABEL[payload.plataforma] ?? payload.plataforma
            return `${nome} · ${payload.percentual.toFixed(0)}%`
          }}
          labelLine={{ stroke: '#D6CBAF' }}
        >
          {plataformas.map((p) => (
            <Cell
              key={p.plataforma}
              fill={CORES_PLATAFORMA[p.plataforma] ?? '#94a3b8'}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v, _name, item) => {
            const payload = item?.payload as
              | MetricasPorPlataforma
              | undefined
            const nome = payload
              ? PLATAFORMA_LABEL[payload.plataforma] ?? payload.plataforma
              : ''
            return [formatCurrency(Number(v ?? 0)), nome]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          formatter={(value) => PLATAFORMA_LABEL[value] ?? value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-line-strong bg-sand-50">
      <p className="text-sm text-ink-muted">Sem dados no período.</p>
    </div>
  )
}

// ─── Heatmap ────────────────────────────────────────────────────

function HeatmapCalendario({
  heatmap,
  ano,
}: {
  heatmap: Record<string, number>
  ano: number
}) {
  const dias = Object.keys(heatmap).sort()
  if (dias.length === 0) {
    return <EmptyChart />
  }

  const max = Math.max(1, ...Object.values(heatmap))

  // Monta uma matriz de 7 linhas (dom..sab) × N semanas
  const primeiroDia = new Date(`${ano}-01-01T12:00:00`)
  const offset = primeiroDia.getDay()

  type Celula = { data: string; valor: number } | null
  const semanas: Celula[][] = []
  let semana: Celula[] = Array(offset).fill(null)
  for (const d of dias) {
    semana.push({ data: d, valor: heatmap[d] })
    if (semana.length === 7) {
      semanas.push(semana)
      semana = []
    }
  }
  if (semana.length > 0) {
    while (semana.length < 7) semana.push(null)
    semanas.push(semana)
  }

  const escala = ['#F5EFE6', '#DFD2B0', '#CFB075', '#A98851', '#5F4926']
  function cor(v: number) {
    if (v <= 0) return escala[0]
    const i = Math.min(escala.length - 1, Math.ceil((v / max) * (escala.length - 1)))
    return escala[i]
  }

  const labelsDias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  // Marca onde cada mês começa para posicionar labels
  const labelsMeses: { semanaIdx: number; nome: string }[] = []
  let ultimoMes = -1
  semanas.forEach((sem, idx) => {
    const primeira = sem.find((c) => c !== null) as
      | { data: string; valor: number }
      | undefined
    if (!primeira) return
    const m = Number(primeira.data.slice(5, 7))
    if (m !== ultimoMes) {
      labelsMeses.push({ semanaIdx: idx, nome: MESES_ABREV[m - 1] ?? '' })
      ultimoMes = m
    }
  })

  return (
    <div className="flex h-full flex-col">
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {/* Labels dos meses */}
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `16px repeat(${semanas.length}, 14px)`,
            }}
          >
            <span />
            {semanas.map((_, idx) => {
              const lbl = labelsMeses.find((l) => l.semanaIdx === idx)
              return (
                <span
                  key={idx}
                  className="text-2xs font-medium text-ink-subtle"
                >
                  {lbl?.nome ?? ''}
                </span>
              )
            })}
          </div>
          {/* 7 linhas (dom..sab) */}
          {Array.from({ length: 7 }).map((_, dow) => (
            <div
              key={dow}
              className="grid items-center gap-[3px]"
              style={{
                gridTemplateColumns: `16px repeat(${semanas.length}, 14px)`,
              }}
            >
              <span className="text-2xs text-ink-subtle">
                {dow % 2 === 1 ? labelsDias[dow] : ''}
              </span>
              {semanas.map((sem, idx) => {
                const cel = sem[dow]
                return (
                  <span
                    key={idx}
                    title={cel ? `${cel.data} · ${cel.valor}%` : ''}
                    className={cn(
                      'h-3 w-3 rounded-[3px] transition-colors',
                      cel ? 'cursor-help' : 'opacity-0',
                    )}
                    style={{
                      background: cel ? cor(cel.valor) : 'transparent',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-2 text-2xs text-ink-subtle">
        <span>Menos</span>
        {escala.map((c) => (
          <span
            key={c}
            className="h-3 w-3 rounded-[3px]"
            style={{ background: c }}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}

// ─── Ranking ────────────────────────────────────────────────────

const MEDALHAS = ['🥇', '🥈', '🥉']

function corMargem(m: number): string {
  if (m >= 50) return 'bg-success-50 text-success-700 border-success-100'
  if (m >= 30) return 'bg-warning-50 text-warning-700 border-warning-100'
  return 'bg-danger-50 text-danger-700 border-danger-100'
}

function RankingTable({ ranking }: { ranking: RankingImovel[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'revpar', desc: true },
  ])

  const columns = useMemo<ColumnDef<RankingImovel>[]>(
    () => [
      {
        id: 'posicao',
        header: '#',
        enableSorting: false,
        cell: ({ row }) => {
          const idx = row.index
          return (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-navy-700"
              aria-label={`Posição ${idx + 1}`}
            >
              {idx < 3 ? MEDALHAS[idx] : idx + 1}
            </span>
          )
        },
      },
      {
        accessorKey: 'nome_interno',
        header: 'Imóvel',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-navy-800">
              {row.original.nome_interno}
            </span>
            <span className="text-xs text-ink-subtle">
              {row.original.bairro}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'revpar',
        header: 'RevPAR',
        cell: ({ row }) => formatCurrency(row.original.revpar),
      },
      {
        accessorKey: 'adr',
        header: 'ADR',
        cell: ({ row }) => formatCurrency(row.original.adr),
      },
      {
        accessorKey: 'taxa_ocupacao',
        header: 'Ocupação',
        cell: ({ row }) => {
          const pct = row.original.taxa_ocupacao
          return (
            <div className="flex min-w-[140px] items-center gap-2">
              <Progress
                value={Math.min(100, pct)}
                className="h-1.5 flex-1"
              />
              <span className="w-12 shrink-0 text-right text-xs font-medium text-navy-700">
                {pct.toFixed(0)}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'receita_mes',
        header: 'Receita',
        cell: ({ row }) => formatCurrency(row.original.receita_mes),
      },
      {
        accessorKey: 'custo_operacional',
        header: 'Custo Op.',
        cell: ({ row }) => formatCurrency(row.original.custo_operacional),
      },
      {
        accessorKey: 'margem',
        header: 'Margem',
        cell: ({ row }) => {
          const m = row.original.margem
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                corMargem(m),
              )}
            >
              {m.toFixed(1)}%
            </span>
          )
        },
      },
      {
        accessorKey: 'nota_media',
        header: 'Nota',
        cell: ({ row }) => {
          const n = row.original.nota_media
          return n > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm text-navy-700">
              <span aria-hidden className="text-gold-500">
                ★
              </span>
              {n.toFixed(1)}
            </span>
          ) : (
            <span className="text-xs text-ink-subtle">—</span>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: ranking,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-line">
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort()
                  const sortState = h.column.getIsSorted()
                  return (
                    <th
                      key={h.id}
                      className="px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle"
                    >
                      {h.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-navy-700"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sortState === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sortState === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center"
                >
                  <p className="font-display text-base text-navy-700">
                    Sem imóveis no período
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Ajuste os filtros para visualizar o ranking.
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line/60 transition-colors hover:bg-sand-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5 align-middle text-ink"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CSV helpers ────────────────────────────────────────────────

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportarRankingCsv(ranking: RankingImovel[]) {
  const head = [
    'Posição',
    'Imóvel',
    'Bairro',
    'RevPAR',
    'ADR',
    'Ocupação%',
    'Receita',
    'Custo Op.',
    'Margem%',
    'Nota média',
  ]
  const linhas = ranking.map((r, idx) => [
    idx + 1,
    r.nome_interno,
    r.bairro,
    r.revpar,
    r.adr,
    r.taxa_ocupacao,
    r.receita_mes,
    r.custo_operacional,
    r.margem,
    r.nota_media,
  ])
  const csv = [head, ...linhas]
    .map((row) =>
      row
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')

  downloadCsv(
    csv,
    `ranking-imoveis-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}
