'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bell,
  Building2,
  CalendarX,
  Check,
  CheckCheck,
  ClipboardCheck,
  FileWarning,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  marcarAlertaLido,
  marcarTodosLidos,
} from '@/lib/actions/alertas'
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard'
import { cn } from '@/lib/utils/cn'
import { PrioridadeAlerta, TipoAlerta } from '@/types'

export type ImovelOpt = {
  id: string
  nome_interno: string
  bairro: string
}

export type AlertaItem = {
  id: string
  tipo: TipoAlerta
  prioridade: PrioridadeAlerta
  titulo: string
  mensagem?: string
  lido: boolean
  created_at: string
  imovel?: { id: string; nome_interno: string; bairro: string }
}

const ICON_MAP: Record<TipoAlerta, React.ElementType> = {
  [TipoAlerta.CheckinSemLimpeza]: Sparkles,
  [TipoAlerta.ImovelSemReserva]: CalendarX,
  [TipoAlerta.RepassePendente]: FileWarning,
  [TipoAlerta.ManutencaoParada]: Wrench,
  [TipoAlerta.ManutencaoAberta]: Wrench,
  [TipoAlerta.ContratoVencendo]: FileWarning,
  [TipoAlerta.VistoriaCritica]: ClipboardCheck,
  [TipoAlerta.VistoriaAtencao]: ClipboardCheck,
}

const ICON_TONE: Record<TipoAlerta, string> = {
  [TipoAlerta.CheckinSemLimpeza]: 'bg-danger-50 text-danger-700',
  [TipoAlerta.ImovelSemReserva]: 'bg-warning-50 text-warning-700',
  [TipoAlerta.RepassePendente]: 'bg-gold-50 text-gold-700',
  [TipoAlerta.ManutencaoParada]: 'bg-warning-50 text-warning-700',
  [TipoAlerta.ManutencaoAberta]: 'bg-warning-50 text-warning-700',
  [TipoAlerta.ContratoVencendo]: 'bg-info-50 text-info-700',
  [TipoAlerta.VistoriaCritica]: 'bg-danger-50 text-danger-700',
  [TipoAlerta.VistoriaAtencao]: 'bg-warning-50 text-warning-700',
}

const TIPO_LABEL: Record<TipoAlerta, string> = {
  [TipoAlerta.CheckinSemLimpeza]: 'Check-in sem limpeza',
  [TipoAlerta.ImovelSemReserva]: 'Imóvel sem reserva',
  [TipoAlerta.RepassePendente]: 'Repasse pendente',
  [TipoAlerta.ManutencaoParada]: 'Manutenção parada',
  [TipoAlerta.ManutencaoAberta]: 'Manutenção aberta',
  [TipoAlerta.ContratoVencendo]: 'Contrato vencendo',
  [TipoAlerta.VistoriaCritica]: 'Vistoria crítica',
  [TipoAlerta.VistoriaAtencao]: 'Vistoria — atenção',
}

const PRIORIDADE_BARRA: Record<PrioridadeAlerta, string> = {
  [PrioridadeAlerta.Critica]: 'bg-danger-600',
  [PrioridadeAlerta.Alta]: 'bg-warning-500',
  [PrioridadeAlerta.Media]: 'bg-info-500',
  [PrioridadeAlerta.Baixa]: 'bg-navy-300',
}

const ORDEM_PRIORIDADE: Record<PrioridadeAlerta, number> = {
  [PrioridadeAlerta.Critica]: 0,
  [PrioridadeAlerta.Alta]: 1,
  [PrioridadeAlerta.Media]: 2,
  [PrioridadeAlerta.Baixa]: 3,
}

