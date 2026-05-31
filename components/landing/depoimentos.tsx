import { Card } from '@/components/ui/card'

type Depoimento = {
  nome: string
  cidade: string
  estrelas: number
  texto: string
  iniciais: string
}

const DEPOIMENTOS: Depoimento[] = [
  {
    nome: 'Marina Albuquerque',
    cidade: 'Recife, PE',
    estrelas: 5,
    iniciais: 'MA',
    texto:
      'Comprei o apartamento em Ponta Negra como investimento e morava longe. A Check-in Natal entregou tudo o que prometeu — pago meu condomínio, IPTU e ainda sobra.',
  },
  {
    nome: 'Roberto Tavares',
    cidade: 'São Paulo, SP',
    estrelas: 5,
    iniciais: 'RT',
    texto:
      'Já tinha tentado gerir pelo Airbnb sozinho e foi um caos. Em dois meses com a equipe, minha ocupação subiu de 40% para 78% e os hóspedes elogiam o atendimento.',
  },
  {
    nome: 'Helena Costa',
    cidade: 'Natal, RN',
    estrelas: 5,
    iniciais: 'HC',
    texto:
      'O que mais me impressiona é o relatório mensal: chega tudo certinho, com o extrato em PDF e o valor na conta no mesmo dia. Profissionalismo nível hoteleiro.',
  },
]

function Estrelas({ qtd }: { qtd: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${qtd} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < qtd ? 'text-gold-500' : 'text-line-strong'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 1.5l2.598 5.262 5.808.844-4.203 4.097.992 5.785L10 14.75l-5.195 2.738.992-5.785L1.594 7.606l5.808-.844L10 1.5Z" />
        </svg>
      ))}
    </div>
  )
}

export function Depoimentos() {
  return (
    <section id="depoimentos" className="bg-white py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Depoimentos</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Proprietários que dormem tranquilos.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {DEPOIMENTOS.map((d) => (
            <Card key={d.nome} className="flex h-full flex-col gap-4 p-7">
              <Estrelas qtd={d.estrelas} />
              <blockquote className="flex-1 text-base leading-relaxed text-ink">
                “{d.texto}”
              </blockquote>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-gradient font-display text-base text-sand-50">
                  {d.iniciais}
                </div>
                <div>
                  <p className="font-semibold text-navy-700">{d.nome}</p>
                  <p className="text-xs text-ink-muted">{d.cidade}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
