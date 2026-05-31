'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  createProprietario,
  updateProprietario,
} from '@/lib/actions/proprietarios'
import {
  ProprietarioSchema,
  type ProprietarioInput,
} from '@/lib/validations'
import { StatusContrato } from '@/types'

type FormValues = z.input<typeof ProprietarioSchema>

const STATUS_OPTIONS: { value: StatusContrato; label: string }[] = [
  { value: StatusContrato.Ativo, label: 'Ativo' },
  { value: StatusContrato.EmNegociacao, label: 'Em negociação' },
  { value: StatusContrato.Inativo, label: 'Inativo' },
  { value: StatusContrato.Encerrado, label: 'Encerrado' },
]

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export type ProprietarioFormProps = {
  modo: 'novo' | 'editar'
  proprietarioId?: string
  defaultValues?: Partial<ProprietarioInput>
}

export function ProprietarioForm({
  modo,
  proprietarioId,
  defaultValues,
}: ProprietarioFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ProprietarioSchema) as Resolver<FormValues>,
    defaultValues: {
      status_contrato: StatusContrato.Ativo,
      ...defaultValues,
    },
  })

  const onSubmit = handleSubmit((values) => {
    const parsed = ProprietarioSchema.parse(values) as ProprietarioInput
    startTransition(async () => {
      const res =
        modo === 'novo'
          ? await createProprietario(parsed)
          : await updateProprietario(proprietarioId!, parsed)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(
        modo === 'novo' ? 'Proprietário cadastrado' : 'Proprietário atualizado',
      )
      if (modo === 'novo' && res.data?.id) {
        router.push(`/proprietarios/${res.data.id}`)
      } else if (proprietarioId) {
        router.push(`/proprietarios/${proprietarioId}`)
        router.refresh()
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div className="rounded-lg border border-line bg-white p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nome completo"
            required
            error={errors.nome?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Nome do proprietário"
                {...register('nome')}
              />
            )}
          </Field>

          <Field
            label="CPF ou CNPJ"
            required
            error={errors.cpf_cnpj?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    placeholder="000.000.000-00"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(maskCpfCnpj(e.target.value))
                    }
                    onBlur={field.onBlur}
                  />
                )}
              />
            )}
          </Field>

          <Field
            label="E-mail"
            required
            hint="Será usado para envio do magic link de acesso ao portal."
            error={errors.email?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                type="email"
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="email@exemplo.com"
                {...register('email')}
              />
            )}
          </Field>

          <Field label="Telefone" error={errors.telefone?.message}>
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="telefone"
                render={({ field }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    placeholder="(84) 99999-9999"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(maskTelefone(e.target.value))
                    }
                    onBlur={field.onBlur}
                  />
                )}
              />
            )}
          </Field>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 md:grid-cols-[1fr_140px_200px]">
          <Field
            label="Cidade"
            error={errors.cidade_residencia?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Cidade de residência"
                {...register('cidade_residencia')}
              />
            )}
          </Field>

          <Field label="UF" error={errors.estado_residencia?.message}>
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="estado_residencia"
                render={({ field }) => (
                  <select
                    id={id}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
                  >
                    <option value="">—</option>
                    {UF_LIST.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                )}
              />
            )}
          </Field>

          <Field
            label="Status do contrato"
            required
            error={errors.status_contrato?.message}
          >
            {({ id, describedBy }) => (
              <Controller
                control={control}
                name="status_contrato"
                render={({ field }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    value={field.value ?? StatusContrato.Ativo}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            )}
          </Field>
        </div>

        <Separator className="my-6" />

        <Field label="Observações" error={errors.observacoes?.message}>
          {({ id, invalid, describedBy }) => (
            <Textarea
              id={id}
              invalid={invalid}
              aria-describedby={describedBy}
              rows={4}
              placeholder="Notas internas sobre o proprietário (opcional)"
              {...register('observacoes')}
            />
          )}
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-2">
          <Button
            type="button"
            variant={ButtonVariant.Ghost}
            onClick={() =>
              router.push(
                modo === 'editar' && proprietarioId
                  ? `/proprietarios/${proprietarioId}`
                  : '/proprietarios',
              )
            }
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Md}
            loading={pending}
          >
            {modo === 'novo' ? 'Cadastrar proprietário' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </form>
  )
}
