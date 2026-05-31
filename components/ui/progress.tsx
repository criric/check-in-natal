import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export enum ProgressTone {
  Brand = 'brand',
  Success = 'success',
  Warning = 'warning',
  Danger = 'danger',
}

const trackToneClasses: Record<ProgressTone, string> = {
  [ProgressTone.Brand]: 'bg-gold-100',
  [ProgressTone.Success]: 'bg-success-50',
  [ProgressTone.Warning]: 'bg-warning-50',
  [ProgressTone.Danger]: 'bg-danger-50',
}

const fillToneClasses: Record<ProgressTone, string> = {
  [ProgressTone.Brand]: 'bg-gold-500',
  [ProgressTone.Success]: 'bg-success-500',
  [ProgressTone.Warning]: 'bg-warning-500',
  [ProgressTone.Danger]: 'bg-danger-500',
}

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  max?: number
  tone?: ProgressTone
}

export function Progress({
  value,
  max = 100,
  tone = ProgressTone.Brand,
  className,
  ...rest
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(max, value))
  const pct = max > 0 ? (clamped / max) * 100 : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full',
        trackToneClasses[tone],
        className,
      )}
      {...rest}
    >
      <div
        className={cn('h-full rounded-full transition-all', fillToneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