export function AlertasClient({
  alertas,
  imoveis,
}: {
  alertas: AlertaItem[]
  imoveis: ImovelOpt[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<
    '' | PrioridadeAlerta
  >('')
  const [tipoFiltro, setTipoFiltro] = useState<'' | TipoAlerta>('')
  const [imovelFiltro, setImovelFiltro] = useState<string>('')
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false)
  const [pendingId, setPendingId] = useState<string | undefined>()

  useRealtimeDashboard({
    onNovoAlerta: () => router.refresh(),
  })

  const filtrados = useMemo(() => {
    const filtrada = alertas.filter((a) => {
      if (prioridadeFiltro && a.prioridade !== prioridadeFiltro) return false
      if (tipoFiltro && a.tipo !== tipoFiltro) return false
      if (imovelFiltro && a.imovel?.id !== imovelFiltro) return false
      if (apenasNaoLidos && a.lido) return false
      return true
    })
    return filtrada.slice().sort((a, b) => {
      if (a.lido !== b.lido) return a.lido ? 1 : -1
      const pa = ORDEM_PRIORIDADE[a.prioridade] ?? 9
      const pb = ORDEM_PRIORIDADE[b.prioridade] ?? 9
      if (pa !== pb) return pa - pb
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })
  }, [alertas, prioridadeFiltro, tipoFiltro, imovelFiltro, apenasNaoLidos])

  const naoLidos = alertas.filter((a) => !a.lido).length
  const hasFilters = Boolean(
    prioridadeFiltro || tipoFiltro || imovelFiltro || apenasNaoLidos,
  )

  const limparFiltros = () => {
    setPrioridadeFiltro('')
    setTipoFiltro('')
    setImovelFiltro('')
    setApenasNaoLidos(false)
  }

  const handleMarcarLido = (id: string) => {
    setPendingId(id)
    startTransition(async () => {
      const res = await marcarAlertaLido(id)
      if (res.error) toast.error(res.error)
      router.refresh()
      setPendingId(undefined)
    })
  }

  const handleMarcarTodos = () => {
    startTransition(async () => {
      const res = await marcarTodosLidos()
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Todos os alertas marcados como lidos')
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-muted">
          {naoLidos > 0 ? (
            <>
              <span className="font-medium text-navy-800">{naoLidos}</span>{' '}
              não lido{naoLidos === 1 ? '' : 's'} · {alertas.length} total
            </>
          ) : (
            <>Tudo em dia · {alertas.length} alerta{alertas.length === 1 ? '' : 's'}</>
          )}
        </div>
        <Button
          variant={ButtonVariant.Outline}
          size={ButtonSize.Sm}
          leadingIcon={<CheckCheck className="h-4 w-4" />}
          onClick={handleMarcarTodos}
          disabled={pending || naoLidos === 0}
        >
          Marcar todos como lidos
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-line bg-white p-3">
        <select
          value={prioridadeFiltro}
          onChange={(e) =>
            setPrioridadeFiltro((e.target.value as PrioridadeAlerta) || '')
          }
          className="h-9 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
          aria-label="Filtrar por prioridade"
        >
          <option value="">Todas as prioridades</option>
          <option value={PrioridadeAlerta.Critica}>Crítica</option>
          <option value={PrioridadeAlerta.Alta}>Alta</option>
          <option value={PrioridadeAlerta.Media}>Média</option>
          <option value={PrioridadeAlerta.Baixa}>Baixa</option>
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro((e.target.value as TipoAlerta) || '')}
          className="h-9 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {Object.values(TipoAlerta).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={imovelFiltro}
          onChange={(e) => setImovelFiltro(e.target.value)}
          className="h-9 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
          aria-label="Filtrar por imóvel"
        >
          <option value="">Todos os imóveis</option>
          {imoveis.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome_interno}
            </option>
          ))}
        </select>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-3 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={apenasNaoLidos}
            onChange={(e) => setApenasNaoLidos(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-line-strong text-navy-700 focus:ring-gold-200"
          />
          Apenas não lidos
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={limparFiltros}
            className="text-xs font-medium text-ink-muted hover:text-navy-700"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icone={<Bell className="h-10 w-10" />}
          titulo={
            hasFilters
              ? 'Nenhum alerta com esses filtros'
              : 'Tudo certo por aqui'
          }
          descricao={
            hasFilters
              ? 'Ajuste os filtros para ver mais alertas.'
              : 'Quando algo precisar de atenção, vai aparecer aqui.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtrados.map((alerta) => {
            const Icon = ICON_MAP[alerta.tipo] ?? Bell
            const iconTone = ICON_TONE[alerta.tipo] ?? 'bg-sand-100 text-navy-700'
            const isPending = pendingId === alerta.id
            return (
              <li key={alerta.id}>
                <div
                  className={cn(
                    'group relative flex items-start gap-3 rounded-md border border-line bg-white p-4 transition-colors',
                    !alerta.lido && 'border-gold-200 bg-gold-50/30',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
                      PRIORIDADE_BARRA[alerta.prioridade],
                    )}
                  />
                  <div
                    className={cn(
                      'ml-1.5 mt-0.5 shrink-0 rounded-md p-2',
                      iconTone,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <BadgeStatus
                        variant={BadgeStatusVariant.Prioridade}
                        status={alerta.prioridade}
                      />
                      <span className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                        {TIPO_LABEL[alerta.tipo]}
                      </span>
                      {!alerta.lido ? (
                        <span
                          aria-label="Não lido"
                          title="Não lido"
                          className="ml-auto inline-flex h-2 w-2 shrink-0 rounded-full bg-gold-500"
                        />
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-sm',
                        alerta.lido ? 'text-ink-muted' : 'text-navy-800',
                      )}
                    >
                      {alerta.titulo}
                    </p>
                    {alerta.mensagem ? (
                      <p className="mt-1 text-xs text-ink-muted">
                        {alerta.mensagem}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-ink-subtle">
                      {alerta.imovel ? (
                        <Link
                          href={`/imoveis/${alerta.imovel.id}`}
                          className="inline-flex items-center gap-1 rounded-sm bg-sand-100 px-1.5 py-0.5 text-2xs font-medium text-navy-700 hover:bg-sand-200"
                        >
                          <Building2 className="h-3 w-3" aria-hidden />
                          {alerta.imovel.nome_interno}
                        </Link>
                      ) : null}
                      <span>
                        {formatDistanceToNow(new Date(alerta.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  {!alerta.lido ? (
                    <button
                      type="button"
                      onClick={() => handleMarcarLido(alerta.id)}
                      disabled={isPending}
                      aria-label="Marcar como lido"
                      title="Marcar como lido"
                      className="shrink-0 self-center rounded-sm p-2 text-ink-muted transition-colors hover:bg-sand-100 hover:text-success-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
