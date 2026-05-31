'use client'

import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils/cn'

export type SearchableOption = {
  value: string
  label: string
  description?: string
}

export type SearchableSelectProps = {
  options: SearchableOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  invalid?: boolean
  disabled?: boolean
  id?: string
  className?: string
  'aria-describedby'?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado',
  invalid,
  disabled,
  id,
  className,
  'aria-describedby': ariaDescribedBy,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q),
    )
  }, [options, query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      setQuery('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-expanded={open}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'inline-flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-sm shadow-xs transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            invalid
              ? 'border-danger-500 focus:border-danger-600 focus:ring-danger-100'
              : 'border-line-strong focus:border-gold-500 focus:ring-gold-200',
            'disabled:cursor-not-allowed disabled:bg-sand-100',
            className,
          )}
        >
          <span className={cn(selected ? 'text-ink' : 'text-ink-subtle', 'truncate')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown aria-hidden className="ml-2 h-4 w-4 shrink-0 text-ink-subtle" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-line p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-sm border border-line bg-white pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-muted">{emptyMessage}</p>
          ) : (
            filtered.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                    'hover:bg-sand-100 focus:bg-sand-100 focus:outline-none',
                    isSelected && 'bg-sand-50',
                  )}
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      isSelected ? 'text-gold-600' : 'text-transparent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-navy-800">{opt.label}</p>
                    {opt.description ? (
                      <p className="truncate text-xs text-ink-muted">
                        {opt.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
