import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-sand-200/70', className)}
      {...rest}
    />
  )
}
