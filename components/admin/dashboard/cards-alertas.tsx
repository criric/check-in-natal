'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bell,
  Building2,
  CalendarX,
  FileWarning,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { marcarAlertaLido } from '@/lib/actions/alertas'
import { PrioridadeAlerta, TipoAlerta } from '@/types'
import { cn } from '@/lib/utils/cn'

export type AlertaItem = {
  id: string
  tipo: TipoAlerta
  titulo: string
  prioridade: PrioridadeAlerta
  created_at: string
  lido: boolean
  imovel?: { id: string; nome_interno: string }
}

const ICON_MAP: Record<TipoAlerta, React.ElementType> = {
  [TipoAlerta.CheckinSemLimpeza]: Sparkles,
  [TipoAlerta.ImovelSemReserva]: CalendarX,
  [TipoAlerta.RepassePendente]: FileWarning,
  [TipoAlerta.ManutencaoParada]: Wrench,
  [TipoAlerta.ManutencaoAberta]: Wrench,
  [TipoAlerta.ContratoVencendo]: FileWarning,
  [TipoAlerta.VistoriaCritica]: FileWarning,
  [TipoAlerta.VistoriaAtencao]: FileWarning,
}

const PRIORIDADE_BARRA: Record<PrioridadeAlerta, string> = {
  [PrioridadeAlerta.Critica]: 'bg-danger-600',
  [PrioridadeAlerta.Alta]: 'bg-warning-500',
  [PrioridadeAlerta.Media]: 'bg-info-500',
  [PrioridadeAlerta.Baixa]: 'bg-navy-300',
}

export function CardsAlertas({ alertas }: { alertas: AlertaItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleClick = (id: string) => {
    startTransition(async () => {
      await marcarAlertaLido(id)
      router.refresh()
    })
  }

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="font-display text-lg text-navy-700">Alertas recentes</h2>
        <Link
          href="/alertas"
          className="text-xs font-medium text-gold-700 hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {alertas.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icone={<Bell className="h-8 w-8" />}
              titulo="Tudo certo"
              descricao="Sem alertas pendentes no momento."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {alertas.slice(0, 5).map((alerta) => {
              const Icon = ICON_MAP[alerta.tipo] ?? Bell
              return (
                <li key={alerta.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleClick(alerta.id)}
                    className={cn(
                      'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sand-50',
                      !alerta.lido && 'bg-gold-50/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1 h-8 w-1 shrink-0 rounded-full',
                        PRIORIDADE_BARRA[alerta.prioridade],
                      )}
                    />
                    <div className="mt-0.5 shrink-0 rounded-md bg-sand-100 p-1.5 text-navy-600">
                      <Icon className="h-4 w-4" />
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
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
