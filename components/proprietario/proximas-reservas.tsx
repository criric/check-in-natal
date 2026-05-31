import { CalendarDays } from 'lucide-react'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { formatDate } from '@/lib/utils/formatters'
import { Plataforma } from '@/types'
import type { ProximaReservaPortal } from '@/lib/actions/portal'

export function ProximasReservas({
  reservas,
}: {
  reservas: ProximaReservaPortal[]
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-semibold text-navy-800">
        Próximas reservas
      </h2>
      {reservas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CalendarDays className="h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="text-sm text-ink-muted">
            Nenhuma reserva agendada para o próximo período.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reservas.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-md border border-line bg-sand-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">
                  {r.imovel_nome}
                </p>
                <p className="text-xs text-ink-muted">{r.imovel_bairro}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  <span className="font-medium text-navy-700">
                    {formatDate(r.data_checkin)}
                  </span>{' '}
                  →{' '}
                  <span className="font-medium text-navy-700">
                    {formatDate(r.data_checkout)}
                  </span>{' '}
                  · {r.noites} {r.noites === 1 ? 'noite' : 'noites'}
                </p>
              </div>
              <PlataformaBadge plataforma={r.plataforma as Plataforma} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
