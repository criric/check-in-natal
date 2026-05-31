import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export enum CardTone {
  Default = 'default',
  Sand = 'sand',
  Navy = 'navy',
  Elevated = 'elevated',
}

const toneClasses: Record<CardTone, string> = {
  [CardTone.Default]: 'bg-white border border-line',
  [CardTone.Sand]: 'bg-sand-50 border border-line',
  [CardTone.Navy]: 'bg-navy-gradient text-white border border-navy-800',
  [CardTone.Elevated]: 'bg-white border border-line shadow-md',
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone
}

export function Card({
  tone = CardTone.Default,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-5 transition-shadow',
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  )
}

export function CardHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mb-4 flex items-start justify-between gap-4', className)}
      {...rest}
    />
  )
}

export function CardTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-xl text-navy-700 leading-tight',
        className,
      )}
      {...rest}
    />
  )
}

export function CardDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-ink-muted', className)} {...rest} />
  )
}

export function CardEyebrow({
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-2xs font-semibold uppercase tracking-[0.18em] text-gold-700',
        className,
      )}
      {...rest}
    />
  )
}

export function CardContent({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm text-ink', className)} {...rest} />
}

export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-5 flex items-center justify-end gap-2', className)}
      {...rest}
    />
  )
}
