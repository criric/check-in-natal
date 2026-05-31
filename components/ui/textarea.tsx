import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid = false, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm text-ink shadow-xs transition-colors',
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
  },
)
