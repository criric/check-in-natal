'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Plus, Star } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getReservaById } from '@/lib/actions/reservas'
import { formatCurrency } from '@/lib/utils/formatters'
import type { ReservaInput } from '@/lib/validations'
import { Plataforma, StatusReserva } from '@/types'
import {
  ReservaForm,
  type ImovelOption,
} from './reserva-form'
import { ReservaSheet } from './reserva-sheet'

export type ReservaListItem = {
  id: string
  imovel_id: string
  imovel_nome: string
  imovel_bairro: string
  nome_hospede?: string | null
  data_checkin: string
  data_checkout: string
  plataforma: Plataforma
  status: StatusReserva
  valor_bruto: number
  valor_liquido_proprietario?: number | null
  nota_hospede?: number | null
}

export type ReservasClientProps = {
  reservas: ReservaListItem[]
  imoveis: ImovelOption[]
}

const PLATAFORMA_FILTRO: Array<{ value: '' | Plataforma; label: string }> = [
  { value: '', label: 'Todas as plataformas' },
  { value: Plataforma.Airbnb, label: 'Airbnb' },
  { value: Plataforma.Booking, label: 'Booking' },
  { value: Plataforma.Direto, label: 'Direto' },
  { value: Plataforma.Outro, label: 'Outro' },
]

const STATUS_FILTRO: Array<{ value: '' | StatusReserva; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: StatusReserva.Confirmada, label: 'Confirmada' },
  { value: StatusReserva.CheckinRealizado, label: 'Check-in realizado' },
  { value: StatusReserva.CheckoutRealizado, label: 'Check-out realizado' },
  { value: StatusReserva.Cancelada, label: 'Cancelada' },
  { value: StatusReserva.NoShow, label: 'No-show' },
]

type ModalState =
  | { open: false }
  | { open: true; modo: 'novo' }
  | { open: true; modo: 'editar'; id: string }

