import { Download } from 'lucide-react'
import { formatCurrency, formatDate, formatMesAno } from '@/lib/utils/formatters'
import { StatusRepasse } from '@/types'
import type { RepasseMesAtual } from '@/lib/actions/portal'

const STATUS_LABEL: Record<StatusRepasse, string> = {
  [StatusRepasse.Pendente]: 'Pendente',
  [StatusRepasse.Processando]: 'Processando',
  [StatusRepasse.Pago]: 'Pago',
}

export function CardFinanceiro({ repasse }: { repasse: RepasseMesAtual }) {
  const statusLabel = repasse.status
    ? STATUS_LABEL[repasse.status]
    : 'Sem repasse'
  const pago = repasse.status === StatusRepasse.Pago

  return (
    <div className="overflow-hidden rounded-lg bg-navy-gradient text-white shadow-md">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xs uppercase tracking-wider text-white/60">
              Repasse mais recente
            </p>
            <p className="font-display text-xl font-semibold text-gold-300">
              {formatMesAno(repasse.mes, repasse.ano)}
            </p>
          </div>
          <span
            className={
              pago
                ? 'inline-flex items-center rounded-sm bg-success-500/20 px-2 py-0.5 text-xs font-medium text-success-100'
                : 'inline-flex items-center rounded-sm bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90'
            }
          >
            {statusLabel}
          </span>
        </div>
        {pago && repasse.data_repasse ? (
          <p className="mt-1 text-xs text-success-100">
            Pago em {formatDate(repasse.data_repasse)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 px-6 py-5 text-sm">
        <Linha label="Receita bruta" valor={repasse.receita_bruta} />
        <Linha
          label="(−) Comissão"
          valor={-repasse.comissao_gestora}
        />
        {repasse.deducoes > 0 ? (
          <Linha label="(−) Deduções" valor={-repasse.deducoes} />
        ) : null}
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-2xs uppercase tracking-wider text-white/60">
          Valor a receber
        </p>
        <p className="mt-1 font-display text-4xl font-semibold text-gold-200">
          {formatCurrency(repasse.valor_repassado)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 bg-navy-900/30 px-6 py-4">
        {repasse.pdf_url ? (
          <a
            href={repasse.pdf_url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-md bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-900 transition-colors hover:bg-gold-400"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar extrato (PDF)
          </a>
        ) : (
          <span className="text-xs text-white/50">PDF ainda não disponível</span>
        )}
      </div>
    </div>
  )
}

function Linha({ label, valor }: { label: string; valor: number }) {
  const positivo = valor >= 0
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-white/70">{label}</span>
      <span
        className={
          positivo ? 'font-mono text-white' : 'font-mono text-white/80'
        }
      >
        {formatCurrency(valor)}
      </span>
    </div>
  )
}
