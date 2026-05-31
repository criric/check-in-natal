'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import {
  BadgeStatus,
  BadgeStatusVariant,
} from '@/components/ui/badge-status'
import { formatCurrency, formatDate, formatMesAno } from '@/lib/utils/formatters'
import { StatusRepasse } from '@/types'
import type { RepassePortal } from '@/lib/actions/portal'

export function RepassesTablePortal({
  repasses,
}: {
  repasses: RepassePortal[]
}) {
  const columns = useMemo<ColumnDef<RepassePortal, unknown>[]>(
    () => [
      {
        accessorKey: 'competencia_mes',
        header: 'Competência',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-navy-800">
            {formatMesAno(row.original.competencia_mes, row.original.competencia_ano)}
          </span>
        ),
      },
      {
        accessorKey: 'imovel_nome',
        header: 'Imóvel',
        cell: ({ row }) => (
          <span className="text-sm text-navy-700">
            {row.original.imovel_nome}
          </span>
        ),
      },
      {
        accessorKey: 'receita_bruta',
        header: 'Receita bruta',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-navy-800">
            {formatCurrency(row.original.receita_bruta)}
          </span>
        ),
      },
      {
        accessorKey: 'comissao_gestora',
        header: 'Comissão',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-muted">
            {formatCurrency(row.original.comissao_gestora)}
          </span>
        ),
      },
      {
        accessorKey: 'deducoes',
        header: 'Deduções',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-muted">
            {row.original.deducoes > 0
              ? formatCurrency(row.original.deducoes)
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'valor_repassado',
        header: 'Valor líquido',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-success-700">
            {formatCurrency(row.original.valor_repassado)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <BadgeStatus
            variant={BadgeStatusVariant.Repasse}
            status={row.original.status as StatusRepasse}
          />
        ),
      },
      {
        accessorKey: 'data_repasse',
        header: 'Data pagamento',
        cell: ({ row }) =>
          row.original.data_repasse ? (
            <span className="text-sm text-navy-700">
              {formatDate(row.original.data_repasse)}
            </span>
          ) : (
            <span className="text-xs text-ink-subtle">—</span>
          ),
      },
      {
        id: 'pdf',
        header: 'PDF',
        cell: ({ row }) =>
          row.original.pdf_url ? (
            <a
              href={row.original.pdf_url}
              target="_blank"
              rel="noopener"
              aria-label="Baixar PDF"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-white text-navy-700 hover:bg-sand-50"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-ink-subtle">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={repasses}
      searchPlaceholder="Buscar por imóvel..."
      emptyTitle="Nenhum repasse"
      emptyMessage="Quando um repasse for gerado ele aparecerá aqui."
    />
  )
}
