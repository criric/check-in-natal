import { Building2, TrendingUp } from 'lucide-react'
import { getResumoProprietario } from '@/lib/actions/portal'
import { CardFinanceiro } from '@/components/proprietario/card-financeiro'
import { ReceitaChart } from '@/components/proprietario/receita-chart'
import { OcupacaoGauge } from '@/components/proprietario/ocupacao-gauge'
import { ProximasReservas } from '@/components/proprietario/proximas-reservas'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/utils/formatters'

export const dynamic = 'force-dynamic'

export default async function PortalResumoPage() {
  const res = await getResumoProprietario()
  if (res.error || !res.data) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <PageHeader
          titulo="Resumo"
          descricao="Visão geral dos seus imóveis e ganhos"
        />
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error ?? 'Não foi possível carregar o resumo.'}
        </div>
      </div>
    )
  }

  const r = res.data

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Resumo"
        descricao="Visão geral dos seus imóveis e ganhos"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardFinanceiro repasse={r.repasse_mes} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <KpiCard
            titulo="Imóveis ativos"
            valor={String(r.total_imoveis_ativos)}
            icone={<Building2 className="h-16 w-16" />}
            descricao="Na sua carteira"
          />
          <KpiCard
            titulo="Receita acumulada (ano)"
            valor={formatCurrency(r.receita_acumulada_ano)}
            icone={<TrendingUp className="h-16 w-16" />}
            descricao="Soma do valor líquido"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReceitaChart data={r.receita_12m} />
        </div>
        <OcupacaoGauge
          ocupacao={r.ocupacao_mes}
          mediaCarteira={r.ocupacao_media_carteira}
        />
      </div>

      <ProximasReservas reservas={r.proximas_reservas} />
    </div>
  )
}
