import { forwardRef } from 'react'
import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required = false, children, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-navy-700',
        className,
      )}
      {...rest}
    >
      {children}
      {required ? (
        <span aria-hidden className="text-gold-600">
          *
        </span>
      ) : null}
    </label>
  )
})