function EditarReservaLoader({
  reservaId,
  imoveis,
  onCancel,
  onSuccess,
}: {
  reservaId: string
  imoveis: ImovelOption[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const [defaults, setDefaults] = useState<Partial<ReservaInput> | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void getReservaById(reservaId).then((res) => {
      if (cancelled) return
      if (res.data) {
        const r = res.data as Record<string, unknown>
        setDefaults({
          imovel_id: String(r.imovel_id),
          plataforma: r.plataforma as Plataforma,
          id_externo: (r.id_externo as string) ?? undefined,
          nome_hospede: (r.nome_hospede as string) ?? undefined,
          email_hospede: (r.email_hospede as string) ?? undefined,
          telefone_hospede: (r.telefone_hospede as string) ?? undefined,
          data_checkin: String(r.data_checkin),
          data_checkout: String(r.data_checkout),
          num_hospedes: Number(r.num_hospedes ?? 1),
          valor_bruto: Number(r.valor_bruto ?? 0),
          taxa_plataforma: Number(r.taxa_plataforma ?? 0),
          observacoes_internas: (r.observacoes_internas as string) ?? undefined,
        })
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reservaId])

  if (loading || !defaults) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <ReservaForm
      modo="editar"
      reservaId={reservaId}
      imoveis={imoveis}
      defaultValues={defaults}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  )
}

export function ReservasClient({ reservas, imoveis }: ReservasClientProps) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetReservaId, setSheetReservaId] = useState<string | undefined>()

  const [plataformaFiltro, setPlataformaFiltro] = useState<'' | Plataforma>('')
  const [statusFiltro, setStatusFiltro] = useState<'' | StatusReserva>('')
  const [imovelFiltro, setImovelFiltro] = useState<string>('')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')

  const filtrados = useMemo(() => {
    return reservas.filter((r) => {
      if (plataformaFiltro && r.plataforma !== plataformaFiltro) return false
      if (statusFiltro && r.status !== statusFiltro) return false
      if (imovelFiltro && r.imovel_id !== imovelFiltro) return false
      if (dataInicio && r.data_checkin < dataInicio) return false
      if (dataFim && r.data_checkout > dataFim) return false
      return true
    })
  }, [reservas, plataformaFiltro, statusFiltro, imovelFiltro, dataInicio, dataFim])

  const hasFilters = Boolean(
    plataformaFiltro || statusFiltro || imovelFiltro || dataInicio || dataFim,
  )

  const limparFiltros = () => {
    setPlataformaFiltro('')
    setStatusFiltro('')
    setImovelFiltro('')
    setDataInicio('')
    setDataFim('')
  }

  const handleExportCSV = async () => {
    const { exportarCSV } = await import('@/lib/actions/export')
    const { ExportTarget } = await import('@/types')
    const res = await exportarCSV({
      target: ExportTarget.Reservas,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      imovel_id: imovelFiltro || undefined,
      status: statusFiltro || undefined,
    })
    if (res.data) {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservas-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const editarReserva = (id: string) => {
    setSheetOpen(false)
    setModal({ open: true, modo: 'editar', id })
  }

  const refresh = () => router.refresh()

  const columns: ColumnDef<ReservaListItem>[] = [
    {
      id: 'imovel',
      header: 'Imóvel',
      accessorFn: (r) => `${r.imovel_nome} ${r.imovel_bairro}`,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-navy-800">
            {row.original.imovel_nome}
          </p>
          <p className="text-xs text-ink-muted">{row.original.imovel_bairro}</p>
        </div>
      ),
    },
    {
      id: 'hospede',
      header: 'Hóspede',
      accessorFn: (r) => r.nome_hospede ?? '—',
      cell: ({ row }) => (
        <span className="text-sm text-ink">
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
      cell: ({ row }) => <PlataformaBadge plataforma={row.original.plataforma} />,
    },
    {
      id: 'bruto',
      header: 'Valor bruto',
      accessorFn: (r) => r.valor_bruto,
      cell: ({ row }) => formatCurrency(Number(row.original.valor_bruto)),
    },
    {
      id: 'liquido',
      header: 'Líquido',
      accessorFn: (r) => r.valor_liquido_proprietario ?? 0,
      cell: ({ row }) =>
        row.original.valor_liquido_proprietario != null ? (
          <span className="font-medium text-navy-800">
            {formatCurrency(Number(row.original.valor_liquido_proprietario))}
          </span>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
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
            <span className="text-sm font-medium">
              {Number(row.original.nota_hospede).toFixed(1)}
            </span>
          </span>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
  ]

  const imovelOptionsFiltro = useMemo(
    () => imoveis.map((i) => ({ value: i.id, label: i.nome_interno })),
    [imoveis],
  )

  const filtros = (
    <>
      <select
        value={plataformaFiltro}
        onChange={(e) => setPlataformaFiltro(e.target.value as Plataforma | '')}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por plataforma"
      >
        {PLATAFORMA_FILTRO.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={statusFiltro}
        onChange={(e) => setStatusFiltro(e.target.value as StatusReserva | '')}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por status"
      >
        {STATUS_FILTRO.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={imovelFiltro}
        onChange={(e) => setImovelFiltro(e.target.value)}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por imóvel"
      >
        <option value="">Todos os imóveis</option>
        {imovelOptionsFiltro.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="h-10 w-[150px]"
          aria-label="Data início"
        />
        <span className="text-ink-subtle">→</span>
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="h-10 w-[150px]"
          aria-label="Data fim"
        />
      </div>
      {hasFilters ? (
        <button
          type="button"
          onClick={limparFiltros}
          className="text-xs font-medium text-ink-muted hover:text-navy-700"
        >
          Limpar filtros
        </button>
      ) : null}
    </>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {filtrados.length} reserva{filtrados.length === 1 ? '' : 's'}
          {hasFilters ? ` (de ${reservas.length})` : ''}
        </p>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Sm}
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setModal({ open: true, modo: 'novo' })}
        >
          Nova reserva
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtrados}
        filters={filtros}
        searchPlaceholder="Buscar por hóspede ou imóvel..."
        emptyTitle="Nenhuma reserva"
        emptyMessage={
          hasFilters
            ? 'Ajuste os filtros para ver mais resultados.'
            : 'Crie a primeira reserva para começar.'
        }
        onExportCSV={handleExportCSV}
        onRowClick={(r) => {
          setSheetReservaId(r.id)
          setSheetOpen(true)
        }}
        pageSize={25}
      />

      <Dialog
        open={modal.open}
        onOpenChange={(o) => {
          if (!o) setModal({ open: false })
        }}
      >
        <DialogContent className="max-w-2xl">
          {modal.open && modal.modo === 'novo' ? (
            <ReservaForm
              modo="novo"
              imoveis={imoveis}
              onCancel={() => setModal({ open: false })}
              onSuccess={() => {
                setModal({ open: false })
                refresh()
              }}
            />
          ) : modal.open && modal.modo === 'editar' ? (
            <EditarReservaLoader
              reservaId={modal.id}
              imoveis={imoveis}
              onCancel={() => setModal({ open: false })}
              onSuccess={() => {
                setModal({ open: false })
                refresh()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ReservaSheet
        reservaId={sheetReservaId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={editarReserva}
        onChanged={refresh}
      />
    </>
  )
}
