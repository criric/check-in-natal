import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from './skeleton'

export type KpiCardProps = {
  titulo: string
  valor: string
  variacao?: number
  variacaoLabel?: string
  icone?: ReactNode
  descricao?: string
  loading?: boolean
  className?: string
  children?: ReactNode
}

export function KpiCard({
  titulo,
  valor,
  variacao,
  variacaoLabel,
  icone,
  descricao,
  loading,
  className,
  children,
}: KpiCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-xs',
          className,
        )}
      >
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-9 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    )
  }

  const variacaoPositiva = variacao !== undefined && variacao >= 0

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-xs',
        'transition-shadow hover:shadow-md',
        className,
      )}
    >
      {icone ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 text-sand-200 opacity-60 transition-opacity group-hover:opacity-80"
        >
          <div className="text-[88px] leading-none">{icone}</div>
        </div>
      ) : null}

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {titulo}
        </p>
        <p className="mt-2 font-display text-3xl font-semibold leading-tight text-navy-800">
          {valor}
        </p>

        {variacao !== undefined ? (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1 text-xs font-medium',
              variacaoPositiva ? 'text-success-700' : 'text-danger-700',
            )}
          >
            {variacaoPositiva ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>
              {variacaoPositiva ? '+' : ''}
              {variacao.toFixed(1)}%
            </span>
            {variacaoLabel ? (
              <span className="text-ink-subtle font-normal">
                {variacaoLabel}
              </span>
            ) : null}
          </div>
        ) : descricao ? (
          <p className="mt-2 text-xs text-ink-muted">{descricao}</p>
        ) : null}

        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  )
}
