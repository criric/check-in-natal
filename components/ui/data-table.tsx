'use client'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button, ButtonSize, ButtonVariant } from './button'
import { Input } from './input'
import { Skeleton } from './skeleton'

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  loading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  searchPlaceholder?: string
  globalFilterFn?: (row: TData, query: string) => boolean
  filters?: ReactNode
  onExportCSV?: () => void
  onRowClick?: (row: TData) => void
  pageSize?: number
  className?: string
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyTitle = 'Nada para mostrar',
  emptyMessage = 'Tente alterar os filtros ou aguarde novos dados.',
  searchPlaceholder = 'Buscar...',
  globalFilterFn,
  filters,
  onExportCSV,
  onRowClick,
  pageSize = 10,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalFilterFn
      ? (row, _columnId, value) => globalFilterFn(row.original, String(value))
      : 'includesString',
    initialState: { pagination: { pageSize } },
  })

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-line bg-white shadow-xs',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden
            />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
              aria-label="Buscar"
            />
          </div>
          {filters}
        </div>
        {onExportCSV ? (
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Sm}
            leadingIcon={<Download className="h-4 w-4" />}
            onClick={onExportCSV}
          >
            Exportar CSV
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortState = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
                      className="px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-navy-700"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortState === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sortState === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-line/60">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center"
                >
                  <p className="font-display text-base text-navy-700">
                    {emptyTitle}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-b border-line/60 transition-colors',
                    'hover:bg-sand-50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5 align-middle text-ink"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Mostrar</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-line-strong bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-gold-200"
            aria-label="Itens por página"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            {table.getFilteredRowModel().rows.length === 0
              ? '0 resultados'
              : `Mostrando ${
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1
                }–${Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )} de ${table.getFilteredRowModel().rows.length}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-1 text-xs text-ink-muted">
            Pág. {table.getState().pagination.pageIndex + 1} /{' '}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
