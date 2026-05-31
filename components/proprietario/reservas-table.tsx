'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import {
  BadgeStatus,
  BadgeStatusVariant,
} from '@/components/ui/badge-status'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Plataforma, StatusReserva } from '@/types'
import type { ReservaPortal } from '@/lib/actions/portal'

export function ReservasTablePortal({
  reservas,
}: {
  reservas: ReservaPortal[]
}) {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const filtradas = useMemo(() => {
    return reservas.filter((r) => {
      if (dataInicio && r.data_checkin < dataInicio) return false
      if (dataFim && r.data_checkout > dataFim) return false
      return true
    })
  }, [reservas, dataInicio, dataFim])

  const columns = useMemo<ColumnDef<ReservaPortal, unknown>[]>(
    () => [
      {
        accessorKey: 'imovel_nome',
        header: 'Imóvel',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-navy-800">
            {row.original.imovel_nome}
          </span>
        ),
      },
      {
        accessorKey: 'data_checkin',
        header: 'Check-in',
        cell: ({ row }) => (
          <span className="text-sm text-navy-700">
            {formatDate(row.original.data_checkin)}
          </span>
        ),
      },
      {
        accessorKey: 'data_checkout',
        header: 'Check-out',
        cell: ({ row }) => (
          <span className="text-sm text-navy-700">
            {formatDate(row.original.data_checkout)}
          </span>
        ),
      },
      {
        accessorKey: 'noites',
        header: 'Noites',
        cell: ({ row }) => (
          <span className="text-sm text-ink-muted">{row.original.noites}</span>
        ),
      },
      {
        accessorKey: 'plataforma',
        header: 'Plataforma',
        cell: ({ row }) => (
          <PlataformaBadge plataforma={row.original.plataforma as Plataforma} />
        ),
      },
      {
        accessorKey: 'valor_bruto',
        header: 'Valor bruto',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-navy-800">
            {formatCurrency(row.original.valor_bruto)}
          </span>
        ),
      },
      {
        accessorKey: 'comissao_estimada',
        header: 'Comissão',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-muted">
            {formatCurrency(row.original.comissao_estimada)}
          </span>
        ),
      },
      {
        accessorKey: 'valor_liquido',
        header: 'Valor líquido',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-success-700">
            {formatCurrency(row.original.valor_liquido)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <BadgeStatus
            variant={BadgeStatusVariant.Reserva}
            status={row.original.status as StatusReserva}
          />
        ),
      },
      {
        accessorKey: 'nota_hospede',
        header: 'Avaliação',
        cell: ({ row }) =>
          row.original.nota_hospede ? (
            <span className="text-sm text-navy-800">
              ★ {row.original.nota_hospede.toFixed(1)}
            </span>
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
      data={filtradas}
      searchPlaceholder="Buscar por imóvel..."
      emptyTitle="Sem reservas no período"
      emptyMessage="Ajuste os filtros para ver mais resultados."
      filters={
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="data-inicio">De</Label>
            <Input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <Label htmlFor="data-fim">Até</Label>
            <Input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-36"
            />
          </div>
          {(dataInicio || dataFim) && (
            <button
              type="button"
              onClick={() => {
                setDataInicio('')
                setDataFim('')
              }}
              className="rounded-md border border-line-strong bg-white px-2 py-1.5 text-xs font-medium text-navy-700 hover:bg-sand-50"
            >
              Limpar
            </button>
          )}
        </div>
      }
    />
  )
}
