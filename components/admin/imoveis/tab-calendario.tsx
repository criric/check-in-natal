'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Plataforma, StatusReserva } from '@/types'

export type ReservaCal = {
  id: string
  data_checkin: string
  data_checkout: string
  plataforma: Plataforma | null
  status: StatusReserva
  nome_hospede?: string | null
}

export type BloqueioCal = {
  data: string
  motivo_bloqueio?: string | null
  preco_noite?: number | null
}

const PLATAFORMA_BG: Record<Plataforma, string> = {
  [Plataforma.Airbnb]: 'bg-[#FFE0E1] text-[#D2333A]',
  [Plataforma.Booking]: 'bg-[#D6E2FF] text-[#003580]',
  [Plataforma.Direto]: 'bg-success-100 text-success-700',
  [Plataforma.Outro]: 'bg-sand-200 text-navy-700',
}

function reservaContainsDay(r: ReservaCal, dia: Date): boolean {
  if (r.status === StatusReserva.Cancelada || r.status === StatusReserva.NoShow)
    return false
  const inicio = parseISO(r.data_checkin)
  const fim = parseISO(r.data_checkout)
  return dia >= inicio && dia < fim
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function TabCalendario({
  reservas,
  bloqueios,
}: {
  reservas: ReservaCal[]
  bloqueios: BloqueioCal[]
}) {
  const [refDate, setRefDate] = useState(() => startOfMonth(new Date()))

  const dias = useMemo(() => {
    const start = startOfMonth(refDate)
    const end = endOfMonth(refDate)
    return eachDayOfInterval({ start, end })
  }, [refDate])

  const offset = getDay(startOfMonth(refDate)) // 0 = Dom

  const bloqueiosMap = useMemo(() => {
    const m = new Map<string, BloqueioCal>()
    for (const b of bloqueios) {
      m.set(b.data.slice(0, 10), b)
    }
    return m
  }, [bloqueios])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefDate((d) => subMonths(d, 1))}
            aria-label="Mês anterior"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-sand-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRefDate((d) => addMonths(d, 1))}
            aria-label="Próximo mês"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-sand-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-2 font-display text-lg text-navy-800">
            {format(refDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Legenda cor="bg-[#FFE0E1]" label="Airbnb" />
          <Legenda cor="bg-[#D6E2FF]" label="Booking" />
          <Legenda cor="bg-success-100" label="Direto" />
          <Legenda cor="bg-sand-300" label="Bloqueado" />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-3">
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-2xs font-semibold uppercase tracking-wider text-ink-subtle"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {dias.map((dia) => {
            const reservaDoDia = reservas.find((r) => reservaContainsDay(r, dia))
            const diaStr = format(dia, 'yyyy-MM-dd')
            const bloqueio = bloqueiosMap.get(diaStr)
            const bloqueado = bloqueio && !bloqueio.preco_noite ? bloqueio : undefined
            const isToday = isSameDay(dia, new Date())

            return (
              <div
                key={diaStr}
                className={cn(
                  'group relative aspect-square rounded-md border p-1.5 text-xs',
                  isToday
                    ? 'border-gold-400 ring-1 ring-gold-200'
                    : 'border-line',
                  reservaDoDia
                    ? PLATAFORMA_BG[
                        (reservaDoDia.plataforma ?? Plataforma.Outro) as Plataforma
                      ]
                    : bloqueado
                    ? 'bg-sand-300 text-navy-700'
                    : 'bg-white text-ink',
                )}
              >
                <span className="text-2xs font-semibold">
                  {format(dia, 'd')}
                </span>
                {reservaDoDia ? (
                  <p className="mt-0.5 line-clamp-1 text-2xs">
                    {reservaDoDia.nome_hospede ?? 'Reserva'}
                  </p>
                ) : bloqueado ? (
                  <p className="mt-0.5 text-2xs">Bloqueado</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span aria-hidden className={cn('inline-block h-3 w-3 rounded-sm', cor)} />
      {label}
    </span>
  )
}
