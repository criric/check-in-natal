import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const TONE_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: 'bg-navy-100', text: 'text-navy-800' },
  { bg: 'bg-gold-100', text: 'text-gold-800' },
  { bg: 'bg-success-100', text: 'text-success-700' },
  { bg: 'bg-info-100', text: 'text-info-700' },
  { bg: 'bg-warning-100', text: 'text-warning-700' },
  { bg: 'bg-sand-200', text: 'text-navy-700' },
]

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export enum AvatarSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.Sm]: 'h-8 w-8 text-xs',
  [AvatarSize.Md]: 'h-10 w-10 text-sm',
  [AvatarSize.Lg]: 'h-14 w-14 text-base',
}

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string
  seed?: string
  size?: AvatarSize
}

export function Avatar({
  name,
  seed,
  size = AvatarSize.Md,
  className,
  ...rest
}: AvatarProps) {
  const palette = TONE_PALETTE[hashSeed(seed ?? name) % TONE_PALETTE.length]
  return (
    <div
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        palette.bg,
        palette.text,
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {initials(name)}
    </div>
  )
}
