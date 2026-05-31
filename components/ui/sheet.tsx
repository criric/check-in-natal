'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/lib/utils/cn'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export enum SheetSide {
  Left = 'left',
  Right = 'right',
}

const sideClasses: Record<SheetSide, string> = {
  [SheetSide.Left]:
    'inset-y-0 left-0 h-full w-72 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  [SheetSide.Right]:
    'inset-y-0 right-0 h-full w-96 border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
}

export type SheetContentProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  side?: SheetSide
}

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent(
  { className, children, side = SheetSide.Right, ...rest },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-white p-6 shadow-lg border-line',
          'data-[state=open]:animate-in data-[state=open]:duration-200',
          'data-[state=closed]:animate-out data-[state=closed]:duration-150',
          sideClasses[side],
          className,
        )}
        {...rest}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm p-1 text-ink-muted opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export function SheetHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...rest} />
  )
}

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('font-display text-xl text-navy-700', className)}
      {...rest}
    />
  )
})

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-ink-muted', className)}
      {...rest}
    />
  )
})
