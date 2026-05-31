'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { aprovarManutencao } from '@/lib/actions/manutencoes'
import {
  BadgeStatus,
  BadgeStatusVariant,
} from '@/components/ui/badge-status'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { StatusManutencao, UrgenciaManutencao } from '@/types'

type Manutencao = {
  id: string
  descricao: string
  urgencia: UrgenciaManutencao
  status: StatusManutencao
  tipo?: string
  custo_estimado?: number
  custo_real?: number
  data_abertura: string
  fotos_antes: string[]
  fotos_depois: string[]
  imovel: { id: string; nome_interno: string }
}

export function ManutencaoCardProprietario({
  manutencao,
  destacar,
}: {
  manutencao: Manutencao
  statusLabel: string
  urgenciaLabel: string
  destacar?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  function decidir(aprovar: boolean) {
    setErro(undefined)
    startTransition(async () => {
      const r = await aprovarManutencao(manutencao.id, {
        aprovacao: aprovar,
        observacao_proprietario: obs || undefined,
      })
      if (r.error) setErro(r.error)
    })
  }

  return (
    <li
      className={
        destacar
          ? 'rounded-lg border border-warning-100 bg-white shadow-sm'
          : 'rounded-lg border border-line bg-white shadow-xs'
      }
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-sand-50"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <BadgeStatus
              variant={BadgeStatusVariant.Urgencia}
              status={manutencao.urgencia}
            />
            <BadgeStatus
              variant={BadgeStatusVariant.Manutencao}
              status={manutencao.status}
            />
            <span className="text-xs text-ink-muted">
              {formatDate(manutencao.data_abertura)}
            </span>
          </div>
          <p className="font-display text-sm font-semibold text-navy-800">
            {manutencao.imovel.nome_interno}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
            {manutencao.descricao}
          </p>
          {manutencao.custo_estimado != null && (
            <p className="mt-2 text-xs text-ink-muted">
              Custo estimado:{' '}
              <span className="font-mono font-semibold text-navy-800">
                {formatCurrency(Number(manutencao.custo_estimado))}
              </span>
            </p>
          )}
        </div>
        <span className="mt-1 text-ink-subtle" aria-hidden>
          {aberto ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-line p-4">
          {manutencao.tipo && (
            <p className="text-sm">
              <span className="text-ink-muted">Tipo:</span>{' '}
              <span className="font-medium text-navy-800">{manutencao.tipo}</span>
            </p>
          )}
          {manutencao.custo_real != null && (
            <p className="text-sm">
              <span className="text-ink-muted">Custo real:</span>{' '}
              <span className="font-mono font-semibold text-navy-800">
                {formatCurrency(Number(manutencao.custo_real))}
              </span>
            </p>
          )}
          {manutencao.fotos_antes.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Antes
              </p>
              <div className="flex flex-wrap gap-2">
                {manutencao.fotos_antes.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={u}
                    src={u}
                    alt="Foto antes"
                    className="h-24 w-24 rounded-md border border-line object-cover"
                  />
                ))}
              </div>
            </div>
          )}
          {manutencao.fotos_depois.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Depois
              </p>
              <div className="flex flex-wrap gap-2">
                {manutencao.fotos_depois.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={u}
                    src={u}
                    alt="Foto depois"
                    className="h-24 w-24 rounded-md border border-line object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {destacar && (
            <div className="space-y-2 rounded-md border border-line bg-sand-50 p-3">
              <p className="text-sm font-medium text-navy-800">
                Sua aprovação é necessária
              </p>
              <p className="text-xs text-ink-muted">
                Esta manutenção excede o limite automático e precisa do seu OK
                antes de ser executada.
              </p>
              <label
                htmlFor={`obs-${manutencao.id}`}
                className="block text-xs font-medium text-navy-700"
              >
                Observação para a equipe (opcional)
              </label>
              <textarea
                id={`obs-${manutencao.id}`}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => decidir(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-success-600 px-3 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Aprovar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => decidir(false)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-danger-600 px-3 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Recusar
                </button>
              </div>
              {erro && <p className="text-sm text-danger-700">{erro}</p>}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
