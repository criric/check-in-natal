import type { ReactNode } from 'react'
import { useId } from 'react'
import { Label } from './label'
import { cn } from '@/lib/utils/cn'

export type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode | ((props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode)
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  const invalid = Boolean(error)
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {typeof children === 'function' ? children({ id, invalid, describedBy: descriptionId }) : children}
      {error ? (
        <p id={descriptionId} className="text-xs text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
