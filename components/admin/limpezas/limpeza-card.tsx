'use client'

import { useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Play,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress, ProgressTone } from '@/components/ui/progress'
import { updateLimpeza } from '@/lib/actions/limpezas'
import { formatDate } from '@/lib/utils/formatters'
import { StatusLimpeza } from '@/types'
import type { LimpezaItem } from './limpezas-client'

export function LimpezaCard({
  limpeza,
  onAbrir,
}: {
  limpeza: LimpezaItem
  onAbrir: () => void
}) {
  const [pending, startTransition] = useTransition()

  const totalCheck = Object.keys(limpeza.checklist).length || 10
  const doneCheck = Object.values(limpeza.checklist).filter(Boolean).length
  const progresso = totalCheck > 0 ? Math.round((doneCheck / totalCheck) * 100) : 0
  const hora = format(parseISO(limpeza.data_agendada), 'HH:mm')

  const transicionar = (novo: StatusLimpeza) => {
    startTransition(async () => {
      const res = await updateLimpeza(limpeza.id, { status: novo })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(
        novo === StatusLimpeza.EmAndamento
          ? 'Limpeza iniciada'
          : 'Limpeza concluída',
      )
    })
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-navy-800">
            {limpeza.imovel.nome_interno}
          </p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Building2 className="h-3 w-3" aria-hidden />
            {limpeza.imovel.bairro}
          </p>
        </div>
        <BadgeStatus
          variant={BadgeStatusVariant.Limpeza}
          status={limpeza.status}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-ink">
          <Clock className="h-3.5 w-3.5 text-navy-500" aria-hidden />
          <span className="font-medium">{hora}</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink">
          <User className="h-3.5 w-3.5 text-navy-500" aria-hidden />
          <span className="truncate">
            {limpeza.responsavel ?? (
              <span className="text-ink-subtle">sem responsável</span>
            )}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">Checklist</span>
          <span className="font-medium text-navy-800">
            {doneCheck}/{totalCheck}
          </span>
        </div>
        <Progress
          value={progresso}
          tone={progresso === 100 ? ProgressTone.Success : ProgressTone.Brand}
        />
      </div>

      {limpeza.reserva ? (
        <div className="flex items-start gap-1.5 rounded-md border border-info-100 bg-info-50 px-2 py-1.5 text-xs text-info-700">
          <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p className="min-w-0 truncate">
            Check-in {formatDate(limpeza.reserva.data_checkin)} ·{' '}
            <span className="font-medium">
              {limpeza.reserva.nome_hospede ?? 'hóspede'}
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {limpeza.status === StatusLimpeza.Agendada ? (
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Sm}
            leadingIcon={<Play className="h-3.5 w-3.5" />}
            disabled={pending}
            onClick={() => transicionar(StatusLimpeza.EmAndamento)}
          >
            Iniciar
          </Button>
        ) : null}
        {limpeza.status === StatusLimpeza.EmAndamento ? (
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            disabled={pending}
            onClick={() => transicionar(StatusLimpeza.Concluida)}
          >
            Concluir
          </Button>
        ) : null}
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={onAbrir}
          className="ml-auto"
        >
          Detalhes
        </Button>
      </div>
    </Card>
  )
}
