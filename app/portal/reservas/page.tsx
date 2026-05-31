import { getReservasProprietario } from '@/lib/actions/portal'
import { ReservasTablePortal } from '@/components/proprietario/reservas-table'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function PortalReservasPage() {
  const res = await getReservasProprietario()
  const reservas = res.data ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Reservas"
        descricao="Histórico e próximas reservas dos seus imóveis"
      />

      {res.error ? (
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error}
        </div>
      ) : null}

      <ReservasTablePortal reservas={reservas} />
    </div>
  )
}
