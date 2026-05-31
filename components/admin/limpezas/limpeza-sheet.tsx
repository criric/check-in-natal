'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Play,
  Timer,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ConfirmDialog,
  ConfirmVariant,
} from '@/components/ui/confirm-dialog'
import { Progress, ProgressTone } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSide,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { UploadFotos } from '@/components/ui/upload-fotos'
import {
  updateLimpeza,
  uploadFotoLimpeza,
} from '@/lib/actions/limpezas'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { StatusLimpeza } from '@/types'
import type { LimpezaItem } from './limpezas-client'

const CHECKLIST_ITENS: Array<{ key: string; label: string }> = [
  { key: 'cozinha', label: 'Cozinha' },
  { key: 'banheiros', label: 'Banheiros' },
  { key: 'quartos', label: 'Quartos' },
  { key: 'sala', label: 'Sala' },
  { key: 'varanda', label: 'Varanda' },
  { key: 'roupas_cama_trocadas', label: 'Roupas de cama trocadas' },
  { key: 'toalhas_trocadas', label: 'Toalhas trocadas' },
  { key: 'lixo_retirado', label: 'Lixo retirado' },
  { key: 'amenidades_repostas', label: 'Amenidades repostas' },
  { key: 'fotos_registradas', label: 'Fotos registradas' },
]

export type LimpezaSheetProps = {
  limpeza?: LimpezaItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}

