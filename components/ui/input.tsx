import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-md border bg-white px-3 text-sm text-ink shadow-xs transition-colors',
        'placeholder:text-ink-subtle',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        invalid
          ? 'border-danger-500 focus:border-danger-600 focus:ring-danger-100'
          : 'border-line-strong focus:border-gold-500 focus:ring-gold-200',
        'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-subtle',
        className,
      )}
      {...rest}
    />
  )
})
