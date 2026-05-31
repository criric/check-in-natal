'use client'

import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button, ButtonVariant } from '@/components/ui/button'
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import { createLimpeza } from '@/lib/actions/limpezas'
import { formatDate } from '@/lib/utils/formatters'
import type { ImovelOpt, ReservaOpt } from './limpezas-client'

const SEM_RESERVA = '__sem_reserva__'

export type LimpezaFormProps = {
  imoveis: ImovelOpt[]
  reservasProximas: ReservaOpt[]
  dataInicial: string
  onSuccess?: () => void
  onCancel?: () => void
}

function horaAgora() {
  const d = new Date()
  return format(d, 'HH:mm')
}

export function LimpezaForm({
  imoveis,
  reservasProximas,
  dataInicial,
  onSuccess,
  onCancel,
}: LimpezaFormProps) {
  const [pending, startTransition] = useTransition()
  const [imovelId, setImovelId] = useState(imoveis[0]?.id ?? '')
  const [data, setData] = useState(dataInicial)
  const [hora, setHora] = useState(horaAgora())
  const [responsavel, setResponsavel] = useState('')
  const [reservaId, setReservaId] = useState<string>(SEM_RESERVA)
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState<string | undefined>()
  const [aviso, setAviso] = useState<string | undefined>()

  const imovelOptions = useMemo(
    () =>
      imoveis.map((i) => ({
        value: i.id,
        label: i.nome_interno,
        description: i.bairro,
      })),
    [imoveis],
  )

  const reservaOptions = useMemo(() => {
    const filtradas = imovelId
      ? reservasProximas.filter((r) => r.imovel_id === imovelId)
      : []
    return [
      { value: SEM_RESERVA, label: 'Sem reserva vinculada' },
      ...filtradas.map((r) => ({
        value: r.id,
        label: `${r.nome_hospede ?? 'Hóspede'} — ${formatDate(r.data_checkin)} → ${formatDate(r.data_checkout)}`,
      })),
    ]
  }, [reservasProximas, imovelId])

  const submit = (continuar = false) => {
    setErro(undefined)
    setAviso(undefined)

    if (!imovelId) {
      setErro('Selecione um imóvel')
      return
    }
    if (!data || !hora) {
      setErro('Defina data e hora')
      return
    }

    const iso = new Date(`${data}T${hora}:00`).toISOString()

    startTransition(async () => {
      const res = await createLimpeza({
        imovel_id: imovelId,
        data_agendada: iso,
        responsavel: responsavel.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        reserva_id: reservaId === SEM_RESERVA ? undefined : reservaId,
      })
      if (res.error) {
        setErro(res.error)
        toast.error(res.error)
        return
      }
      if (res.data?.aviso && !continuar) {
        setAviso(res.data.aviso)
        return
      }
      toast.success('Limpeza criada')
      onSuccess?.()
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(false)
      }}
    >
      <DialogHeader>
        <DialogTitle>Nova limpeza</DialogTitle>
      </DialogHeader>

      <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
        <Field label="Imóvel" required>
          {({ id, invalid, describedBy }) => (
            <SearchableSelect
              id={id}
              invalid={invalid}
              aria-describedby={describedBy}
              options={imovelOptions}
              value={imovelId}
              onChange={(v) => {
                setImovelId(v)
                setReservaId(SEM_RESERVA)
              }}
              placeholder="Selecione um imóvel"
              emptyMessage="Nenhum imóvel encontrado"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data" required>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            )}
          </Field>
          <Field label="Hora" required>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="Responsável">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome da equipe ou pessoa"
            />
          )}
        </Field>

        <Field
          label="Reserva vinculada"
          hint={
            imovelId
              ? 'Próximas reservas do imóvel selecionado'
              : 'Escolha um imóvel para listar reservas'
          }
        >
          {({ id, describedBy }) => (
            <SearchableSelect
              id={id}
              aria-describedby={describedBy}
              options={reservaOptions}
              value={reservaId}
              onChange={setReservaId}
              placeholder="Sem reserva vinculada"
              disabled={!imovelId}
            />
          )}
        </Field>

        <Field label="Observações">
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas sobre acesso, materiais, atenção especial..."
            />
          )}
        </Field>

        {erro ? (
          <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700">
            {erro}
          </p>
        ) : null}
        {aviso ? (
          <div className="rounded-md border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            <p className="font-medium">Atenção: {aviso}</p>
            <button
              type="button"
              className="mt-1 text-warning-700 underline"
              onClick={() => submit(true)}
            >
              Criar mesmo assim
            </button>
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant={ButtonVariant.Ghost}
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" variant={ButtonVariant.Primary} loading={pending}>
          Criar limpeza
        </Button>
      </DialogFooter>
    </form>
  )
}
