type LinhaComparativo = {
  item: string
  proprio: boolean
  nosso: boolean
}

const LINHAS: LinhaComparativo[] = [
  { item: 'Atendimento ao hóspede 24h, todos os dias', proprio: false, nosso: true },
  { item: 'Gestão profissional de avaliações e ranking', proprio: false, nosso: true },
  { item: 'Precificação dinâmica (sazonalidade e eventos)', proprio: false, nosso: true },
  { item: 'Limpeza profissional entre estadias', proprio: false, nosso: true },
  { item: 'Manutenção emergencial com prestadores próprios', proprio: false, nosso: true },
  { item: 'Relatório mensal com extrato em PDF', proprio: false, nosso: true },
  { item: 'Dashboard de receita e ocupação em tempo real', proprio: false, nosso: true },
  { item: 'Vistoria periódica do imóvel', proprio: false, nosso: true },
]

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-success-600"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Sim"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 1 1 1.408-1.408L8.5 12.084l6.796-6.788a1 1 0 0 1 1.408 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-danger-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Não"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Comparativo() {
  return (
    <section id="comparativo" className="bg-sand-50 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Comparativo</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Gestão própria vs. Check-in Natal
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Veja o que muda quando o operacional do seu imóvel é gerido por
            uma equipe especializada.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line bg-sand-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted sm:grid-cols-[1fr_120px_120px]">
            <span>Item</span>
            <span className="text-center">Gestão própria</span>
            <span className="text-center text-gold-700">Check-in Natal</span>
          </div>
          <ul>
            {LINHAS.map((linha, idx) => (
              <li
                key={linha.item}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-4 text-sm text-ink sm:grid-cols-[1fr_120px_120px] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-sand-50/60'
                }`}
              >
                <span>{linha.item}</span>
                <span className="flex justify-center">
                  {linha.proprio ? <CheckIcon /> : <XIcon />}
                </span>
                <span className="flex justify-center">
                  {linha.nosso ? <CheckIcon /> : <XIcon />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
