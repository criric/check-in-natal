'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'

const MESES_ABREV = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

type Props = {
  data: Array<{ mes: string; receita: number }>
}

function formatMesLabel(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  return `${MESES_ABREV[(m ?? 1) - 1]}/${String(ano).slice(2)}`
}

export function ReceitaChart({ data }: Props) {
  const chartData = data.map((d) => ({
    mes: formatMesLabel(d.mes),
    receita: d.receita,
  }))

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-display text-lg font-semibold text-navy-800">
        Receita líquida (12 meses)
      </h2>
      <p className="mb-4 text-xs text-ink-muted">
        Valores acumulados por mês de checkout
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6DECB" vertical={false} />
            <XAxis
              dataKey="mes"
              stroke="#7A8899"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#7A8899"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <Tooltip
              cursor={{ fill: '#F5EFE6' }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #E6DECB',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [formatCurrency(Number(v)), 'Receita']}
              labelStyle={{ color: '#0B1A2B', fontWeight: 600 }}
            />
            <Bar dataKey="receita" fill="#C8A668" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
