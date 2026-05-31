'use client'

import { format, parseISO } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { DataTable } from '@/components/ui/data-table'
import { formatCurrency } from '@/lib/utils/formatters'
import { StatusManutencao, UrgenciaManutencao } from '@/types'

export type ManutencaoRow = {
  id: string
  tipo?: string | null
  descricao: string
  urgencia: UrgenciaManutencao
  status: StatusManutencao
  custo_estimado?: number | null
  custo_real?: number | null
  data_abertura: string
}

export function TabManutencoes({
  manutencoes,
}: {
  manutencoes: ManutencaoRow[]
}) {
  const columns: ColumnDef<ManutencaoRow>[] = [
    {
      id: 'tipo',
      header: 'Tipo',
      accessorFn: (m) => m.tipo ?? m.descricao,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-navy-800">
            {row.original.tipo ?? 'Geral'}
          </p>
          <p className="line-clamp-1 text-xs text-ink-muted">
            {row.original.descricao}
          </p>
        </div>
      ),
    },
    {
      id: 'urgencia',
      header: 'Urgência',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Urgencia}
          status={row.original.urgencia}
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Manutencao}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'custo_estimado',
      header: 'Custo est.',
      accessorFn: (m) => m.custo_estimado ?? 0,
      cell: ({ row }) =>
        row.original.custo_estimado != null
          ? formatCurrency(Number(row.original.custo_estimado))
          : '—',
    },
    {
      id: 'custo_real',
      header: 'Custo real',
      accessorFn: (m) => m.custo_real ?? 0,
      cell: ({ row }) =>
        row.original.custo_real != null
          ? formatCurrency(Number(row.original.custo_real))
          : '—',
    },
    {
      id: 'abertura',
      header: 'Abertura',
      accessorFn: (m) => m.data_abertura,
      cell: ({ row }) =>
        format(parseISO(row.original.data_abertura), 'dd/MM/yyyy'),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={manutencoes}
      searchPlaceholder="Buscar manutenções..."
      emptyTitle="Sem manutenções"
      emptyMessage="As manutenções deste imóvel aparecerão aqui."
    />
  )
}
