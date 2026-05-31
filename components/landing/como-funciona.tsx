import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type Passo = {
  numero: string
  titulo: string
  descricao: string
  icone: React.ReactNode
}

const PASSOS: Passo[] = [
  {
    numero: '01',
    titulo: 'Você assina o contrato',
    descricao:
      'Visita técnica, fotos profissionais e definição do plano de gestão. Em uma semana seu imóvel já está ativo nas plataformas.',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path d="M9 12h6M9 16h6M9 8h4" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    numero: '02',
    titulo: 'Nós cuidamos de tudo',
    descricao:
      'Precificação dinâmica, check-in 24h, limpeza profissional, manutenção, atendimento ao hóspede e gestão de avaliações.',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path
          d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"
          strokeLinecap="round"
        />
        <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18.5" cy="5.5" r="2" />
      </svg>
    ),
  },
  {
    numero: '03',
    titulo: 'Você recebe mensalmente',
    descricao:
      'Repasse pontual todo mês com extrato detalhado em PDF, dashboard de receita e ocupação em tempo real.',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path
          d="M3.5 8h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Z"
          strokeLinecap="round"
        />
        <path d="M15 14h2.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-sand-50 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Como funciona</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Três passos. Zero dor de cabeça.
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Desde a captação do primeiro hóspede até o repasse mensal, todo o
            operacional fica com a gente.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PASSOS.map((passo) => (
            <Card key={passo.numero} className="flex flex-col gap-4 p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <span className="h-6 w-6">{passo.icone}</span>
                </span>
                <span className="font-display text-2xl text-gold-500/80">
                  {passo.numero}
                </span>
              </div>
              <CardTitle>{passo.titulo}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {passo.descricao}
              </CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
