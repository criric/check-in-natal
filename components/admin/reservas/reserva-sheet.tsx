'use client'

import { useEffect, useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import {
  CalendarCheck,
  CalendarX,
  CircleDot,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Star,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import {
  ConfirmDialog,
  ConfirmVariant,
} from '@/components/ui/confirm-dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSide,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  getReservaById,
  updateReserva,
  updateStatusReserva,
} from '@/lib/actions/reservas'
import { formatCurrency } from '@/lib/utils/formatters'
import { Plataforma, StatusReserva } from '@/types'

export type ReservaSheetDetalhe = {
  id: string
  imovel_id: string
  plataforma: Plataforma
  status: StatusReserva
  id_externo?: string | null
  nome_hospede?: string | null
  email_hospede?: string | null
  telefone_hospede?: string | null
  data_checkin: string
  data_checkout: string
  num_hospedes: number
  noites: number
  valor_bruto: number
  taxa_plataforma: number
  valor_liquido_proprietario?: number | null
  nota_hospede?: number | null
  comentario_hospede?: string | null
  observacoes_internas?: string | null
  created_at?: string | null
  updated_at?: string | null
  imovel?: {
    id: string
    nome_interno: string
    bairro: string
    comissao_percentual: number
  }
}

export type ReservaSheetProps = {
  reservaId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
  onEdit?: (id: string) => void
}

const TRANSICOES: Record<StatusReserva, StatusReserva[]> = {
  [StatusReserva.Confirmada]: [
    StatusReserva.CheckinRealizado,
    StatusReserva.NoShow,
    StatusReserva.Cancelada,
  ],
  [StatusReserva.CheckinRealizado]: [
    StatusReserva.CheckoutRealizado,
    StatusReserva.Cancelada,
  ],
  [StatusReserva.CheckoutRealizado]: [],
  [StatusReserva.Cancelada]: [],
  [StatusReserva.NoShow]: [],
}

const ACTION_LABEL: Record<StatusReserva, { label: string; icon: React.ReactNode; variant: ButtonVariant }> = {
  [StatusReserva.Confirmada]: {
    label: 'Reabrir',
    icon: <CircleDot className="h-3.5 w-3.5" />,
    variant: ButtonVariant.Outline,
  },
  [StatusReserva.CheckinRealizado]: {
    label: 'Registrar check-in',
    icon: <LogIn className="h-3.5 w-3.5" />,
    variant: ButtonVariant.Primary,
  },
  [StatusReserva.CheckoutRealizado]: {
    label: 'Registrar check-out',
    icon: <LogOut className="h-3.5 w-3.5" />,
    variant: ButtonVariant.Primary,
  },
  [StatusReserva.NoShow]: {
    label: 'Marcar no-show',
    icon: <UserX className="h-3.5 w-3.5" />,
    variant: ButtonVariant.Outline,
  },
  [StatusReserva.Cancelada]: {
    label: 'Cancelar',
    icon: <CalendarX className="h-3.5 w-3.5" />,
    variant: ButtonVariant.Danger,
  },
}

type EventoHistorico = {
  status: StatusReserva
  label: string
  data?: string | null
  concluido: boolean
}

/**
 * Deriva a linha do tempo de status a partir dos dados disponíveis na reserva.
 * Não há tabela de auditoria: usamos created_at (confirmação), as datas de
 * check-in/check-out e updated_at (para estados terminais) como referência.
 */
function buildHistorico(r: ReservaSheetDetalhe): EventoHistorico[] {
  const eventos: EventoHistorico[] = [
    {
      status: StatusReserva.Confirmada,
      label: 'Reserva confirmada',
      data: r.created_at,
      concluido: true,
    },
  ]

  if (r.status === StatusReserva.Cancelada) {
    eventos.push({
      status: StatusReserva.Cancelada,
      label: 'Reserva cancelada',
      data: r.updated_at,
      concluido: true,
    })
    return eventos
  }

  if (r.status === StatusReserva.NoShow) {
    eventos.push({
      status: StatusReserva.NoShow,
      label: 'No-show registrado',
      data: r.updated_at,
      concluido: true,
    })
    return eventos
  }

  const checkinFeito =
    r.status === StatusReserva.CheckinRealizado ||
    r.status === StatusReserva.CheckoutRealizado
  const checkoutFeito = r.status === StatusReserva.CheckoutRealizado

  eventos.push({
    status: StatusReserva.CheckinRealizado,
    label: 'Check-in',
    data: r.data_checkin,
    concluido: checkinFeito,
  })
  eventos.push({
    status: StatusReserva.CheckoutRealizado,
    label: 'Check-out',
    data: r.data_checkout,
    concluido: checkoutFeito,
  })

  return eventos
}

export function ReservaSheet({
  reservaId,
  open,
  onOpenChange,
  onChanged,
  onEdit,
}: ReservaSheetProps) {
  const [reserva, setReserva] = useState<ReservaSheetDetalhe | undefined>()
  const [loading, setLoading] = useState(false)
  const [pendingStatus, startStatusTransition] = useTransition()
  const [notaDraft, setNotaDraft] = useState<string>('')
  const [comentarioDraft, setComentarioDraft] = useState<string>('')
  const [savingAval, setSavingAval] = useState(false)

  useEffect(() => {
    if (!open || !reservaId) return
    let cancelled = false
    setLoading(true)
    void getReservaById(reservaId).then((res) => {
      if (cancelled) return
      if (res.data) {
        const r = res.data as Record<string, unknown> & {
          imovel?: { id: string; nome_interno: string; bairro: string; comissao_percentual: number }
        }
        setReserva({
          id: String(r.id),
          imovel_id: String(r.imovel_id),
          plataforma: r.plataforma as Plataforma,
          status: r.status as StatusReserva,
          id_externo: (r.id_externo as string) ?? null,
          nome_hospede: (r.nome_hospede as string) ?? null,
          email_hospede: (r.email_hospede as string) ?? null,
          telefone_hospede: (r.telefone_hospede as string) ?? null,
          data_checkin: String(r.data_checkin),
          data_checkout: String(r.data_checkout),
          num_hospedes: Number(r.num_hospedes ?? 1),
          noites: Number(r.noites ?? 0),
          valor_bruto: Number(r.valor_bruto ?? 0),
          taxa_plataforma: Number(r.taxa_plataforma ?? 0),
          valor_liquido_proprietario: r.valor_liquido_proprietario
            ? Number(r.valor_liquido_proprietario)
            : null,
          nota_hospede: r.nota_hospede ? Number(r.nota_hospede) : null,
          comentario_hospede: (r.comentario_hospede as string) ?? null,
          observacoes_internas: (r.observacoes_internas as string) ?? null,
          created_at: (r.created_at as string) ?? null,
          updated_at: (r.updated_at as string) ?? null,
          imovel: r.imovel,
        })
        setNotaDraft(r.nota_hospede ? String(r.nota_hospede) : '')
        setComentarioDraft((r.comentario_hospede as string) ?? '')
      } else if (res.error) {
        toast.error(res.error)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, reservaId])

  const transitionTo = (next: StatusReserva) => {
    if (!reserva) return
    startStatusTransition(async () => {
      const res = await updateStatusReserva(reserva.id, next)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Status atualizado')
      setReserva({ ...reserva, status: next })
      onChanged?.()
    })
  }

  const salvarAvaliacao = async () => {
    if (!reserva) return
    const nota = notaDraft.trim() === '' ? undefined : Number(notaDraft)
    if (nota !== undefined && (Number.isNaN(nota) || nota < 0 || nota > 5)) {
      toast.error('Nota deve ser entre 0 e 5')
      return
    }
    setSavingAval(true)
    try {
      const res = await updateReserva(reserva.id, {
        nota_hospede: nota,
        comentario_hospede: comentarioDraft.trim() || undefined,
      } as Parameters<typeof updateReserva>[1])
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Avaliação atualizada')
      setReserva({
        ...reserva,
        nota_hospede: nota ?? null,
        comentario_hospede: comentarioDraft.trim() || null,
      })
      onChanged?.()
    } finally {
      setSavingAval(false)
    }
  }

  const cancelar = () => {
    if (!reserva) return
    transitionTo(StatusReserva.Cancelada)
  }

  const proximas = reserva ? TRANSICOES[reserva.status] : []
  const historico = reserva ? buildHistorico(reserva) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={SheetSide.Right}
        className="w-full max-w-md overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Detalhes da reserva</SheetTitle>
          {reserva?.imovel ? (
            <SheetDescription>
              {reserva.imovel.nome_interno} · {reserva.imovel.bairro}
            </SheetDescription>
          ) : (
            <SheetDescription>
              {loading ? 'Carregando...' : 'Selecione uma reserva'}
            </SheetDescription>
          )}
        </SheetHeader>

        {reserva ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeStatus
                variant={BadgeStatusVariant.Reserva}
                status={reserva.status}
              />
              <PlataformaBadge plataforma={reserva.plataforma} />
              {reserva.id_externo ? (
                <span className="text-2xs text-ink-muted">
                  ID externo: {reserva.id_externo}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-line bg-sand-50 p-3 text-xs">
              <div>
                <p className="text-2xs uppercase tracking-wider text-ink-subtle">
                  Check-in
                </p>
                <p className="mt-0.5 font-medium text-navy-800">
                  {format(parseISO(reserva.data_checkin), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-ink-subtle">
                  Check-out
                </p>
                <p className="mt-0.5 font-medium text-navy-800">
                  {format(parseISO(reserva.data_checkout), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-ink-subtle">
                  Noites
                </p>
                <p className="mt-0.5 font-medium text-navy-800">
                  {reserva.noites}
                </p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-ink-subtle">
                  Hóspedes
                </p>
                <p className="mt-0.5 font-medium text-navy-800">
                  {reserva.num_hospedes}
                </p>
              </div>
            </div>

            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Hóspede
              </p>
              <p className="mt-1 font-medium text-navy-800">
                {reserva.nome_hospede ?? '—'}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                {reserva.email_hospede ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {reserva.email_hospede}
                  </p>
                ) : null}
                {reserva.telefone_hospede ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {reserva.telefone_hospede}
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Valores
              </p>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-ink-muted">Valor bruto</dt>
                <dd className="text-right text-ink">
                  {formatCurrency(reserva.valor_bruto)}
                </dd>
                <dt className="text-ink-muted">Taxa plataforma</dt>
                <dd className="text-right text-ink">
                  {formatCurrency(reserva.taxa_plataforma)}
                </dd>
                <dt className="font-semibold text-navy-700">
                  Líquido ao proprietário
                </dt>
                <dd className="text-right font-semibold text-navy-800">
                  {reserva.valor_liquido_proprietario != null
                    ? formatCurrency(reserva.valor_liquido_proprietario)
                    : '—'}
                </dd>
              </dl>
            </div>

            {proximas.length > 0 ? (
              <div className="space-y-2">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                  Próximas ações
                </p>
                <div className="flex flex-wrap gap-2">
                  {proximas.map((next) => {
                    const cfg = ACTION_LABEL[next]
                    if (next === StatusReserva.Cancelada) {
                      return (
                        <ConfirmDialog
                          key={next}
                          titulo="Cancelar reserva?"
                          descricao="Esta ação não pode ser desfeita. A reserva ficará indisponível para repasses."
                          confirmLabel="Cancelar reserva"
                          cancelLabel="Voltar"
                          variant={ConfirmVariant.Destructive}
                          onConfirm={cancelar}
                          trigger={
                            <Button
                              variant={cfg.variant}
                              size={ButtonSize.Sm}
                              leadingIcon={cfg.icon}
                              disabled={pendingStatus}
                            >
                              {cfg.label}
                            </Button>
                          }
                        />
                      )
                    }
                    return (
                      <Button
                        key={next}
                        variant={cfg.variant}
                        size={ButtonSize.Sm}
                        leadingIcon={cfg.icon}
                        onClick={() => transitionTo(next)}
                        loading={pendingStatus}
                      >
                        {cfg.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Histórico de status
              </p>
              <ol className="relative space-y-3 pl-5">
                <span
                  aria-hidden
                  className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-line"
                />
                {historico.map((ev) => (
                  <li key={ev.status} className="relative">
                    <span
                      aria-hidden
                      className={
                        'absolute -left-5 top-1 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ' +
                        (ev.concluido ? 'bg-success-500' : 'bg-line-strong')
                      }
                    />
                    <p
                      className={
                        'text-sm ' +
                        (ev.concluido
                          ? 'font-medium text-navy-800'
                          : 'text-ink-muted')
                      }
                    >
                      {ev.label}
                      {!ev.concluido ? ' (pendente)' : ''}
                    </p>
                    {ev.data ? (
                      <p className="text-2xs text-ink-subtle">
                        {format(
                          parseISO(ev.data),
                          ev.data.length > 10
                            ? "dd/MM/yyyy 'às' HH:mm"
                            : 'dd/MM/yyyy',
                        )}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Avaliação do hóspede
              </p>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <Field label="Nota (0 a 5)">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={notaDraft}
                      onChange={(e) => setNotaDraft(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Comentário">
                  {({ id, describedBy }) => (
                    <Textarea
                      id={id}
                      aria-describedby={describedBy}
                      rows={3}
                      value={comentarioDraft}
                      onChange={(e) => setComentarioDraft(e.target.value)}
                      placeholder="Opcional"
                    />
                  )}
                </Field>
              </div>
              <div className="flex items-center justify-end">
                <Button
                  variant={ButtonVariant.Outline}
                  size={ButtonSize.Sm}
                  leadingIcon={<Star className="h-3.5 w-3.5" />}
                  onClick={salvarAvaliacao}
                  loading={savingAval}
                >
                  Salvar avaliação
                </Button>
              </div>
            </div>

            {reserva.observacoes_internas ? (
              <>
                <Separator />
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                    Observações internas
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {reserva.observacoes_internas}
                  </p>
                </div>
              </>
            ) : null}

            {reserva.created_at ? (
              <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
                <CalendarCheck className="h-3 w-3" />
                Criada em {format(parseISO(reserva.created_at), 'dd/MM/yyyy HH:mm')}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              {onEdit ? (
                <Button
                  variant={ButtonVariant.Outline}
                  size={ButtonSize.Sm}
                  onClick={() => onEdit(reserva.id)}
                >
                  Editar
                </Button>
              ) : null}
            </div>
          </div>
        ) : loading ? (
          <p role="status" aria-live="polite" className="text-sm text-ink-muted">
            Carregando reserva...
          </p>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
