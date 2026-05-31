'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/lib/utils/cn'

export const Tabs = TabsPrimitive.Root

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-white p-1',
        className,
      )}
      {...rest}
    />
  )
})

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors',
        'hover:text-navy-700',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
        'data-[state=active]:bg-navy-700 data-[state=active]:text-white data-[state=active]:shadow-sm',
        className,
      )}
      {...rest}
    />
  )
})

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...rest }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
        className,
      )}
      {...rest}
    />
  )
})
