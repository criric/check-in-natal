'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Building2, CalendarCheck, Star, TrendingUp } from 'lucide-react'
import { KpiCard } from '@/components/ui/kpi-card'
import { formatCurrency } from '@/lib/utils/formatters'
import type { DashboardKpis } from '@/lib/actions/dashboard'

export function KpiSection({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        titulo="Imóveis ativos"
        valor={String(kpis.imoveis_ativos)}
        variacao={
          kpis.imoveis_ativos_variacao_pct !== 0
            ? kpis.imoveis_ativos_variacao_pct
            : undefined
        }
        variacaoLabel="vs. mês anterior"
        icone={<Building2 size={88} />}
      />

      <KpiCard
        titulo="Ocupação hoje"
        valor={`${kpis.ocupacao_hoje_pct.toFixed(0)}%`}
        descricao={`Média 7 dias: ${(
          kpis.ocupacao_7dias.reduce((s, d) => s + d.pct, 0) /
          Math.max(kpis.ocupacao_7dias.length, 1)
        ).toFixed(0)}%`}
        icone={<CalendarCheck size={88} />}
      >
        <div className="h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpis.ocupacao_7dias}>
              <defs>
                <linearGradient id="ocupacao-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A668" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#C8A668" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #E6DECB',
                  borderRadius: 6,
                  fontSize: 12,
                  padding: '4px 8px',
                }}
                labelFormatter={(d) => String(d)}
                formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Ocupação']}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#A98851"
                strokeWidth={2}
                fill="url(#ocupacao-grad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </KpiCard>

      <KpiCard
        titulo="Receita do mês"
        valor={formatCurrency(kpis.receita_mes)}
        variacao={
          kpis.receita_mes_variacao_pct !== 0
            ? kpis.receita_mes_variacao_pct
            : undefined
        }
        variacaoLabel="vs. ano anterior"
        icone={<TrendingUp size={88} />}
      />

      <KpiCard
        titulo="Avaliação média"
        valor={kpis.avaliacao_media > 0 ? kpis.avaliacao_media.toFixed(1) : '—'}
        descricao={
          kpis.total_avaliacoes > 0
            ? `${kpis.total_avaliacoes} avaliações`
            : 'Sem avaliações ainda'
        }
        icone={<Star size={88} className="fill-gold-200/40" />}
      />
    </div>
  )
}
