'use client'

import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { Star } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { DataTable } from '@/components/ui/data-table'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { formatCurrency } from '@/lib/utils/formatters'
import { Plataforma, StatusReserva } from '@/types'

export type ReservaRow = {
  id: string
  data_checkin: string
  data_checkout: string
  nome_hospede?: string | null
  valor_bruto: number
  plataforma: Plataforma | null
  status: StatusReserva
  nota_hospede?: number | null
}

export function TabReservas({ reservas }: { reservas: ReservaRow[] }) {
  const columns: ColumnDef<ReservaRow>[] = [
    {
      id: 'hospede',
      header: 'Hóspede',
      accessorFn: (r) => r.nome_hospede ?? '—',
      cell: ({ row }) => (
        <span className="font-medium text-navy-800">
          {row.original.nome_hospede ?? '—'}
        </span>
      ),
    },
    {
      id: 'checkin',
      header: 'Check-in',
      accessorFn: (r) => r.data_checkin,
      cell: ({ row }) => format(parseISO(row.original.data_checkin), 'dd/MM/yyyy'),
    },
    {
      id: 'checkout',
      header: 'Check-out',
      accessorFn: (r) => r.data_checkout,
      cell: ({ row }) => format(parseISO(row.original.data_checkout), 'dd/MM/yyyy'),
    },
    {
      id: 'noites',
      header: 'Noites',
      cell: ({ row }) =>
        differenceInCalendarDays(
          parseISO(row.original.data_checkout),
          parseISO(row.original.data_checkin),
        ),
    },
    {
      id: 'plataforma',
      header: 'Plataforma',
      cell: ({ row }) =>
        row.original.plataforma ? (
          <PlataformaBadge plataforma={row.original.plataforma} />
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'valor',
      header: 'Valor bruto',
      accessorFn: (r) => r.valor_bruto,
      cell: ({ row }) => formatCurrency(Number(row.original.valor_bruto)),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Reserva}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'avaliacao',
      header: 'Avaliação',
      cell: ({ row }) =>
        row.original.nota_hospede != null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" />
            {Number(row.original.nota_hospede).toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={reservas}
      searchPlaceholder="Buscar reservas..."
      emptyTitle="Sem reservas"
      emptyMessage="As reservas deste imóvel aparecerão aqui."
    />
  )
}
