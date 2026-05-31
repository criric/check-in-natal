'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Card, CardEyebrow, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatMesAno } from '@/lib/utils/formatters'
import { StatusRepasse } from '@/types'

export type RepasseRow = {
  id: string
  competencia_mes: number
  competencia_ano: number
  receita_bruta: number
  comissao_gestora: number
  deducoes_manutencao: number
  deducoes_outros: number
  valor_repassado: number
  status: StatusRepasse
  data_repasse?: string | null
  pdf_url?: string | null
}

export function TabFinanceiro({
  receitaPorMes,
  kpis,
  repasses,
}: {
  receitaPorMes: Array<{ mes: string; receita_bruta: number }>
  kpis: { revpar: number; adr: number; taxa_ocupacao: number }
  repasses: RepasseRow[]
}) {
  const dadosChart = receitaPorMes.map((d) => ({
    ...d,
    label: format(parseISO(`${d.mes}-01`), 'MMM/yy', { locale: ptBR }),
  }))

  const columns: ColumnDef<RepasseRow>[] = [
    {
      id: 'competencia',
      header: 'Mês/Ano',
      accessorFn: (r) => `${r.competencia_ano}-${String(r.competencia_mes).padStart(2, '0')}`,
      cell: ({ row }) =>
        formatMesAno(row.original.competencia_mes, row.original.competencia_ano),
    },
    {
      id: 'bruta',
      header: 'Receita bruta',
      accessorFn: (r) => r.receita_bruta,
      cell: ({ row }) => formatCurrency(Number(row.original.receita_bruta)),
    },
    {
      id: 'comissao',
      header: 'Comissão',
      accessorFn: (r) => r.comissao_gestora,
      cell: ({ row }) => formatCurrency(Number(row.original.comissao_gestora)),
    },
    {
      id: 'deducoes',
      header: 'Deduções',
      accessorFn: (r) => Number(r.deducoes_manutencao) + Number(r.deducoes_outros),
      cell: ({ row }) =>
        formatCurrency(
          Number(row.original.deducoes_manutencao) +
            Number(row.original.deducoes_outros),
        ),
    },
    {
      id: 'liquido',
      header: 'Repassado',
      accessorFn: (r) => r.valor_repassado,
      cell: ({ row }) => (
        <span className="font-semibold text-navy-800">
          {formatCurrency(Number(row.original.valor_repassado))}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Repasse}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }) =>
        row.original.data_repasse
          ? format(parseISO(row.original.data_repasse), 'dd/MM/yyyy')
          : '—',
    },
    {
      id: 'pdf',
      header: 'PDF',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.pdf_url ? (
          <a
            href={row.original.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Baixar PDF"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-sand-100 hover:text-navy-700"
          >
            <Download className="h-4 w-4" />
          </a>
        ) : (
          <Link
            href={`/api/repasses/${row.original.id}/pdf`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-sand-100 hover:text-navy-700"
            aria-label="Gerar PDF"
          >
            <Download className="h-4 w-4" />
          </Link>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardEyebrow>RevPAR</CardEyebrow>
          <p className="mt-1 font-display text-2xl font-semibold text-navy-800">
            {formatCurrency(kpis.revpar)}
          </p>
          <p className="text-xs text-ink-muted">Receita / noite disponível</p>
        </Card>
        <Card>
          <CardEyebrow>ADR</CardEyebrow>
          <p className="mt-1 font-display text-2xl font-semibold text-navy-800">
            {formatCurrency(kpis.adr)}
          </p>
          <p className="text-xs text-ink-muted">Diária média</p>
        </Card>
        <Card>
          <CardEyebrow>Ocupação</CardEyebrow>
          <p className="mt-1 font-display text-2xl font-semibold text-navy-800">
            {kpis.taxa_ocupacao.toFixed(1)}%
          </p>
          <p className="text-xs text-ink-muted">Período analisado</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line p-4">
          <CardEyebrow>Receita mensal</CardEyebrow>
          <CardTitle className="mt-1 text-base">Últimos 12 meses</CardTitle>
        </div>
        <div className="h-64 w-full px-2 py-4">
          {dadosChart.length === 0 ? (
            <EmptyState
              titulo="Sem dados"
              descricao="Receita aparecerá quando houver reservas concluídas."
              icone={<TrendingUp className="h-8 w-8" />}
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosChart}>
                <CartesianGrid stroke="#E6DECB" strokeDasharray="2 2" vertical={false} />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  stroke="#7A8899"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  stroke="#7A8899"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    Number(v) >= 1000
                      ? `${(Number(v) / 1000).toFixed(0)}k`
                      : String(v)
                  }
                />
                <Tooltip
                  cursor={{ fill: 'rgba(200, 166, 104, 0.1)' }}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E6DECB',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCurrency(Number(v)), 'Receita bruta']}
                />
                <Bar
                  dataKey="receita_bruta"
                  fill="#C8A668"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={repasses}
        searchPlaceholder="Buscar repasses..."
        emptyTitle="Sem repasses"
        emptyMessage="Os repasses gerados para este imóvel aparecerão aqui."
      />
    </div>
  )
}
