'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

type Pergunta = {
  q: string
  a: string
}

const PERGUNTAS: Pergunta[] = [
  {
    q: 'Qual é a comissão cobrada pela gestão?',
    a: 'Trabalhamos com comissão padrão de 20% sobre a receita bruta, sem mensalidade fixa. Esse percentual pode variar conforme o imóvel e o plano contratado.',
  },
  {
    q: 'Existe contrato de fidelidade?',
    a: 'Não. O contrato é mensal e pode ser encerrado com aviso prévio de 30 dias. Acreditamos que resultado é o que mantém parceria.',
  },
  {
    q: 'Quem paga as despesas do imóvel?',
    a: 'Despesas fixas (condomínio, IPTU, internet) continuam por conta do proprietário. Limpeza por estadia, amenidades e pequenos reparos são cobrados do hóspede ou descontados no repasse, com extrato detalhado.',
  },
  {
    q: 'Como funciona o repasse mensal?',
    a: 'Todo mês enviamos um relatório com reservas, taxa de ocupação, despesas e valor líquido a repassar. O depósito é feito até o quinto dia útil do mês seguinte, junto com o extrato em PDF.',
  },
  {
    q: 'Em quais plataformas o imóvel é anunciado?',
    a: 'Airbnb, Booking.com, VRBO e canal direto. A precificação é sincronizada entre plataformas e calendário é unificado para evitar overbooking.',
  },
  {
    q: 'E se eu quiser usar o imóvel para mim?',
    a: 'Pelo portal do proprietário você bloqueia datas com poucos cliques. As datas bloqueadas saem do calendário em todas as plataformas automaticamente.',
  },
  {
    q: 'Quanto tempo leva para começar a receber hóspedes?',
    a: 'Em média 7 a 10 dias: visita técnica, fotos profissionais, cadastro nas plataformas e ajuste de precificação inicial.',
  },
  {
    q: 'Vocês atendem imóveis fora de Natal?',
    a: 'No momento atuamos apenas na grande Natal — Ponta Negra, Praia do Forte, Areia Preta, Tirol e bairros próximos. Mais cidades em breve.',
  },
]

export function Faq() {
  const [aberta, setAberta] = useState<number>()

  return (
    <section id="faq" className="bg-sand-50 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Perguntas frequentes</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Tudo o que você precisa saber.
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-lg border border-line bg-white shadow-sm">
          {PERGUNTAS.map((p, idx) => {
            const isOpen = aberta === idx
            return (
              <div key={p.q}>
                <button
                  type="button"
                  onClick={() => setAberta(isOpen ? undefined : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-sand-50"
                >
                  <span className="font-display text-lg text-navy-700">
                    {p.q}
                  </span>
                  <svg
                    className={cn(
                      'h-5 w-5 shrink-0 text-gold-700 transition-transform',
                      isOpen && 'rotate-180',
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isOpen ? (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-ink-muted">
                    {p.a}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
