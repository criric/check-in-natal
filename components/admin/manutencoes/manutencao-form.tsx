'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonVariant } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import { createManutencao } from '@/lib/actions/manutencoes'
import { cn } from '@/lib/utils/cn'
import { UrgenciaManutencao } from '@/types'
import type { ImovelOpt } from './manutencoes-client'

const TIPOS: Array<{ value: string; label: string }> = [
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'estrutural', label: 'Estrutural' },
  { value: 'moveis', label: 'Móveis' },
  { value: 'eletrodomesticos', label: 'Eletrodomésticos' },
  { value: 'outro', label: 'Outro' },
]

const URGENCIAS: Array<{ value: UrgenciaManutencao; label: string; tone: string }> = [
  {
    value: UrgenciaManutencao.Baixa,
    label: 'Baixa',
    tone: 'border-line-strong text-ink-muted',
  },
  {
    value: UrgenciaManutencao.Media,
    label: 'Média',
    tone: 'border-warning-200 text-warning-700',
  },
  {
    value: UrgenciaManutencao.Urgente,
    label: 'Urgente',
    tone: 'border-danger-200 text-danger-700',
  },
]

const LIMITE_APROVACAO = 200

export type ManutencaoFormProps = {
  imoveis: ImovelOpt[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function ManutencaoForm({
  imoveis,
  onSuccess,
  onCancel,
}: ManutencaoFormProps) {
  const [pending, startTransition] = useTransition()
  const [imovelId, setImovelId] = useState(imoveis[0]?.id ?? '')
  const [tipo, setTipo] = useState<string>('outro')
  const [descricao, setDescricao] = useState('')
  const [urgencia, setUrgencia] = useState<UrgenciaManutencao>(
    UrgenciaManutencao.Media,
  )
  const [prestadorNome, setPrestadorNome] = useState('')
  const [prestadorContato, setPrestadorContato] = useState('')
  const [custoEstimado, setCustoEstimado] = useState(0)
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState<string | undefined>()

  const exigeAprovacao = custoEstimado >= LIMITE_APROVACAO
  const imovelOptions = useMemo(
    () =>
      imoveis.map((i) => ({
        value: i.id,
        label: i.nome_interno,
        description: i.bairro,
      })),
    [imoveis],
  )

  const submit = () => {
    setErro(undefined)
    if (!imovelId) {
      setErro('Selecione um imóvel')
      return
    }
    if (descricao.trim().length < 5) {
      setErro('Descreva o problema com pelo menos 5 caracteres')
      return
    }

    startTransition(async () => {
      const res = await createManutencao({
        imovel_id: imovelId,
        tipo: tipo || undefined,
        descricao: descricao.trim(),
        urgencia,
        prestador_nome: prestadorNome.trim() || undefined,
        prestador_contato: prestadorContato.trim() || undefined,
        custo_estimado: custoEstimado > 0 ? custoEstimado : undefined,
        observacoes: observacoes.trim() || undefined,
      })
      if (res.error) {
        setErro(res.error)
        toast.error(res.error)
        return
      }
      toast.success(
        exigeAprovacao
          ? 'Manutenção criada e enviada para aprovação'
          : 'Manutenção criada',
      )
      onSuccess?.()
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <DialogHeader>
        <DialogTitle>Nova manutenção</DialogTitle>
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
              onChange={setImovelId}
              placeholder="Selecione um imóvel"
              emptyMessage="Nenhum imóvel"
            />
          )}
        </Field>

        <Field label="Tipo">
          {({ id, describedBy }) => (
            <SearchableSelect
              id={id}
              aria-describedby={describedBy}
              options={TIPOS}
              value={tipo}
              onChange={setTipo}
              placeholder="Selecione um tipo"
            />
          )}
        </Field>

        <Field
          label="Descrição"
          required
          hint="Descreva claramente o problema observado"
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: vazamento na pia da cozinha, água acumulando no chão"
            />
          )}
        </Field>

        <Field label="Urgência" required>
          {() => (
            <div className="flex flex-wrap gap-2">
              {URGENCIAS.map((u) => {
                const ativo = urgencia === u.value
                return (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgencia(u.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      ativo
                        ? 'border-navy-700 bg-navy-700 text-white'
                        : `bg-white ${u.tone} hover:bg-sand-50`,
                    )}
                    aria-pressed={ativo}
                  >
                    {u.label}
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prestador (nome)">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={prestadorNome}
                onChange={(e) => setPrestadorNome(e.target.value)}
                placeholder="Nome do profissional"
              />
            )}
          </Field>
          <Field label="Prestador (contato)">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={prestadorContato}
                onChange={(e) => setPrestadorContato(e.target.value)}
                placeholder="(84) 99999-9999"
              />
            )}
          </Field>
        </div>

        <Field
          label="Custo estimado"
          hint={`Acima de R$ ${LIMITE_APROVACAO},00 exige aprovação do proprietário`}
        >
          {({ id, describedBy }) => (
            <CurrencyInput
              id={id}
              aria-describedby={describedBy}
              value={custoEstimado}
              onValueChange={setCustoEstimado}
            />
          )}
        </Field>

        {exigeAprovacao ? (
          <div className="flex items-start gap-2 rounded-md border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Esta manutenção será enviada para aprovação do proprietário antes
              de ser executada.
            </p>
          </div>
        ) : null}

        <Field label="Observações internas">
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas internas (não vão para o proprietário)"
            />
          )}
        </Field>

        {erro ? (
          <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700">
            {erro}
          </p>
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
          Criar manutenção
        </Button>
      </DialogFooter>
    </form>
  )
}
