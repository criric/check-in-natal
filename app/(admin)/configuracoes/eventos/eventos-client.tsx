'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarPlus, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { ConfirmDialog, ConfirmVariant } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  createEventoSazonal,
  deleteEventoSazonal,
  updateEventoSazonal,
} from '@/lib/actions/precificacao'
import { cn } from '@/lib/utils/cn'
import type { EventoSazonal } from '@/types'

type Form = {
  id?: string
  nome: string
  data_inicio: string
  data_fim: string
  multiplicador_preco: number
  descricao: string
  recorrente_anual: boolean
  ativo: boolean
}

const VAZIO: Form = {
  nome: '',
  data_inicio: '',
  data_fim: '',
  multiplicador_preco: 1.0,
  descricao: '',
  recorrente_anual: false,
  ativo: true,
}

function corMultiplicador(m: number): string {
  if (m < 1) return 'bg-success-50 text-success-700 border-success-100'
  if (m === 1) return 'bg-info-50 text-info-700 border-info-100'
  if (m <= 1.5) return 'bg-warning-50 text-warning-700 border-warning-100'
  return 'bg-danger-50 text-danger-700 border-danger-100'
}

function formatarData(iso: string): string {
  try {
    return format(parseISO(iso.slice(0, 10)), 'dd MMM yyyy', { locale: ptBR })
  } catch {
    return iso.slice(0, 10)
  }
}

