'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sparkles } from 'lucide-react'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { updateLimpeza } from '@/lib/actions/limpezas'
import { StatusLimpeza } from '@/types'
import { toast } from 'sonner'

export type LimpezaHoje = {
  id: string
  data_agendada: string
  status: StatusLimpeza
  responsavel?: string
  imovel: { id: string; nome_interno: string; bairro: string }
}

export function LimpezasHoje({ limpezas }: { limpezas: LimpezaHoje[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleTransition = (id: string, novoStatus: StatusLimpeza) => {
    startTransition(async () => {
      const res = await updateLimpeza(id, { status: novoStatus })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(
          novoStatus === StatusLimpeza.EmAndamento
            ? 'Limpeza iniciada'
            : 'Limpeza concluída',
        )
        router.refresh()
      }
    })
  }

  const hoje = new Date()

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div>
          <h2 className="font-display text-lg text-navy-700">Limpezas hoje</h2>
          <p className="text-xs text-ink-muted">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Link
          href="/limpezas"
          className="text-xs font-medium text-gold-700 hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {limpezas.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icone={<Sparkles className="h-8 w-8" />}
              titulo="Nada agendado hoje"
              descricao="As limpezas de hoje aparecerão aqui."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {limpezas.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy-800">
                    {l.imovel.nome_interno}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {format(parseISO(l.data_agendada), 'HH:mm')} ·{' '}
                    {l.responsavel ?? 'sem responsável'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeStatus
                    variant={BadgeStatusVariant.Limpeza}
                    status={l.status}
                  />
                  {l.status === StatusLimpeza.Agendada ? (
                    <Button
                      variant={ButtonVariant.Outline}
                      size={ButtonSize.Sm}
                      disabled={pending}
                      onClick={() =>
                        handleTransition(l.id, StatusLimpeza.EmAndamento)
                      }
                    >
                      Iniciar
                    </Button>
                  ) : l.status === StatusLimpeza.EmAndamento ? (
                    <Button
                      variant={ButtonVariant.Primary}
                      size={ButtonSize.Sm}
                      disabled={pending}
                      onClick={() =>
                        handleTransition(l.id, StatusLimpeza.Concluida)
                      }
                    >
                      Concluir
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
