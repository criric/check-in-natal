'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { UploadFotos, type FotoExistente } from '@/components/ui/upload-fotos'
import { cn } from '@/lib/utils/cn'
import {
  createImovel,
  deleteFotoImovel,
  reordenarFotos,
  updateImovel,
  uploadFotoImovel,
} from '@/lib/actions/imoveis'
import { ImovelSchema, type ImovelInput } from '@/lib/validations'
import { Plataforma, StatusImovel, TipoImovel } from '@/types'

type ImovelFormValues = z.input<typeof ImovelSchema>

const TIPO_OPTIONS: { value: TipoImovel; label: string }[] = [
  { value: TipoImovel.Apartamento, label: 'Apartamento' },
  { value: TipoImovel.Casa, label: 'Casa' },
  { value: TipoImovel.Quarto, label: 'Quarto' },
  { value: TipoImovel.Studio, label: 'Studio' },
  { value: TipoImovel.Cobertura, label: 'Cobertura' },
]

const STATUS_OPTIONS: { value: StatusImovel; label: string }[] = [
  { value: StatusImovel.Ativo, label: 'Ativo' },
  { value: StatusImovel.Inativo, label: 'Inativo' },
  { value: StatusImovel.Manutencao, label: 'Em manutenção' },
  { value: StatusImovel.Onboarding, label: 'Onboarding' },
]

const PLATAFORMA_OPTIONS: { value: Plataforma; label: string }[] = [
  { value: Plataforma.Airbnb, label: 'Airbnb' },
  { value: Plataforma.Booking, label: 'Booking' },
  { value: Plataforma.Direto, label: 'Direto' },
  { value: Plataforma.Outro, label: 'Outro' },
]

export type ProprietarioOption = {
  id: string
  nome: string
  email: string
}

export type ImovelFormProps = {
  modo: 'novo' | 'editar'
  imovelId?: string
  defaultValues?: Partial<ImovelInput>
  proprietarios: ProprietarioOption[]
  fotosExistentes?: FotoExistente[]
}

