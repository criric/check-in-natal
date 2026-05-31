import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type PageHeaderProps = {
  titulo: string
  descricao?: string
  acoes?: ReactNode
  breadcrumb?: ReactNode
  className?: string
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      {breadcrumb ? (
        <div className="text-xs text-ink-muted">{breadcrumb}</div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">
            {titulo}
          </h1>
          {descricao ? (
            <p className="mt-1 text-sm text-ink-muted">{descricao}</p>
          ) : null}
        </div>
        {acoes ? (
          <div className="flex flex-wrap items-center gap-2">{acoes}</div>
        ) : null}
      </div>
    </header>
  )
}