export function LimpezaSheet({
  limpeza,
  open,
  onOpenChange,
  onChanged,
}: LimpezaSheetProps) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [obs, setObs] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fotos, setFotos] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const obsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const checklistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    if (limpeza) {
      setChecklist(limpeza.checklist ?? {})
      setObs(limpeza.observacoes ?? '')
      setFotos(limpeza.fotos ?? [])
    }
  }, [limpeza?.id, limpeza])

  const totalCheck = CHECKLIST_ITENS.length
  const doneCheck = useMemo(
    () => CHECKLIST_ITENS.filter((c) => checklist[c.key]).length,
    [checklist],
  )
  const progresso = Math.round((doneCheck / totalCheck) * 100)

  if (!limpeza) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={SheetSide.Right}
          className="w-full max-w-md overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Limpeza</SheetTitle>
            <SheetDescription>Selecione uma limpeza</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const transicionar = (novo: StatusLimpeza) => {
    startTransition(async () => {
      const res = await updateLimpeza(limpeza.id, { status: novo })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Status atualizado')
      onChanged?.()
    })
  }

  const toggleItem = (key: string) => {
    const novo = { ...checklist, [key]: !checklist[key] }
    setChecklist(novo)
    if (checklistTimer.current) clearTimeout(checklistTimer.current)
    checklistTimer.current = setTimeout(async () => {
      const res = await updateLimpeza(limpeza.id, { checklist: novo })
      if (res.error) toast.error(res.error)
      else onChanged?.()
    }, 500)
  }

  const salvarObs = (texto: string) => {
    setObs(texto)
    if (obsTimer.current) clearTimeout(obsTimer.current)
    obsTimer.current = setTimeout(async () => {
      const res = await updateLimpeza(limpeza.id, { observacoes: texto })
      if (res.error) toast.error(res.error)
      else onChanged?.()
    }, 600)
  }

  const handleUploadFotos = async (files: File[]) => {
    setUploading(true)
    try {
      for (const f of files) {
        const res = await uploadFotoLimpeza(limpeza.id, f)
        if (res.error) {
          toast.error(res.error)
        } else if (res.data?.url) {
          setFotos((prev) => [...prev, res.data!.url])
        }
      }
      toast.success('Fotos enviadas')
      onChanged?.()
    } finally {
      setUploading(false)
    }
  }

  const hora = format(parseISO(limpeza.data_agendada), 'HH:mm')
  const podeIniciar = limpeza.status === StatusLimpeza.Agendada
  const podeConcluir = limpeza.status === StatusLimpeza.EmAndamento
  const podeCancelar =
    limpeza.status !== StatusLimpeza.Cancelada &&
    limpeza.status !== StatusLimpeza.Concluida

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={SheetSide.Right}
        className="w-full max-w-md overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{limpeza.imovel.nome_interno}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3" aria-hidden /> {limpeza.imovel.bairro}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus
              variant={BadgeStatusVariant.Limpeza}
              status={limpeza.status}
            />
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Clock className="h-3 w-3" aria-hidden /> {formatDate(limpeza.data_agendada)}{' '}
              · {hora}
            </span>
            {limpeza.responsavel ? (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <User className="h-3 w-3" aria-hidden /> {limpeza.responsavel}
              </span>
            ) : null}
          </div>

          {limpeza.reserva ? (
            <div className="rounded-md border border-info-100 bg-info-50 p-3 text-xs text-info-700">
              <p className="flex items-center gap-1.5 font-semibold">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> Reserva vinculada
              </p>
              <p className="mt-1">
                {limpeza.reserva.nome_hospede ?? 'Hóspede'} · check-in{' '}
                {formatDate(limpeza.reserva.data_checkin)} → check-out{' '}
                {formatDate(limpeza.reserva.data_checkout)}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {podeIniciar ? (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Sm}
                leadingIcon={<Play className="h-3.5 w-3.5" />}
                onClick={() => transicionar(StatusLimpeza.EmAndamento)}
                loading={pending}
              >
                Iniciar limpeza
              </Button>
            ) : null}
            {podeConcluir ? (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Sm}
                leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => transicionar(StatusLimpeza.Concluida)}
                loading={pending}
              >
                Concluir
              </Button>
            ) : null}
            {podeCancelar ? (
              <ConfirmDialog
                titulo="Cancelar limpeza?"
                descricao="Esta ação marca a limpeza como cancelada."
                confirmLabel="Cancelar limpeza"
                cancelLabel="Voltar"
                variant={ConfirmVariant.Destructive}
                onConfirm={() => transicionar(StatusLimpeza.Cancelada)}
                trigger={
                  <Button
                    variant={ButtonVariant.Outline}
                    size={ButtonSize.Sm}
                    leadingIcon={<XCircle className="h-3.5 w-3.5" />}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                }
              />
            ) : null}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Checklist
              </p>
              <span className="text-xs font-medium text-navy-800">
                {doneCheck}/{totalCheck}
              </span>
            </div>
            <Progress
              value={progresso}
              tone={progresso === 100 ? ProgressTone.Success : ProgressTone.Brand}
            />
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CHECKLIST_ITENS.map((item) => {
                const marcado = Boolean(checklist[item.key])
                return (
                  <li key={item.key}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors',
                        marcado
                          ? 'border-success-100 bg-success-50 text-navy-800'
                          : 'border-line hover:bg-sand-50',
                      )}
                    >
                      <Checkbox
                        checked={marcado}
                        onCheckedChange={() => toggleItem(item.key)}
                      />
                      <span className={cn(marcado && 'line-through text-ink-muted')}>
                        {item.label}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Fotos da conclusão
            </p>
            <UploadFotos
              maxFiles={20}
              maxSizeMB={5}
              uploading={uploading}
              fotosExistentes={fotos.map((url) => ({ id: url, url }))}
              onUpload={handleUploadFotos}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Observações
            </p>
            <Textarea
              rows={3}
              value={obs}
              onChange={(e) => salvarObs(e.target.value)}
              placeholder="Notas sobre a limpeza, problemas encontrados..."
            />
            <p className="text-2xs text-ink-subtle">Salvamento automático</p>
          </div>

          <Separator />

          <div className="space-y-1.5 rounded-md border border-line bg-sand-50 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-navy-700">
              <Timer className="h-3.5 w-3.5 text-gold-600" aria-hidden /> Linha do tempo
            </p>
            <p>
              <span className="text-ink-muted">Agendada para</span>{' '}
              <span className="font-medium text-navy-800">
                {format(parseISO(limpeza.data_agendada), "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </p>
            {limpeza.data_inicio ? (
              <p>
                <span className="text-ink-muted">Iniciada em</span>{' '}
                <span className="font-medium text-navy-800">
                  {format(parseISO(limpeza.data_inicio), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </p>
            ) : null}
            {limpeza.data_conclusao ? (
              <p>
                <span className="text-ink-muted">Concluída em</span>{' '}
                <span className="font-medium text-navy-800">
                  {format(parseISO(limpeza.data_conclusao), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </p>
            ) : null}
            {limpeza.duracao_minutos ? (
              <p>
                <span className="text-ink-muted">Duração</span>{' '}
                <span className="font-medium text-navy-800">
                  {limpeza.duracao_minutos} min
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
