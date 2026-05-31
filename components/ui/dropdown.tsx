'use client'

import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/lib/utils/cn'

export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger
export const DropdownMenuGroup = DropdownPrimitive.Group

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownMenuContent(
  { className, sideOffset = 6, align = 'end', ...rest },
  ref,
) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-md border border-line bg-white p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...rest}
      />
    </DropdownPrimitive.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    destructive?: boolean
  }
>(function DropdownMenuItem({ className, destructive, ...rest }, ref) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none',
        'transition-colors focus:bg-sand-100 focus:text-navy-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive ? 'text-danger-700 focus:bg-danger-50' : 'text-ink',
        className,
      )}
      {...rest}
    />
  )
})

export function DropdownMenuLabel({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle', className)}
      {...rest}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-line', className)}
      {...rest}
    />
  )
}
