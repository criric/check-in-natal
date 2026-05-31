'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { EmptyState } from '@/components/ui/empty-state'
import { marcarAlertaLido } from '@/lib/actions/alertas'
import { PrioridadeAlerta } from '@/types'
import { cn } from '@/lib/utils/cn'

export type AlertaPreview = {
  id: string
  titulo: string
  prioridade: PrioridadeAlerta
  created_at: string
  lido: boolean
  imovel?: { id: string; nome_interno: string }
}

export function AlertasPopover({
  alertas,
  totalNaoLidos,
}: {
  alertas: AlertaPreview[]
  totalNaoLidos: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [localCount, setLocalCount] = useState(totalNaoLidos)

  useEffect(() => {
    setLocalCount(totalNaoLidos)
  }, [totalNaoLidos])

  const handleClick = (id: string) => {
    setLocalCount((c) => Math.max(0, c - 1))
    startTransition(async () => {
      await marcarAlertaLido(id)
      router.refresh()
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notificações${localCount > 0 ? ` (${localCount} não lidas)` : ''}`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-sand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <Bell className="h-5 w-5" />
          {localCount > 0 ? (
            <span
              aria-hidden
              className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white"
            >
              {localCount > 99 ? '99+' : localCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-display text-sm font-semibold text-navy-700">
            Alertas recentes
          </p>
          <Link
            href="/alertas"
            className="text-xs font-medium text-gold-700 hover:underline"
            onClick={() => setOpen(false)}
          >
            Ver todos
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {alertas.length === 0 ? (
            <div className="p-4">
              <EmptyState
                titulo="Sem alertas"
                descricao="Tudo certo por aqui."
                icone={<Bell className="h-8 w-8" />}
              />
            </div>
          ) : (
            alertas.map((alerta) => (
              <button
                key={alerta.id}
                type="button"
                onClick={() => handleClick(alerta.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors hover:bg-sand-50',
                  !alerta.lido && 'bg-gold-50/40',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <BadgeStatus
                    variant={BadgeStatusVariant.Prioridade}
                    status={alerta.prioridade}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-navy-800">
                    {alerta.titulo}
                  </p>
                  {alerta.imovel ? (
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {alerta.imovel.nome_interno}
                    </p>
                  ) : null}
                  <p className="mt-1 text-2xs text-ink-subtle">
                    {formatDistanceToNow(new Date(alerta.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
