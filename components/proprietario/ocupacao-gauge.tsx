type Props = {
  ocupacao: number
  mediaCarteira: number
}

export function OcupacaoGauge({ ocupacao, mediaCarteira }: Props) {
  const pct = Math.max(0, Math.min(100, ocupacao))
  const r = 56
  const c = 2 * Math.PI * r
  const dashOffset = c - (pct / 100) * c

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-display text-lg font-semibold text-navy-800">
        Ocupação do mês
      </h2>
      <p className="mb-4 text-xs text-ink-muted">
        Seu desempenho frente à média da carteira
      </p>
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        <svg viewBox="0 0 140 140" className="h-32 w-32" aria-label="Gauge ocupação">
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#F5EFE6"
            strokeWidth="14"
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#C8A668"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
          />
          <text
            x="70"
            y="68"
            textAnchor="middle"
            className="fill-navy-800 font-display"
            fontSize="26"
            fontWeight="700"
          >
            {pct.toFixed(0)}%
          </text>
          <text
            x="70"
            y="88"
            textAnchor="middle"
            className="fill-ink-subtle"
            fontSize="9"
          >
            seu imóvel
          </text>
        </svg>
        <p className="text-center text-xs text-ink-muted">
          Média da carteira:{' '}
          <span className="font-semibold text-navy-700">
            {mediaCarteira.toFixed(0)}%
          </span>
        </p>
      </div>
    </div>
  )
}
