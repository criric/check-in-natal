'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Eye, Pencil, Star } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { DataTable } from '@/components/ui/data-table'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { Progress, ProgressTone } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { StatusImovel } from '@/types'
import type { ImovelDashboard } from '@/lib/actions/dashboard'

function ocupacaoTone(pct: number): ProgressTone {
  if (pct >= 70) return ProgressTone.Success
  if (pct >= 40) return ProgressTone.Brand
  return ProgressTone.Warning
}

export function TabelaImoveis({
  imoveis,
}: {
  imoveis: ImovelDashboard[]
}) {
  const [bairro, setBairro] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const bairros = useMemo(
    () => Array.from(new Set(imoveis.map((i) => i.bairro).filter(Boolean))).sort(),
    [imoveis],
  )

  const filtered = useMemo(
    () =>
      imoveis.filter((i) => {
        if (bairro && i.bairro !== bairro) return false
        if (status && i.status !== status) return false
        return true
      }),
    [imoveis, bairro, status],
  )

  const handleExportCSV = async () => {
    const { exportarCSV } = await import('@/lib/actions/export')
    const { ExportTarget: T } = await import('@/types')
    const res = await exportarCSV({ target: T.Imoveis })
    if (res.data) {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `imoveis-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const columns: ColumnDef<ImovelDashboard>[] = [
    {
      id: 'imovel',
      header: 'Imóvel',
      accessorFn: (row) => `${row.nome_interno} ${row.bairro}`,
      cell: ({ row }) => (
        <div>
          <Link
            href={`/imoveis/${row.original.id}`}
            className="font-medium text-navy-800 hover:text-navy-900 hover:underline"
          >
            {row.original.nome_interno}
          </Link>
          <p className="text-xs text-ink-muted">{row.original.bairro}</p>
        </div>
      ),
    },
    {
      id: 'proprietario',
      header: 'Proprietário',
      accessorFn: (row) => row.proprietario.nome,
      cell: ({ row }) => (
        <Link
          href={`/proprietarios/${row.original.proprietario.id}`}
          className="text-ink hover:text-navy-700 hover:underline"
        >
          {row.original.proprietario.nome}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (row) => row.status,
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Imovel}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'proxima',
      header: 'Próxima reserva',
      cell: ({ row }) =>
        row.original.proxima_reserva ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {format(parseISO(row.original.proxima_reserva.data_checkin), 'dd/MM')}
            </span>
            <PlataformaBadge
              plataforma={row.original.proxima_reserva.plataforma}
              showLabel={false}
            />
          </div>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'ocupacao',
      header: 'Ocupação (mês)',
      accessorFn: (row) => row.taxa_ocupacao_mes,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress
            value={row.original.taxa_ocupacao_mes}
            tone={ocupacaoTone(row.original.taxa_ocupacao_mes)}
            className="w-20"
          />
          <span className="w-10 text-xs font-medium text-ink">
            {row.original.taxa_ocupacao_mes.toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      id: 'receita',
      header: 'Receita (mês)',
      accessorFn: (row) => row.receita_mes,
      cell: ({ row }) => (
        <span className="font-medium text-navy-800">
          {formatCurrency(row.original.receita_mes)}
        </span>
      ),
    },
    {
      id: 'avaliacao',
      header: 'Avaliação',
      accessorFn: (row) => row.nota_media,
      cell: ({ row }) =>
        row.original.total_avaliacoes > 0 ? (
          <div className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" />
            <span className="text-sm font-medium">
              {row.original.nota_media.toFixed(1)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/imoveis/${row.original.id}`}
            aria-label="Ver detalhes"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-sand-100 hover:text-navy-700"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/imoveis/${row.original.id}/editar`}
            aria-label="Editar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-sand-100 hover:text-navy-700"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ]

  const filters = (
    <>
      <select
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por bairro"
      >
        <option value="">Todos os bairros</option>
        {bairros.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        {Object.values(StatusImovel).map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      {(bairro || status) && (
        <button
          type="button"
          onClick={() => {
            setBairro('')
            setStatus('')
          }}
          className="text-xs font-medium text-ink-muted hover:text-navy-700"
        >
          Limpar filtros
        </button>
      )}
    </>
  )

  return (
    <DataTable
      columns={columns}
      data={filtered}
      filters={filters}
      searchPlaceholder="Buscar por nome ou bairro..."
      emptyTitle="Nenhum imóvel encontrado"
      emptyMessage="Ajuste os filtros ou cadastre um novo imóvel."
      onExportCSV={handleExportCSV}
    />
  )
}
