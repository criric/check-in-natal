'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { AlertCircle, FileText, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonVariant } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { calcularRepassePreview, gerarRepasse } from '@/lib/actions/repasses'
import { getManutencoes } from '@/lib/actions/manutencoes'
import { formatCurrency, formatDate, formatMesAno } from '@/lib/utils/formatters'
import {
  Plataforma,
  StatusManutencao,
  type PreviewRepasse,
} from '@/types'
import type { ImovelOpt } from './repasses-client'

const MESES: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

type ManutencaoLite = {
  id: string
  custo_real?: number | string | null
  data_resolucao?: string | null
  status: StatusManutencao
}

export type GerarRepasseModalProps = {
  imoveis: ImovelOpt[]
  mesInicial: number
  anoInicial: number
  onCancel: () => void
  onSuccess: () => void
}

export function GerarRepasseModal({
  imoveis,
  mesInicial,
  anoInicial,
  onCancel,
  onSuccess,
}: GerarRepasseModalProps) {
  const [pending, startTransition] = useTransition()
  const [imovelId, setImovelId] = useState(imoveis[0]?.id ?? '')
  const [mes, setMes] = useState<number>(mesInicial)
  const [ano, setAno] = useState<number>(anoInicial)
  const [preview, setPreview] = useState<PreviewRepasse | undefined>()
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [erroPreview, setErroPreview] = useState<string | undefined>()
  const [deducoesManutencao, setDeducoesManutencao] = useState(0)
  const [deducoesOutros, setDeducoesOutros] = useState(0)
  const [observacoes, setObservacoes] = useState('')
  const [erroSubmit, setErroSubmit] = useState<string | undefined>()

  const anos = useMemo(() => {
    const atual = new Date().getFullYear()
    return [atual - 1, atual, atual + 1]
  }, [])

  const imovelOptions = useMemo(
    () =>
      imoveis.map((i) => ({
        value: i.id,
        label: i.nome_interno,
        description: `${i.bairro} · ${i.proprietario_nome}`,
      })),
    [imoveis],
  )

  const imovelSelecionado = useMemo(
    () => imoveis.find((i) => i.id === imovelId),
    [imoveis, imovelId],
  )

  // Carrega preview + soma deduções de manutenções resolvidas no período
  useEffect(() => {
    if (!imovelId) {
      setPreview(undefined)
      return
    }

    let cancelled = false
    setLoadingPreview(true)
    setErroPreview(undefined)

    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

    Promise.all([
      calcularRepassePreview(imovelId, mes, ano),
      getManutencoes({ imovel_id: imovelId }),
    ])
      .then(([previewRes, manutsRes]) => {
        if (cancelled) return
        if (previewRes.error || !previewRes.data) {
          setErroPreview(previewRes.error ?? 'Erro ao calcular preview')
          setPreview(undefined)
        } else {
          setPreview(previewRes.data)
        }

        // Pré-preenche deduções com manutenções resolvidas no período
        const manuts = ((manutsRes.data ?? []) as ManutencaoLite[]).filter(
          (m) =>
            m.status === StatusManutencao.Resolvida &&
            m.data_resolucao &&
            m.data_resolucao.slice(0, 10) >= inicio &&
            m.data_resolucao.slice(0, 10) <= fim,
        )
        const somaManut = manuts.reduce(
          (sum, m) => sum + (m.custo_real != null ? Number(m.custo_real) : 0),
          0,
        )
        setDeducoesManutencao(Number(somaManut.toFixed(2)))
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false)
      })

    return () => {
      cancelled = true
    }
  }, [imovelId, mes, ano])

  const valorFinal = useMemo(() => {
    if (!preview) return 0
    return Number(
      (
        preview.valor_liquido_total - deducoesManutencao - deducoesOutros
      ).toFixed(2),
    )
  }, [preview, deducoesManutencao, deducoesOutros])

  const submit = () => {
    setErroSubmit(undefined)
    if (!imovelId) {
      setErroSubmit('Selecione um imóvel')
      return
    }
    if (!preview || preview.num_reservas === 0) {
      setErroSubmit(
        'Não há reservas elegíveis para gerar repasse nesta competência',
      )
      return
    }

    startTransition(async () => {
      const res = await gerarRepasse({
        imovel_id: imovelId,
        competencia_mes: mes,
        competencia_ano: ano,
        deducoes_manutencao: deducoesManutencao,
        deducoes_outros: deducoesOutros,
        observacoes: observacoes.trim() || undefined,
      })
      if (res.error) {
        setErroSubmit(res.error)
        toast.error(res.error)
        return
      }
      toast.success('Repasse gerado e PDF disponível')
      onSuccess()
    })
  }

  const semReservas = preview && preview.num_reservas === 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <DialogHeader>
        <DialogTitle>Gerar repasse</DialogTitle>
        <DialogDescription>
          Calcula o valor a repassar com base nas reservas com checkout no mês
          selecionado e emite o PDF para o proprietário.
        </DialogDescription>
      </DialogHeader>

      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
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
                emptyMessage="Nenhum imóvel ativo"
              />
            )}
          </Field>
          <Field label="Mês" required>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ano" required>
            {({ id, describedBy }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        {imovelSelecionado ? (
          <div className="flex items-center gap-2 rounded-md border border-line bg-sand-50 px-3 py-2 text-xs text-ink-muted">
            <Info className="h-3.5 w-3.5 shrink-0 text-navy-600" aria-hidden />
            <p>
              Proprietário:{' '}
              <span className="font-medium text-navy-800">
                {imovelSelecionado.proprietario_nome}
              </span>{' '}
              · Comissão padrão:{' '}
              <span className="font-medium text-navy-800">
                {imovelSelecionado.comissao_percentual.toFixed(0)}%
              </span>
            </p>
          </div>
        ) : null}

        <Separator />

        {loadingPreview ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-6 text-sm text-ink-muted"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Calculando preview…
          </div>
        ) : erroPreview ? (
          <div className="flex items-start gap-2 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{erroPreview}</span>
          </div>
        ) : semReservas ? (
          <div className="flex items-start gap-2 rounded-md border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Nenhuma reserva com checkout em {formatMesAno(mes, ano)} para este
              imóvel.
            </span>
          </div>
        ) : preview ? (
          <>
            <div>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Reservas incluídas ({preview.num_reservas})
              </p>
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-sand-50 text-ink-subtle">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Check-in
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Check-out
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Noites
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Plataforma
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Bruto
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Taxa
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {preview.reservas.map((r) => {
                      const noites =
                        r.noites ||
                        differenceInCalendarDays(
                          parseISO(r.data_checkout),
                          parseISO(r.data_checkin),
                        )
                      return (
                        <tr key={r.id}>
                          <td className="px-2 py-1.5">
                            {formatDate(r.data_checkin)}
                          </td>
                          <td className="px-2 py-1.5">
                            {formatDate(r.data_checkout)}
                          </td>
                          <td className="px-2 py-1.5 text-right">{noites}</td>
                          <td className="px-2 py-1.5">
                            <PlataformaBadge
                              plataforma={(r.plataforma as Plataforma) ?? Plataforma.Outro}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {formatCurrency(r.valor_bruto)}
                          </td>
                          <td className="px-2 py-1.5 text-right text-ink-muted">
                            {r.taxa_plataforma > 0
                              ? `−${formatCurrency(r.taxa_plataforma)}`
                              : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right font-medium text-navy-800">
                            {formatCurrency(r.valor_liquido)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Deduções de manutenção"
                hint="Soma das manutenções resolvidas no período (editável)"
              >
                {({ id, describedBy }) => (
                  <CurrencyInput
                    id={id}
                    aria-describedby={describedBy}
                    value={deducoesManutencao}
                    onValueChange={setDeducoesManutencao}
                  />
                )}
              </Field>
              <Field label="Outras deduções">
                {({ id, describedBy }) => (
                  <CurrencyInput
                    id={id}
                    aria-describedby={describedBy}
                    value={deducoesOutros}
                    onValueChange={setDeducoesOutros}
                  />
                )}
              </Field>
            </div>

            <Field label="Observações">
              {({ id, describedBy }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Notas para o proprietário (opcional)"
                />
              )}
            </Field>

            <div className="rounded-md border border-line bg-white p-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Receita bruta</dt>
                  <dd className="font-medium text-navy-800">
                    {formatCurrency(preview.receita_bruta)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">
                    Comissão ({preview.comissao_percentual.toFixed(0)}%)
                  </dt>
                  <dd className="text-ink">
                    −{formatCurrency(preview.comissao_valor)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Deduções de manutenção</dt>
                  <dd className="text-ink">
                    {deducoesManutencao > 0
                      ? `−${formatCurrency(deducoesManutencao)}`
                      : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Outras deduções</dt>
                  <dd className="text-ink">
                    {deducoesOutros > 0
                      ? `−${formatCurrency(deducoesOutros)}`
                      : '—'}
                  </dd>
                </div>
              </dl>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase tracking-wider text-gold-700">
                  Valor a repassar
                </span>
                <span className="font-display text-2xl font-semibold text-navy-800">
                  {formatCurrency(valorFinal)}
                </span>
              </div>
            </div>
          </>
        ) : null}

        {erroSubmit ? (
          <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700">
            {erroSubmit}
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
        <Button
          type="submit"
          variant={ButtonVariant.Primary}
          loading={pending}
          leadingIcon={<FileText className="h-4 w-4" />}
          disabled={
            !preview || preview.num_reservas === 0 || loadingPreview || pending
          }
        >
          Confirmar e gerar PDF
        </Button>
      </DialogFooter>
    </form>
  )
}
