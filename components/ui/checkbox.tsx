'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/lib/utils/cn'

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...rest }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line-strong bg-white transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
        'data-[state=checked]:border-gold-500 data-[state=checked]:bg-gold-500 data-[state=checked]:text-white',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3 w-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
