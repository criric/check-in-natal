import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button, ButtonVariant } from './button'

export type EmptyStateProps = {
  icone?: ReactNode
  titulo: string
  descricao?: string
  ctaLabel?: string
  ctaAction?: () => void
  ctaHref?: string
  className?: string
}

export function EmptyState({
  icone,
  titulo,
  descricao,
  ctaLabel,
  ctaAction,
  ctaHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-sand-50 px-6 py-12 text-center',
        className,
      )}
    >
      {icone ? (
        <div className="text-navy-400" aria-hidden>
          {icone}
        </div>
      ) : null}
      <h3 className="font-display text-lg text-navy-700">{titulo}</h3>
      {descricao ? (
        <p className="max-w-md text-sm text-ink-muted">{descricao}</p>
      ) : null}
      {ctaLabel && ctaHref ? (
        <a href={ctaHref}>
          <Button variant={ButtonVariant.Primary}>{ctaLabel}</Button>
        </a>
      ) : ctaLabel && ctaAction ? (
        <Button variant={ButtonVariant.Primary} onClick={ctaAction}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  )
}
