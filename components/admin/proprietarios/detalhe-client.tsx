'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Banknote,
  Building2,
  Mail,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Avatar, AvatarSize } from '@/components/ui/avatar'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import {
  ConfirmDialog,
  ConfirmVariant,
} from '@/components/ui/confirm-dialog'
import { Separator } from '@/components/ui/separator'
import { sendMagicLink } from '@/lib/actions/auth'
import {
  deleteProprietario,
  updateProprietario,
} from '@/lib/actions/proprietarios'
import { formatCpfCnpj, formatCurrency } from '@/lib/utils/formatters'
import { StatusContrato, StatusImovel, StatusRepasse } from '@/types'
import { InlineEditField } from './inline-edit-field'

const STATUS_CONTRATO_LABEL: Record<StatusContrato, string> = {
  [StatusContrato.Ativo]: 'Ativo',
  [StatusContrato.EmNegociacao]: 'Em negociação',
  [StatusContrato.Inativo]: 'Inativo',
  [StatusContrato.Encerrado]: 'Encerrado',
}

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

export type ProprietarioImovelResumo = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number
}

export type ProprietarioRepasseResumo = {
  id: string
  competencia_mes: number
  competencia_ano: number
  valor_repassado: number
  status: StatusRepasse
}

export type ProprietarioDetalhe = {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string | null
  cidade_residencia?: string | null
  estado_residencia?: string | null
  status_contrato: StatusContrato
  data_entrada?: string | null
  observacoes?: string | null
  imoveis: ProprietarioImovelResumo[]
  repasses: ProprietarioRepasseResumo[]
  metricas: {
    total_imoveis: number
    imoveis_ativos: number
    total_repassado: number
  }
}

