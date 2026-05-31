'use client'

import { Check, Pencil, X } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

export type InlineEditFieldProps = {
  label: string
  value?: string | null
  display?: ReactNode
  placeholder?: string
  type?: 'text' | 'email' | 'tel'
  options?: { value: string; label: string }[]
  onSave: (next: string) => Promise<{ ok: boolean; error?: string }>
}

export function InlineEditField({
  label,
  value,
  display,
  placeholder = 'Não informado',
  type = 'text',
  options,
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  useEffect(() => {
    if (editing) {
      setTimeout(() => {
        if (options) selectRef.current?.focus()
        else inputRef.current?.focus()
      }, 30)
    }
  }, [editing, options])

  const commit = async () => {
    if ((draft ?? '') === (value ?? '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const res = await onSave(draft.trim())
      if (!res.ok) {
        toast.error(res.error ?? 'Erro ao salvar')
        return
      }
      toast.success(`${label} atualizado`)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft(value ?? '')
    setEditing(false)
  }

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !options) {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          {options ? (
            <select
              ref={selectRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              disabled={saving}
              className="h-9 flex-1 rounded-md border border-line-strong bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              ref={inputRef}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              disabled={saving}
              className="h-9"
            />
          )}
          <button
            type="button"
            onClick={commit}
            disabled={saving}
            aria-label="Salvar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-success-700 hover:bg-success-50 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            aria-label="Cancelar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-sand-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            'group flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition-colors',
            'hover:border-line hover:bg-sand-50',
          )}
        >
          {display !== undefined ? (
            <span className="text-ink">{display}</span>
          ) : value ? (
            <span className="text-ink">{value}</span>
          ) : (
            <span className="text-ink-subtle">{placeholder}</span>
          )}
          <Pencil className="h-3.5 w-3.5 shrink-0 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
