'use client'

import { forwardRef, useEffect, useState, type ChangeEvent } from 'react'
import { Input, type InputProps } from './input'

function formatBRL(cents: number): string {
  const value = cents / 100
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseDigits(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export type CurrencyInputProps = Omit<
  InputProps,
  'value' | 'onChange' | 'defaultValue' | 'type'
> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { value, defaultValue, onValueChange, onBlur, ...rest },
    ref,
  ) {
    const initialCents = Math.round((value ?? defaultValue ?? 0) * 100)
    const [display, setDisplay] = useState<string>(formatBRL(initialCents))

    useEffect(() => {
      if (value !== undefined) {
        setDisplay(formatBRL(Math.round(value * 100)))
      }
    }, [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const cents = parseDigits(e.target.value)
      setDisplay(formatBRL(cents))
      onValueChange?.(cents / 100)
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        {...rest}
      />
    )
  },
)
