'use client'

import Link from 'next/link'
import { Building2, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar, AvatarSize } from '@/components/ui/avatar'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { formatCpfCnpj } from '@/lib/utils/formatters'
import { StatusContrato } from '@/types'

export type ProprietarioCardData = {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string | null
  cidade_residencia?: string | null
  estado_residencia?: string | null
  status_contrato: StatusContrato
  num_imoveis_ativos: number
}

const STATUS_OPTIONS: { value: StatusContrato | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: StatusContrato.Ativo, label: 'Ativo' },
  { value: StatusContrato.EmNegociacao, label: 'Em negociação' },
  { value: StatusContrato.Inativo, label: 'Inativo' },
  { value: StatusContrato.Encerrado, label: 'Encerrado' },
]

export function ProprietariosGrid({
  proprietarios,
}: {
  proprietarios: ProprietarioCardData[]
}) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<StatusContrato | ''>('')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return proprietarios.filter((p) => {
      if (status && p.status_contrato !== status) return false
      if (!q) return true
      return (
        p.nome.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.cpf_cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    })
  }, [proprietarios, busca, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
            className="pl-9"
            aria-label="Buscar proprietários"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusContrato | '')}
          className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
          aria-label="Filtrar por status do contrato"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icone={<Users className="h-10 w-10" />}
          titulo="Nenhum proprietário encontrado"
          descricao="Ajuste a busca ou cadastre um novo proprietário."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => (
            <Card key={p.id} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Avatar
                  name={p.nome}
                  seed={p.id}
                  size={AvatarSize.Lg}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-navy-800 leading-tight">
                    {p.nome}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatCpfCnpj(p.cpf_cnpj)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-subtle">
                    {p.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <BadgeStatus
                  variant={BadgeStatusVariant.Contrato}
                  status={p.status_contrato}
                />
                {p.cidade_residencia ? (
                  <span className="text-2xs text-ink-muted">
                    {p.cidade_residencia}
                    {p.estado_residencia ? ` · ${p.estado_residencia}` : ''}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 rounded-md bg-sand-50 px-3 py-2 text-xs text-ink-muted">
                <Building2 className="h-3.5 w-3.5 text-gold-600" />
                <span>
                  <span className="font-semibold text-navy-800">
                    {p.num_imoveis_ativos}
                  </span>{' '}
                  imóvel{p.num_imoveis_ativos === 1 ? '' : 'is'} ativo
                  {p.num_imoveis_ativos === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-end">
                <Link href={`/proprietarios/${p.id}`}>
                  <Button
                    variant={ButtonVariant.Outline}
                    size={ButtonSize.Sm}
                  >
                    Ver detalhes
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
