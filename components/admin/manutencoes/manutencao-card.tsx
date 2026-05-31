'use client'

import { differenceInDays, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Building2,
  ClipboardClock,
  ImageIcon,
  Phone,
  User,
} from 'lucide-react'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { StatusManutencao } from '@/types'
import type { ManutencaoItem } from './manutencoes-client'

export function ManutencaoCard({
  manutencao,
  onAbrir,
}: {
  manutencao: ManutencaoItem
  onAbrir: () => void
}) {
  const diasAberta = differenceInDays(
    new Date(),
    parseISO(manutencao.data_abertura),
  )
  const aguardando =
    manutencao.status === StatusManutencao.AguardandoAprovacao
  const totalFotosAntes = manutencao.fotos_antes.length

  return (
    <Card
      className={cn(
        'flex h-full flex-col gap-3 p-4',
        aguardando && 'animate-pulse border-warning-400 ring-2 ring-warning-300',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-navy-800">
            {manutencao.imovel.nome_interno}
          </p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Building2 className="h-3 w-3" aria-hidden />
            {manutencao.imovel.proprietario.nome}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <BadgeStatus
            variant={BadgeStatusVariant.Urgencia}
            status={manutencao.urgencia}
          />
          <BadgeStatus
            variant={BadgeStatusVariant.Manutencao}
            status={manutencao.status}
          />
        </div>
      </div>

      <div>
        {manutencao.tipo ? (
          <p className="text-2xs font-semibold uppercase tracking-wider text-gold-700">
            {manutencao.tipo}
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm text-ink">
          {manutencao.descricao}
        </p>
      </div>

      {manutencao.prestador_nome ? (
        <div className="grid grid-cols-1 gap-1 rounded-md border border-line bg-sand-50 p-2 text-xs">
          <div className="flex items-center gap-1.5 text-navy-800">
            <User className="h-3 w-3" aria-hidden />
            <span className="font-medium">{manutencao.prestador_nome}</span>
          </div>
          {manutencao.prestador_contato ? (
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Phone className="h-3 w-3" aria-hidden />
              <span>{manutencao.prestador_contato}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {(manutencao.custo_estimado != null || manutencao.custo_real != null) ? (
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {manutencao.custo_estimado != null ? (
            <div>
              <dt className="text-ink-muted">Estimado</dt>
              <dd className="font-medium text-navy-800">
                {formatCurrency(manutencao.custo_estimado)}
              </dd>
            </div>
          ) : null}
          {manutencao.custo_real != null ? (
            <div>
              <dt className="text-ink-muted">Real</dt>
              <dd className="font-medium text-navy-800">
                {formatCurrency(manutencao.custo_real)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {totalFotosAntes > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {manutencao.fotos_antes.slice(0, 3).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-10 w-10 rounded-md border-2 border-white object-cover"
              />
            ))}
          </div>
          {totalFotosAntes > 3 ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <ImageIcon className="h-3 w-3" aria-hidden /> +{totalFotosAntes - 3}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        <ClipboardClock className="h-3 w-3" aria-hidden />
        Aberta {formatDate(manutencao.data_abertura)}
        {diasAberta > 0 ? ` · há ${diasAberta} dia${diasAberta === 1 ? '' : 's'}` : ' · hoje'}
      </div>

      {aguardando ? (
        <div className="flex items-start gap-1.5 rounded-md border border-warning-100 bg-warning-50 px-2 py-1.5 text-xs text-warning-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Aguardando aprovação do proprietário</span>
        </div>
      ) : null}

      <div className="mt-auto flex justify-end">
        <Button
          variant={ButtonVariant.Outline}
          size={ButtonSize.Sm}
          onClick={onAbrir}
        >
          Ver detalhes
        </Button>
      </div>
    </Card>
  )
}