export function EventosClient({ eventos }: { eventos: EventoSazonal[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<Form>(VAZIO)
  const [erro, setErro] = useState<string | undefined>()
  const [pending, start] = useTransition()
  const [linhaPendente, setLinhaPendente] = useState<string | undefined>()

  const abrirNovo = () => {
    setForm(VAZIO)
    setErro(undefined)
    setAberto(true)
  }

  const abrirEdicao = (ev: EventoSazonal) => {
    setForm({
      id: ev.id,
      nome: ev.nome,
      data_inicio: ev.data_inicio.slice(0, 10),
      data_fim: ev.data_fim.slice(0, 10),
      multiplicador_preco: Number(ev.multiplicador_preco),
      descricao: ev.descricao ?? '',
      recorrente_anual: ev.recorrente_anual,
      ativo: ev.ativo,
    })
    setErro(undefined)
    setAberto(true)
  }

  const salvar = () => {
    if (!form.nome.trim()) {
      setErro('Nome obrigatório')
      return
    }
    if (!form.data_inicio || !form.data_fim) {
      setErro('Período obrigatório')
      return
    }
    start(async () => {
      setErro(undefined)
      const payload = {
        nome: form.nome.trim(),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        multiplicador_preco: Number(form.multiplicador_preco),
        descricao: form.descricao.trim() || undefined,
        recorrente_anual: form.recorrente_anual,
        ativo: form.ativo,
      }
      const res = form.id
        ? await updateEventoSazonal(form.id, payload)
        : await createEventoSazonal(payload)
      if (res.error) {
        setErro(res.error)
        return
      }
      toast.success(form.id ? 'Evento atualizado' : 'Evento criado')
      setAberto(false)
      router.refresh()
    })
  }

  const alternarAtivo = (ev: EventoSazonal) => {
    setLinhaPendente(ev.id)
    start(async () => {
      const res = await updateEventoSazonal(ev.id, {
        nome: ev.nome,
        data_inicio: ev.data_inicio.slice(0, 10),
        data_fim: ev.data_fim.slice(0, 10),
        multiplicador_preco: Number(ev.multiplicador_preco),
        descricao: ev.descricao,
        recorrente_anual: ev.recorrente_anual,
        ativo: !ev.ativo,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(ev.ativo ? 'Evento desativado' : 'Evento ativado')
      }
      router.refresh()
      setLinhaPendente(undefined)
    })
  }

  const excluir = (ev: EventoSazonal) => {
    setLinhaPendente(ev.id)
    start(async () => {
      const res = await deleteEventoSazonal(ev.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Evento excluído')
      }
      router.refresh()
      setLinhaPendente(undefined)
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Sm}
          leadingIcon={<CalendarPlus className="h-4 w-4" />}
          onClick={abrirNovo}
        >
          Novo evento
        </Button>
      </div>

      {eventos.length === 0 ? (
        <EmptyState
          icone={<Sparkles className="h-10 w-10" />}
          titulo="Nenhum evento cadastrado"
          descricao="Crie períodos com multiplicador de preço — feriados, festivais, alta temporada — para alimentar o motor de precificação."
          ctaLabel="Criar primeiro evento"
          ctaAction={abrirNovo}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  <Th>Nome</Th>
                  <Th>Período</Th>
                  <Th>Multiplicador</Th>
                  <Th>Recorrente</Th>
                  <Th>Ativo</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => {
                  const linhaBusy = linhaPendente === ev.id && pending
                  return (
                    <tr
                      key={ev.id}
                      className={cn(
                        'border-b border-line/60 transition-colors hover:bg-sand-50',
                        !ev.ativo && 'opacity-70',
                      )}
                    >
                      <td className="px-3 py-3 align-middle">
                        <p className="font-medium text-navy-800">{ev.nome}</p>
                        {ev.descricao ? (
                          <p className="text-xs text-ink-muted">
                            {ev.descricao}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-middle text-sm text-navy-700">
                        <span className="whitespace-nowrap">
                          {formatarData(ev.data_inicio)} →{' '}
                          {formatarData(ev.data_fim)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                            corMultiplicador(Number(ev.multiplicador_preco)),
                          )}
                        >
                          {Number(ev.multiplicador_preco).toFixed(2)}×
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle text-sm text-navy-700">
                        {ev.recorrente_anual ? 'Sim' : 'Não'}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <Toggle
                          checked={ev.ativo}
                          onChange={() => alternarAtivo(ev)}
                          disabled={linhaBusy}
                          label={ev.ativo ? 'Desativar' : 'Ativar'}
                        />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(ev)}
                            disabled={linhaBusy}
                            aria-label={`Editar ${ev.nome}`}
                            title="Editar"
                            className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand-100 hover:text-navy-700 disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <ConfirmDialog
                            trigger={
                              <button
                                type="button"
                                disabled={linhaBusy}
                                aria-label={`Excluir ${ev.nome}`}
                                title="Excluir"
                                className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-700 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            }
                            titulo="Excluir evento?"
                            descricao={`O evento "${ev.nome}" será removido. As precificações já calculadas não são afetadas.`}
                            confirmLabel="Excluir"
                            variant={ConfirmVariant.Destructive}
                            onConfirm={() => excluir(ev)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EventoFormDialog
        aberto={aberto}
        onOpenChange={(v) => {
          if (!v) {
            setErro(undefined)
          }
          setAberto(v)
        }}
        form={form}
        setForm={setForm}
        salvar={salvar}
        pending={pending}
        erro={erro}
      />
    </>
  )
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle',
        className,
      )}
    >
      {children}
    </th>
  )
}

// ─── Toggle switch ──────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-1',
        checked ? 'bg-gold-500' : 'bg-line-strong',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

// ─── Modal de criação/edição ────────────────────────────────────

function EventoFormDialog({
  aberto,
  onOpenChange,
  form,
  setForm,
  salvar,
  pending,
  erro,
}: {
  aberto: boolean
  onOpenChange: (v: boolean) => void
  form: Form
  setForm: (f: Form) => void
  salvar: () => void
  pending: boolean
  erro?: string
}) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {form.id ? 'Editar evento sazonal' : 'Novo evento sazonal'}
          </DialogTitle>
          <DialogDescription>
            Defina nome, período e multiplicador para influenciar a
            precificação dinâmica.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <CampoForm label="Nome" obrigatorio>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Carnaval, Réveillon, Festas Juninas"
            />
          </CampoForm>

          <div className="grid grid-cols-2 gap-3">
            <CampoForm label="Data início" obrigatorio>
              <Input
                type="date"
                value={form.data_inicio}
                onChange={(e) =>
                  setForm({ ...form, data_inicio: e.target.value })
                }
              />
            </CampoForm>
            <CampoForm label="Data fim" obrigatorio>
              <Input
                type="date"
                value={form.data_fim}
                onChange={(e) =>
                  setForm({ ...form, data_fim: e.target.value })
                }
              />
            </CampoForm>
          </div>

          <CampoForm
            label="Multiplicador de preço"
            ajuda="Valores entre 0,10× e 5,00×. Ex.: 1,50 aumenta a diária em 50%."
            obrigatorio
          >
            <Input
              type="number"
              step="0.05"
              min={0.1}
              max={5}
              value={form.multiplicador_preco}
              onChange={(e) =>
                setForm({
                  ...form,
                  multiplicador_preco: Number(e.target.value),
                })
              }
            />
          </CampoForm>

          <CampoForm label="Descrição">
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink shadow-xs focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200"
              placeholder="Notas internas sobre o evento (opcional)"
            />
          </CampoForm>

          <div className="flex flex-wrap items-center gap-4 rounded-md bg-sand-50 px-3 py-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-navy-700">
              <Toggle
                checked={form.recorrente_anual}
                onChange={() =>
                  setForm({ ...form, recorrente_anual: !form.recorrente_anual })
                }
                label="Recorrente anualmente"
              />
              Recorrente anualmente
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-navy-700">
              <Toggle
                checked={form.ativo}
                onChange={() => setForm({ ...form, ativo: !form.ativo })}
                label="Ativo"
              />
              Ativo
            </label>
          </div>

          {erro ? (
            <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {erro}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant={ButtonVariant.Ghost}
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            loading={pending}
            onClick={salvar}
          >
            {form.id ? 'Salvar alterações' : 'Criar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CampoForm({
  label,
  obrigatorio,
  ajuda,
  children,
}: {
  label: string
  obrigatorio?: boolean
  ajuda?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
        {obrigatorio ? (
          <span aria-hidden className="ml-0.5 text-danger-600">
            *
          </span>
        ) : null}
      </span>
      {children}
      {ajuda ? <span className="text-2xs text-ink-muted">{ajuda}</span> : null}
    </label>
  )
}
