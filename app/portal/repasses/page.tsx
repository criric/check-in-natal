import { Banknote, Clock } from 'lucide-react'
import { getRepassesProprietario } from '@/lib/actions/portal'
import { RepassesTablePortal } from '@/components/proprietario/repasses-table'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/utils/formatters'
import { StatusRepasse } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PortalRepassesPage() {
  const res = await getRepassesProprietario()
  const repasses = res.data ?? []
  const anoAtual = new Date().getFullYear()

  const acumuladoAno = repasses
    .filter((r) => r.competencia_ano === anoAtual)
    .reduce((s, r) => s + r.valor_repassado, 0)
  const pendentes = repasses.filter(
    (r) => r.status !== StatusRepasse.Pago,
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Repasses"
        descricao="Histórico financeiro com extratos em PDF"
      />

      {res.error ? (
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          titulo={`Acumulado ${anoAtual}`}
          valor={formatCurrency(acumuladoAno)}
          icone={<Banknote className="h-16 w-16" />}
          descricao="Soma dos repasses no ano corrente"
        />
        <KpiCard
          titulo="Pendentes"
          valor={String(pendentes)}
          icone={<Clock className="h-16 w-16" />}
          descricao="Repasses ainda não pagos"
        />
      </div>

      <RepassesTablePortal repasses={repasses} />
    </div>
  )
}