export function ProprietarioDetalheClient({
  proprietario,
}: {
  proprietario: ProprietarioDetalhe
}) {
  const router = useRouter()
  const [sending, startSending] = useTransition()

  const save = async (
    campo: 'nome' | 'email' | 'telefone' | 'cidade_residencia' | 'estado_residencia' | 'status_contrato' | 'observacoes',
    valor: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const payload: Record<string, unknown> = {
      [campo]: campo === 'status_contrato'
        ? (valor as StatusContrato)
        : valor === ''
          ? undefined
          : valor,
    }
    const res = await updateProprietario(proprietario.id, payload)
    if (res.error) return { ok: false, error: res.error }
    router.refresh()
    return { ok: true }
  }

  const handleSendMagicLink = () => {
    startSending(async () => {
      const res = await sendMagicLink(proprietario.email)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Magic link enviado para o e-mail do proprietário')
      }
    })
  }

  const handleDelete = async () => {
    const res = await deleteProprietario(proprietario.id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Proprietário removido')
    router.push('/proprietarios')
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <Avatar
          name={proprietario.nome}
          seed={proprietario.id}
          size={AvatarSize.Lg}
          className="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-navy-800">
            {proprietario.nome}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {formatCpfCnpj(proprietario.cpf_cnpj)}
            {proprietario.cidade_residencia
              ? ` · ${proprietario.cidade_residencia}${
                  proprietario.estado_residencia
                    ? ` / ${proprietario.estado_residencia}`
                    : ''
                }`
              : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <BadgeStatus
              variant={BadgeStatusVariant.Contrato}
              status={proprietario.status_contrato}
            />
            {proprietario.data_entrada ? (
              <span className="text-xs text-ink-muted">
                Entrou em{' '}
                {format(parseISO(proprietario.data_entrada), 'dd/MM/yyyy')}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={ButtonVariant.Outline}
            size={ButtonSize.Sm}
            leadingIcon={<Send className="h-3.5 w-3.5" />}
            loading={sending}
            onClick={handleSendMagicLink}
          >
            Enviar magic link
          </Button>
          <ConfirmDialog
            titulo="Remover proprietário?"
            descricao="Esta ação só é permitida se não houver imóveis ativos vinculados."
            confirmLabel="Remover"
            variant={ConfirmVariant.Destructive}
            onConfirm={handleDelete}
            trigger={
              <Button
                variant={ButtonVariant.Ghost}
                size={ButtonSize.Sm}
                leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remover
              </Button>
            }
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardEyebrow>Dados cadastrais</CardEyebrow>
            <span className="text-2xs text-ink-subtle">
              Clique em qualquer campo para editar
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InlineEditField
              label="Nome"
              value={proprietario.nome}
              onSave={(v) => save('nome', v)}
            />
            <InlineEditField
              label="E-mail"
              value={proprietario.email}
              type="email"
              onSave={(v) => save('email', v)}
              display={
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-ink-subtle" />
                  {proprietario.email}
                </span>
              }
            />
            <InlineEditField
              label="Telefone"
              value={proprietario.telefone ?? ''}
              type="tel"
              onSave={(v) => save('telefone', v)}
            />
            <InlineEditField
              label="Status do contrato"
              value={proprietario.status_contrato}
              display={STATUS_CONTRATO_LABEL[proprietario.status_contrato]}
              options={(Object.keys(STATUS_CONTRATO_LABEL) as StatusContrato[]).map(
                (s) => ({ value: s, label: STATUS_CONTRATO_LABEL[s] }),
              )}
              onSave={(v) => save('status_contrato', v)}
            />
            <InlineEditField
              label="Cidade"
              value={proprietario.cidade_residencia ?? ''}
              onSave={(v) => save('cidade_residencia', v)}
            />
            <InlineEditField
              label="UF"
              value={proprietario.estado_residencia ?? ''}
              options={[
                { value: '', label: '—' },
                ...UF_LIST.map((uf) => ({ value: uf, label: uf })),
              ]}
              onSave={(v) => save('estado_residencia', v)}
            />
          </div>

          <Separator />

          <InlineEditField
            label="Observações"
            value={proprietario.observacoes ?? ''}
            placeholder="Adicione notas internas..."
            onSave={(v) => save('observacoes', v)}
          />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <CardEyebrow>Métricas</CardEyebrow>
            <div className="grid gap-3">
              <Metric
                icone={<Building2 className="h-4 w-4 text-gold-600" />}
                label="Imóveis ativos"
                valor={`${proprietario.metricas.imoveis_ativos} / ${proprietario.metricas.total_imoveis}`}
              />
              <Metric
                icone={<Banknote className="h-4 w-4 text-success-700" />}
                label="Total repassado"
                valor={formatCurrency(proprietario.metricas.total_repassado)}
              />
              <Metric
                icone={<Star className="h-4 w-4 text-gold-500" />}
                label="Repasses gerados"
                valor={String(proprietario.repasses.length)}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardEyebrow>Imóveis do proprietário</CardEyebrow>
          <span className="text-xs text-ink-muted">
            {proprietario.imoveis.length} cadastrado
            {proprietario.imoveis.length === 1 ? '' : 's'}
          </span>
        </div>
        {proprietario.imoveis.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-sand-50 px-4 py-6 text-center text-sm text-ink-muted">
            Nenhum imóvel cadastrado para este proprietário.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {proprietario.imoveis.map((im) => (
              <Link
                key={im.id}
                href={`/imoveis/${im.id}`}
                className="group rounded-md border border-line bg-white p-3 transition-colors hover:border-gold-300 hover:bg-sand-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-800 group-hover:text-navy-900">
                      {im.nome_interno}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {im.bairro}
                    </p>
                  </div>
                  <BadgeStatus
                    variant={BadgeStatusVariant.Imovel}
                    status={im.status}
                  />
                </div>
                <p className="mt-2 text-2xs text-ink-subtle">
                  Comissão {Number(im.comissao_percentual).toFixed(0)}%
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <CardEyebrow>Histórico de repasses</CardEyebrow>
        {proprietario.repasses.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-sand-50 px-4 py-6 text-center text-sm text-ink-muted">
            Nenhum repasse gerado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-2xs uppercase tracking-wider text-ink-subtle">
                  <th className="py-2 text-left font-semibold">Competência</th>
                  <th className="py-2 text-right font-semibold">Valor</th>
                  <th className="py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {proprietario.repasses
                  .slice()
                  .sort((a, b) =>
                    a.competencia_ano !== b.competencia_ano
                      ? b.competencia_ano - a.competencia_ano
                      : b.competencia_mes - a.competencia_mes,
                  )
                  .map((r) => (
                    <tr key={r.id} className="border-b border-line/60">
                      <td className="py-2">
                        {String(r.competencia_mes).padStart(2, '0')}/
                        {r.competencia_ano}
                      </td>
                      <td className="py-2 text-right font-medium text-navy-800">
                        {formatCurrency(Number(r.valor_repassado))}
                      </td>
                      <td className="py-2 text-right">
                        <BadgeStatus
                          variant={BadgeStatusVariant.Repasse}
                          status={r.status}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode
  label: string
  valor: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-sand-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        {icone}
        {label}
      </div>
      <span className="font-display text-sm font-semibold text-navy-800">
        {valor}
      </span>
    </div>
  )
}
