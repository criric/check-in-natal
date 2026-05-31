'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateConfiguracao } from '@/lib/actions/configuracoes'
import { cn } from '@/lib/utils/cn'
import type { Configuracao } from '@/types'
import type { CampoMeta, GrupoConfig } from './types'

export type ConfiguracoesClientProps = {
  configuracoes: Configuracao[]
  grupos: GrupoConfig[]
}

export function ConfiguracoesClient({
  configuracoes,
  grupos,
}: ConfiguracoesClientProps) {
  const mapa = new Map(configuracoes.map((c) => [c.chave, c]))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {grupos.map((grupo) => (
        <article
          key={grupo.titulo}
          className="flex flex-col rounded-lg border border-line bg-white p-5 shadow-xs"
        >
          <header className="mb-4 border-b border-line pb-3">
            <h2 className="font-display text-lg text-navy-800">
              {grupo.titulo}
            </h2>
            {grupo.descricao ? (
              <p className="mt-1 text-xs text-ink-muted">{grupo.descricao}</p>
            ) : null}
          </header>
          <ul className="divide-y divide-line/60">
            {grupo.campos.map((campo) => {
              const cfg = mapa.get(campo.chave)
              if (!cfg) {
                return (
                  <li key={campo.chave} className="py-3 text-xs text-ink-subtle">
                    <span className="font-medium uppercase tracking-wider">
                      {campo.label}
                    </span>{' '}
                    · não cadastrado
                  </li>
                )
              }
              return <Linha key={campo.chave} cfg={cfg} meta={campo} />
            })}
          </ul>
        </article>
      ))}
    </div>
  )
}

function Linha({ cfg, meta }: { cfg: Configuracao; meta: CampoMeta }) {
  const router = useRouter()
  const [valor, setValor] = useState(cfg.valor)
  const [editando, setEditando] = useState(false)
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const valorAtualRef = useRef(cfg.valor)

  // Sincroniza estado local com novo valor vindo do servidor
  useEffect(() => {
    if (!editando) {
      setValor(cfg.valor)
      valorAtualRef.current = cfg.valor
    }
  }, [cfg.valor, editando])

  useEffect(() => {
    if (editando) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editando])

  const iniciarEdicao = () => {
    setValor(cfg.valor)
    setEditando(true)
  }

  const cancelar = () => {
    setValor(cfg.valor)
    setEditando(false)
  }

  const salvar = () => {
    const novo = valor.trim()
    if (!novo) {
      toast.error('Valor não pode ficar vazio')
      cancelar()
      return
    }
    if (novo === valorAtualRef.current) {
      setEditando(false)
      return
    }
    start(async () => {
      const res = await updateConfiguracao({ chave: cfg.chave, valor: novo })
      if (res.error) {
        toast.error(res.error)
        cancelar()
        return
      }
      valorAtualRef.current = novo
      toast.success(`${meta.label} atualizado`)
      setEditando(false)
      router.refresh()
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      salvar()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelar()
    }
  }

  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {meta.label}
        </p>
        {meta.descricao ? (
          <p className="mt-0.5 text-xs text-ink-muted">{meta.descricao}</p>
        ) : null}

        <div className="mt-1.5">
          {editando ? (
            <div className="flex items-center gap-1.5">
              {meta.prefix ? (
                <span className="text-sm font-medium text-ink-muted">
                  {meta.prefix}
                </span>
              ) : null}
              <input
                ref={inputRef}
                type={meta.inputType ?? 'text'}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onBlur={salvar}
                onKeyDown={onKeyDown}
                disabled={pending}
                step={meta.step}
                min={meta.min}
                max={meta.max}
                className={cn(
                  'h-8 w-full max-w-[240px] rounded-md border border-gold-400 bg-white px-2 text-sm text-navy-800 shadow-xs',
                  'focus:outline-none focus:ring-2 focus:ring-gold-200',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                )}
                aria-label={meta.label}
              />
              {meta.suffix ? (
                <span className="text-sm font-medium text-ink-muted">
                  {meta.suffix}
                </span>
              ) : null}
              {pending ? (
                <span
                  aria-hidden
                  className="h-3 w-3 animate-spin rounded-full border-2 border-gold-500 border-r-transparent"
                />
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={iniciarEdicao}
              className="group inline-flex items-center gap-2 rounded-sm text-left text-base font-medium text-navy-800 hover:text-gold-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
              aria-label={`Editar ${meta.label}`}
            >
              <span>
                {meta.prefix ? (
                  <span className="text-sm font-normal text-ink-muted">
                    {meta.prefix}{' '}
                  </span>
                ) : null}
                {cfg.valor}
                {meta.suffix ? (
                  <span className="text-sm font-normal text-ink-muted">
                    {' '}
                    {meta.suffix}
                  </span>
                ) : null}
              </span>
              <Pencil
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden
              />
            </button>
          )}
        </div>
      </div>

      {!editando ? (
        <button
          type="button"
          onClick={iniciarEdicao}
          className="shrink-0 text-xs font-medium text-gold-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
        >
          Editar
        </button>
      ) : null}
    </li>
  )
}
