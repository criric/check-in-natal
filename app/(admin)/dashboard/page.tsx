import { format } from 'date-fns'
import { getAlertas } from '@/lib/actions/alertas'
import { getDashboardData } from '@/lib/actions/dashboard'
import { getLimpezasByData } from '@/lib/actions/limpezas'
import { CardsAlertas, type AlertaItem } from '@/components/admin/dashboard/cards-alertas'
import { KpiSection } from '@/components/admin/dashboard/kpi-section'
import { LimpezasHoje, type LimpezaHoje } from '@/components/admin/dashboard/limpezas-hoje'
import { MapaImoveis } from '@/components/admin/dashboard/mapa-imoveis'
import { TabelaImoveis } from '@/components/admin/dashboard/tabela-imoveis'
import { PageHeader } from '@/components/ui/page-header'
import { DashboardRealtimeBridge } from './_realtime'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const [dashRes, alertasRes, limpezasRes] = await Promise.all([
    getDashboardData(),
    getAlertas({ lido: false }),
    getLimpezasByData(hoje),
  ])

  if (dashRes.error || !dashRes.data) {
    return (
      <div className="p-6">
        <p className="text-danger-700">
          Erro ao carregar dashboard: {dashRes.error}
        </p>
      </div>
    )
  }

  const alertas = (alertasRes.data ?? []) as AlertaItem[]
  const limpezas = (limpezasRes.data ?? []) as LimpezaHoje[]

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Dashboard"
        descricao="Visão geral da operação hoje."
      />

      <DashboardRealtimeBridge />

      <div className="space-y-6">
        <KpiSection kpis={dashRes.data.kpis} />

        <MapaImoveis imoveis={dashRes.data.imoveis} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <TabelaImoveis imoveis={dashRes.data.imoveis} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
            <CardsAlertas alertas={alertas} />
            <LimpezasHoje limpezas={limpezas} />
          </div>
        </div>
      </div>
    </div>
  )
}
