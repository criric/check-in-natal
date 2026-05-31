'use client'

import { format, parseISO } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { DataTable } from '@/components/ui/data-table'
import { StatusLimpeza } from '@/types'

export type LimpezaRow = {
  id: string
  data_agendada: string
  responsavel?: string | null
  status: StatusLimpeza
  reserva_id?: string | null
  duracao_minutos?: number | null
}

export function TabLimpezas({ limpezas }: { limpezas: LimpezaRow[] }) {
  const columns: ColumnDef<LimpezaRow>[] = [
    {
      id: 'data',
      header: 'Data',
      accessorFn: (l) => l.data_agendada,
      cell: ({ row }) =>
        format(parseISO(row.original.data_agendada), 'dd/MM/yyyy HH:mm'),
    },
    {
      id: 'responsavel',
      header: 'Responsável',
      accessorFn: (l) => l.responsavel ?? '',
      cell: ({ row }) =>
        row.original.responsavel ?? (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Limpeza}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'reserva',
      header: 'Reserva',
      cell: ({ row }) =>
        row.original.reserva_id ? (
          <span className="text-xs text-navy-700">Vinculada</span>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'duracao',
      header: 'Duração',
      cell: ({ row }) =>
        row.original.duracao_minutos
          ? `${row.original.duracao_minutos} min`
          : '—',
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={limpezas}
      searchPlaceholder="Buscar limpezas..."
      emptyTitle="Sem limpezas"
      emptyMessage="As limpezas deste imóvel aparecerão aqui."
    />
  )
}
