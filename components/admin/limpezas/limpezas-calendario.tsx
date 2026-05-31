'use client'

import { useMemo } from 'react'
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatters'
import { StatusLimpeza } from '@/types'
import type { LimpezaItem } from './limpezas-client'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const STATUS_COLOR: Record<StatusLimpeza, string> = {
  [StatusLimpeza.Agendada]: 'bg-info-500',
  [StatusLimpeza.EmAndamento]: 'bg-gold-500',
  [StatusLimpeza.Concluida]: 'bg-success-500',
  [StatusLimpeza.Cancelada]: 'bg-danger-500',
}

const isoDay = (s: string) => s.slice(0, 10)

export function LimpezasCalendario({
  limpezas,
  mes,
  dataSelecionada,
  onSelecionarDia,
  onAbrirLimpeza,
}: {
  limpezas: LimpezaItem[]
  mes: string
  dataSelecionada: string
  onSelecionarDia: (dataIso: string) => void
  onAbrirLimpeza: (id: string) => void
}) {
  const dias = useMemo(() => {
    const ref = parseISO(`${mes}-01`)
    const inicio = startOfWeek(startOfMonth(ref), { weekStartsOn: 1 })
    const fim = endOfWeek(endOfMonth(ref), { weekStartsOn: 1 })
    const lista: Date[] = []
    let cur = inicio
    while (cur <= fim) {
      lista.push(cur)
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
    }
    return lista
  }, [mes])

  const porDia = useMemo(() => {
    const map = new Map<string, LimpezaItem[]>()
    for (const l of limpezas) {
      const key = isoDay(l.data_agendada)
      const arr = map.get(key) ?? []
      arr.push(l)
      map.set(key, arr)
    }
    return map
  }, [limpezas])

  const limpezasDoDia = porDia.get(dataSelecionada) ?? []
  const hojeIso = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="grid grid-cols-7 border-b border-line bg-sand-50 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const iso = format(dia, 'yyyy-MM-dd')
            const noMes = iso.slice(0, 7) === mes
            const ehHoje = iso === hojeIso
            const selecionado = iso === dataSelecionada
            const itens = porDia.get(iso) ?? []
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelecionarDia(iso)}
                className={cn(
                  'flex min-h-[88px] flex-col items-start gap-1 border-b border-r border-line p-2 text-left transition-colors',
                  'hover:bg-sand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
                  !noMes && 'bg-sand-50/50 text-ink-subtle',
                  selecionado && 'ring-2 ring-inset ring-gold-400',
                )}
                aria-label={`${format(dia, 'PPP', { locale: ptBR })} — ${itens.length} limpezas`}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    ehHoje
                      ? 'bg-navy-700 text-white'
                      : noMes
                        ? 'text-navy-800'
                        : 'text-ink-subtle',
                  )}
                >
                  {format(dia, 'd')}
                </span>
                {itens.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {itens.slice(0, 4).map((l) => (
                      <span
                        key={l.id}
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          STATUS_COLOR[l.status],
                        )}
                        aria-hidden
                      />
                    ))}
                    {itens.length > 4 ? (
                      <span className="text-[10px] text-ink-muted">
                        +{itens.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <Legend color={STATUS_COLOR[StatusLimpeza.Agendada]} label="Agendada" />
        <Legend
          color={STATUS_COLOR[StatusLimpeza.EmAndamento]}
          label="Em andamento"
        />
        <Legend
          color={STATUS_COLOR[StatusLimpeza.Concluida]}
          label="Concluída"
        />
        <Legend
          color={STATUS_COLOR[StatusLimpeza.Cancelada]}
          label="Cancelada"
        />
      </div>

      <div>
        <h3 className="mb-2 font-display text-lg text-navy-700">
          {formatDate(dataSelecionada)}
        </h3>
        {limpezasDoDia.length === 0 ? (
          <p className="rounded-md border border-dashed border-line-strong bg-sand-50 px-4 py-6 text-center text-sm text-ink-muted">
            Sem limpezas neste dia.
          </p>
        ) : (
          <ul className="divide-y divide-line/60 overflow-hidden rounded-lg border border-line bg-white">
            {limpezasDoDia
              .slice()
              .sort((a, b) => a.data_agendada.localeCompare(b.data_agendada))
              .map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onAbrirLimpeza(l.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-sand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-800">
                        {l.imovel.nome_interno}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {format(parseISO(l.data_agendada), 'HH:mm')}
                        {l.responsavel ? ` · ${l.responsavel}` : ''}
                      </p>
                    </div>
                    <BadgeStatus
                      variant={BadgeStatusVariant.Limpeza}
                      status={l.status}
                    />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  )
}
