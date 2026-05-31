'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Calendar, Info } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Button, ButtonVariant } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  createReserva,
  getDatasOcupadasImovel,
  updateReserva,
} from '@/lib/actions/reservas'
import { ReservaSchema, type ReservaInput } from '@/lib/validations'
import { formatCurrency } from '@/lib/utils/formatters'
import { Plataforma } from '@/types'

type FormValues = z.input<typeof ReservaSchema>

const PLATAFORMA_OPTIONS: { value: Plataforma; label: string }[] = [
  { value: Plataforma.Airbnb, label: 'Airbnb' },
  { value: Plataforma.Booking, label: 'Booking' },
  { value: Plataforma.Direto, label: 'Direto' },
  { value: Plataforma.Outro, label: 'Outro' },
]

export type ImovelOption = {
  id: string
  nome_interno: string
  bairro: string
  comissao_percentual: number
}

export type ReservaFormProps = {
  modo: 'novo' | 'editar'
  reservaId?: string
  imoveis: ImovelOption[]
  defaultValues?: Partial<ReservaInput>
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReservaForm({
  modo,
  reservaId,
  imoveis,
  defaultValues,
  onSuccess,
  onCancel,
}: ReservaFormProps) {
  const [pending, startTransition] = useTransition()
  const [comissaoPct, setComissaoPct] = useState<number>(
    () => {
      if (defaultValues?.imovel_id) {
        const im = imoveis.find((i) => i.id === defaultValues.imovel_id)
        return im?.comissao_percentual ?? 20
      }
      return 20
    },
  )

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ReservaSchema) as Resolver<FormValues>,
    defaultValues: {
      plataforma: Plataforma.Airbnb,
      num_hospedes: 1,
      taxa_plataforma: 0,
      valor_bruto: 0,
      ...defaultValues,
    },
  })

  const imovelId = watch('imovel_id')
  const valorBruto = watch('valor_bruto')
  const taxaPlataforma = watch('taxa_plataforma')
  const dataCheckin = watch('data_checkin')
  const dataCheckout = watch('data_checkout')

  const [datasOcupadas, setDatasOcupadas] = useState<Date[]>([])
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (defaultValues?.data_checkin && defaultValues?.data_checkout) {
      return {
        from: new Date(`${defaultValues.data_checkin}T12:00:00`),
        to: new Date(`${defaultValues.data_checkout}T12:00:00`),
      }
    }
    return undefined
  })

  useEffect(() => {
    const im = imoveis.find((i) => i.id === imovelId)
    if (im) setComissaoPct(Number(im.comissao_percentual))
  }, [imovelId, imoveis])

  useEffect(() => {
    if (!imovelId) {
      setDatasOcupadas([])
      return
    }
    let ativo = true
    void getDatasOcupadasImovel(imovelId, reservaId).then((res) => {
      if (!ativo) return
      const datas = (res.data?.datas ?? []).map(
        (d) => new Date(`${d}T12:00:00`),
      )
      setDatasOcupadas(datas)
    })
    return () => {
      ativo = false
    }
  }, [imovelId, reservaId])

  const handleRangeSelect = (next: DateRange | undefined) => {
    setRange(next)
    setValue('data_checkin', next?.from ? format(next.from, 'yyyy-MM-dd') : '', {
      shouldValidate: true,
    })
    setValue('data_checkout', next?.to ? format(next.to, 'yyyy-MM-dd') : '', {
      shouldValidate: true,
    })
  }

  const imovelOptions = useMemo(
    () =>
      imoveis.map((i) => ({
        value: i.id,
        label: i.nome_interno,
        description: i.bairro,
      })),
    [imoveis],
  )

  const noites = useMemo(() => {
    if (!dataCheckin || !dataCheckout) return 0
    try {
      const n = differenceInCalendarDays(
        parseISO(dataCheckout),
        parseISO(dataCheckin),
      )
      return n > 0 ? n : 0
    } catch {
      return 0
    }
  }, [dataCheckin, dataCheckout])

  const previewLiquido = useMemo(() => {
    const bruto = Number(valorBruto ?? 0)
    const taxa = Number(taxaPlataforma ?? 0)
    if (bruto <= 0) return 0
    const baseLiquida = bruto - taxa
    return baseLiquida * (1 - comissaoPct / 100)
  }, [valorBruto, taxaPlataforma, comissaoPct])

  const onSubmit = handleSubmit((values) => {
    const parsed = ReservaSchema.parse(values) as ReservaInput
    startTransition(async () => {
      const res =
        modo === 'novo'
          ? await createReserva(parsed)
          : await updateReserva(reservaId!, parsed)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(modo === 'novo' ? 'Reserva criada' : 'Reserva atualizada')
      onSuccess?.()
    })
  })

  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>
          {modo === 'novo' ? 'Nova reserva' : 'Editar reserva'}
        </DialogTitle>
      </DialogHeader>

      <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
        <Field
          label="Imóvel"
          required
          error={errors.imovel_id?.message}
        >
          {({ id, invalid, describedBy }) => (
            <Controller
              control={control}
              name="imovel_id"
              render={({ field }) => (
                <SearchableSelect
                  id={id}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  options={imovelOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione um imóvel"
                  emptyMessage="Nenhum imóvel encontrado"
                />
              )}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Plataforma"
            required
            error={errors.plataforma?.message}
          >
            {({ id, describedBy }) => (
              <Controller
                control={control}
                name="plataforma"
                render={({ field }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    value={field.value ?? Plataforma.Airbnb}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
                  >
                    {PLATAFORMA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            )}
          </Field>
          <Field
            label="ID externo"
            error={errors.id_externo?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Ex: HM2X3Y (opcional)"
                {...register('id_externo')}
              />
            )}
          </Field>
        </div>

        <Field
          label="Período da estadia"
          required
          error={errors.data_checkin?.message ?? errors.data_checkout?.message}
        >
          {() => (
            <div className="rounded-md border border-line-strong bg-white p-2">
              {!imovelId ? (
                <p className="px-2 py-3 text-sm text-ink-muted">
                  Selecione um imóvel para escolher as datas.
                </p>
              ) : (
                <DayPicker
                  mode="range"
                  locale={ptBR}
                  selected={range}
                  onSelect={handleRangeSelect}
                  disabled={[{ before: new Date() }, ...datasOcupadas]}
                  modifiers={{ ocupada: datasOcupadas }}
                  modifiersStyles={{
                    ocupada: {
                      backgroundColor: '#D6DFEA',
                      color: '#1F3A57',
                      textDecoration: 'line-through',
                    },
                  }}
                  styles={{ day: { borderRadius: 8 } }}
                />
              )}
              <input type="hidden" {...register('data_checkin')} />
              <input type="hidden" {...register('data_checkout')} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-2 pt-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: '#D6DFEA' }}
                  />
                  Ocupado (indisponível)
                </span>
                {range?.from && range?.to ? (
                  <span className="font-medium text-navy-800">
                    {format(range.from, 'dd/MM/yyyy')} →{' '}
                    {format(range.to, 'dd/MM/yyyy')}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </Field>

        {noites > 0 ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Calendar className="h-3.5 w-3.5" />
            {noites} noite{noites === 1 ? '' : 's'}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Hóspedes"
            required
            error={errors.num_hospedes?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={20}
                invalid={invalid}
                aria-describedby={describedBy}
                {...register('num_hospedes', { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field
            label="Valor bruto"
            required
            error={errors.valor_bruto?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="valor_bruto"
                render={({ field }) => (
                  <CurrencyInput
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    value={Number(field.value ?? 0)}
                    onValueChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
          <Field
            label="Taxa plataforma"
            error={errors.taxa_plataforma?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="taxa_plataforma"
                render={({ field }) => (
                  <CurrencyInput
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    value={Number(field.value ?? 0)}
                    onValueChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
        </div>

        <div className="rounded-md border border-line bg-sand-50 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-navy-700">
            <Info className="h-3.5 w-3.5 text-gold-600" />
            Preview do cálculo
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-ink-muted">
            <dt>Comissão da gestora ({comissaoPct.toFixed(0)}%)</dt>
            <dd className="text-right text-ink">
              {formatCurrency(
                Math.max(
                  0,
                  (Number(valorBruto ?? 0) - Number(taxaPlataforma ?? 0)) *
                    (comissaoPct / 100),
                ),
              )}
            </dd>
            <dt className="font-semibold text-navy-700">
              Valor líquido ao proprietário
            </dt>
            <dd className="text-right font-semibold text-navy-800">
              {formatCurrency(previewLiquido)}
            </dd>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome do hóspede"
            error={errors.nome_hospede?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Nome completo"
                {...register('nome_hospede')}
              />
            )}
          </Field>
          <Field
            label="E-mail do hóspede"
            error={errors.email_hospede?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                type="email"
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="email@exemplo.com"
                {...register('email_hospede')}
              />
            )}
          </Field>
        </div>

        <Field
          label="Telefone do hóspede"
          error={errors.telefone_hospede?.message}
        >
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              invalid={invalid}
              aria-describedby={describedBy}
              placeholder="(84) 99999-9999"
              {...register('telefone_hospede')}
            />
          )}
        </Field>

        <Field
          label="Observações internas"
          error={errors.observacoes_internas?.message}
        >
          {({ id, invalid, describedBy }) => (
            <Textarea
              id={id}
              invalid={invalid}
              aria-describedby={describedBy}
              rows={3}
              placeholder="Notas internas (opcional)"
              {...register('observacoes_internas')}
            />
          )}
        </Field>
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
        <Button
          type="submit"
          variant={ButtonVariant.Primary}
          loading={pending}
        >
          {modo === 'novo' ? 'Criar reserva' : 'Salvar alterações'}
        </Button>
      </DialogFooter>
    </form>
  )
}