function Section({
  numero,
  titulo,
  descricao,
  children,
}: {
  numero: string
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-4 py-6 md:grid-cols-[260px_1fr] md:gap-8">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-gold-700">
          {numero}
        </p>
        <h2 className="font-display text-lg text-navy-700">{titulo}</h2>
        {descricao ? (
          <p className="mt-1 text-xs text-ink-muted">{descricao}</p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

export function ImovelForm({
  modo,
  imovelId,
  defaultValues,
  proprietarios,
  fotosExistentes = [],
}: ImovelFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showSenha, setShowSenha] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fotos, setFotos] = useState<FotoExistente[]>(fotosExistentes)
  const [cepLoading, setCepLoading] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImovelFormValues>({
    resolver: zodResolver(ImovelSchema) as Resolver<ImovelFormValues>,
    defaultValues: {
      status: StatusImovel.Ativo,
      comissao_percentual: 20,
      capacidade_hospedes: 2,
      plataformas: [],
      ...defaultValues,
    },
  })

  const proprietarioOptions = proprietarios.map((p) => ({
    value: p.id,
    label: p.nome,
    description: p.email,
  }))

  const onCepBlur = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      const endereco = [data.logradouro, data.bairro, data.localidade, data.uf]
        .filter(Boolean)
        .join(', ')
      if (endereco && !watch('endereco_completo')) {
        setValue('endereco_completo', endereco, { shouldValidate: true })
      }
      if (data.bairro && !watch('bairro')) {
        setValue('bairro', data.bairro, { shouldValidate: true })
      }
    } catch {
      // silent
    } finally {
      setCepLoading(false)
    }
  }

  const handleUpload = async (files: File[]) => {
    if (!imovelId) {
      toast.error('Salve o imóvel antes de adicionar fotos')
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const res = await uploadFotoImovel(imovelId, file)
        if (res.data) {
          setFotos((prev) => [...prev, { id: res.data!.id, url: res.data!.url }])
        } else if (res.error) {
          toast.error(`Erro: ${res.error}`)
        }
      }
      toast.success('Fotos enviadas')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFoto = async (id: string) => {
    const res = await deleteFotoImovel(id)
    if (res.data) {
      setFotos((prev) => prev.filter((f) => f.id !== id))
      toast.success('Foto removida')
    } else {
      toast.error(`Erro: ${res.error}`)
    }
  }

  const handleReorderFotos = async (ordemIds: string[]) => {
    if (!imovelId) return
    const anterior = fotos
    // atualização otimista
    setFotos(
      ordemIds
        .map((id) => anterior.find((f) => f.id === id))
        .filter((f): f is FotoExistente => Boolean(f)),
    )
    const res = await reordenarFotos(imovelId, ordemIds)
    if (res.error) {
      setFotos(anterior)
      toast.error(`Erro ao reordenar: ${res.error}`)
    }
  }

  const onSubmit = handleSubmit((values) => {
    const parsed = ImovelSchema.parse(values) as ImovelInput
    startTransition(async () => {
      const res =
        modo === 'novo'
          ? await createImovel(parsed)
          : await updateImovel(imovelId!, parsed)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(modo === 'novo' ? 'Imóvel criado' : 'Imóvel atualizado')
        if (modo === 'novo' && res.data?.id) {
          router.push(`/imoveis/${res.data.id}/editar`)
        } else {
          router.refresh()
        }
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div className="rounded-lg border border-line bg-white px-4 md:px-8 divide-y divide-line">
        <Section
          numero="01"
          titulo="Identificação"
          descricao="Como o imóvel é identificado internamente e quem é o proprietário."
        >
          <Field
            label="Nome interno"
            required
            error={errors.nome_interno?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Ex: Apto 304 — Beira-mar"
                {...register('nome_interno')}
              />
            )}
          </Field>

          <Field
            label="Proprietário"
            required
            error={errors.proprietario_id?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="proprietario_id"
                render={({ field }) => (
                  <SearchableSelect
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    options={proprietarioOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione um proprietário"
                    emptyMessage="Nenhum proprietário encontrado"
                  />
                )}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" required error={errors.tipo?.message}>
              {({ id, invalid, describedBy }) => (
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field }) => (
                    <select
                      id={id}
                      aria-invalid={invalid || undefined}
                      aria-describedby={describedBy}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
                    >
                      <option value="">Selecione...</option>
                      {TIPO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
            </Field>

            <Field label="Status" required error={errors.status?.message}>
              {({ id, describedBy }) => (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <select
                      id={id}
                      aria-describedby={describedBy}
                      value={field.value ?? StatusImovel.Ativo}
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

          <Field
            label="Comissão (%)"
            required
            error={errors.comissao_percentual?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={100}
                step={0.5}
                invalid={invalid}
                aria-describedby={describedBy}
                {...register('comissao_percentual', { valueAsNumber: true })}
              />
            )}
          </Field>

          <Field label="Plataformas" error={errors.plataformas?.message}>
            <Controller
              control={control}
              name="plataformas"
              render={({ field }) => {
                const current = field.value ?? []
                return (
                  <div className="flex flex-wrap gap-3">
                    {PLATAFORMA_OPTIONS.map((opt) => {
                      const checked = current.includes(opt.value)
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-sm transition-colors',
                            checked
                              ? 'border-gold-400 bg-gold-50 text-navy-800'
                              : 'text-ink-muted hover:bg-sand-50',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const next = c
                                ? [...current, opt.value]
                                : current.filter((v) => v !== opt.value)
                              field.onChange(next)
                            }}
                          />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )
              }}
            />
          </Field>
        </Section>

        <Section
          numero="02"
          titulo="Endereço"
          descricao="Preencha o CEP para autopreencher endereço."
        >
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Field label="CEP" error={errors.cep?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder="59000-000"
                  disabled={cepLoading}
                  {...register('cep', {
                    onBlur: (e) => onCepBlur(e.target.value),
                  })}
                />
              )}
            </Field>
            <Field label="Bairro" required error={errors.bairro?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder="Ex: Ponta Negra"
                  {...register('bairro')}
                />
              )}
            </Field>
          </div>

          <Field
            label="Endereço completo"
            required
            error={errors.endereco_completo?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Textarea
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                rows={2}
                placeholder="Rua, número, complemento, cidade, UF"
                {...register('endereco_completo')}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude" error={errors.latitude?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  step="any"
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder="-5.7945"
                  {...register('latitude', {
                    setValueAs: (v) =>
                      v === '' || v == null ? undefined : Number(v),
                  })}
                />
              )}
            </Field>
            <Field label="Longitude" error={errors.longitude?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  step="any"
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder="-35.2110"
                  {...register('longitude', {
                    setValueAs: (v) =>
                      v === '' || v == null ? undefined : Number(v),
                  })}
                />
              )}
            </Field>
          </div>
        </Section>

        <Section numero="03" titulo="Capacidade">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Hóspedes"
              required
              error={errors.capacidade_hospedes?.message}
            >
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={20}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('capacidade_hospedes', { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field label="Quartos" error={errors.numero_quartos?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('numero_quartos', {
                    setValueAs: (v) =>
                      v === '' || v == null ? undefined : Number(v),
                  })}
                />
              )}
            </Field>
            <Field label="Banheiros" error={errors.numero_banheiros?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('numero_banheiros', {
                    setValueAs: (v) =>
                      v === '' || v == null ? undefined : Number(v),
                  })}
                />
              )}
            </Field>
            <Field label="Andar" error={errors.andar?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  type="number"
                  invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('andar', {
                    setValueAs: (v) =>
                      v === '' || v == null ? undefined : Number(v),
                  })}
                />
              )}
            </Field>
          </div>
          <Field label="Condomínio" error={errors.nome_condominio?.message}>
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Nome do condomínio (opcional)"
                {...register('nome_condominio')}
              />
            )}
          </Field>
        </Section>

        <Section
          numero="04"
          titulo="Acesso"
          descricao="Informações sensíveis. Apenas o admin visualiza."
        >
          <Field
            label="Instruções de check-in"
            error={errors.instrucoes_checkin?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Textarea
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                rows={3}
                placeholder="Como o hóspede acessa o imóvel"
                {...register('instrucoes_checkin')}
              />
            )}
          </Field>
          <Field
            label="Código de acesso"
            error={errors.codigo_acesso?.message}
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Ex: 8412"
                {...register('codigo_acesso')}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Wi-Fi (nome)" error={errors.wifi_nome?.message}>
              {({ id, invalid, describedBy }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('wifi_nome')}
                />
              )}
            </Field>
            <Field label="Wi-Fi (senha)" error={errors.wifi_senha?.message}>
              {({ id, invalid, describedBy }) => (
                <div className="relative">
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    type={showSenha ? 'text' : 'password'}
                    className="pr-10"
                    {...register('wifi_senha')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((s) => !s)}
                    aria-label={
                      showSenha ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-navy-700"
                  >
                    {showSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </Field>
          </div>
        </Section>

        <Section
          numero="05"
          titulo="Fotos"
          descricao="Até 20 fotos, 5MB cada. A primeira foto é a capa."
        >
          {modo === 'novo' ? (
            <p className="rounded-md border border-line bg-sand-50 px-3 py-2 text-xs text-ink-muted">
              Salve o imóvel antes para habilitar o upload de fotos.
            </p>
          ) : (
            <UploadFotos
              maxFiles={20}
              maxSizeMB={5}
              uploading={uploading}
              fotosExistentes={fotos}
              onUpload={handleUpload}
              onRemoveExistente={handleRemoveFoto}
              onReorder={handleReorderFotos}
            />
          )}
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-2">
          <Button
            type="button"
            variant={ButtonVariant.Ghost}
            onClick={() => router.push('/imoveis')}
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
            {modo === 'novo' ? 'Criar imóvel' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </form>
  )
}
