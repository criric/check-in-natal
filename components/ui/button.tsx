import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Outline = 'outline',
  Ghost = 'ghost',
  Danger = 'danger',
}

export enum ButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

const variantClasses: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]:
    'bg-navy-700 text-white shadow-sm hover:bg-navy-800 active:bg-navy-900 disabled:bg-navy-300',
  [ButtonVariant.Secondary]:
    'bg-gold-500 text-navy-900 shadow-sm hover:bg-gold-600 hover:text-white active:bg-gold-700 disabled:bg-gold-200 disabled:text-navy-400',
  [ButtonVariant.Outline]:
    'border border-line-strong bg-white text-navy-700 hover:bg-sand-50 hover:border-gold-400 active:bg-sand-100 disabled:text-navy-300',
  [ButtonVariant.Ghost]:
    'bg-transparent text-navy-700 hover:bg-sand-200/60 active:bg-sand-200 disabled:text-navy-300',
  [ButtonVariant.Danger]:
    'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-700 disabled:bg-danger-100 disabled:text-danger-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  [ButtonSize.Sm]: 'h-8 px-3 text-xs gap-1.5',
  [ButtonSize.Md]: 'h-10 px-4 text-sm gap-2',
  [ButtonSize.Lg]: 'h-12 px-6 text-base gap-2.5',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = ButtonVariant.Primary,
    size = ButtonSize.Md,
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'disabled:cursor-not-allowed disabled:shadow-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : leadingIcon ? (
        <span aria-hidden className="shrink-0">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && trailingIcon ? (
        <span aria-hidden className="shrink-0">{trailingIcon}</span>
      ) : null}
    </button>
  )
})
