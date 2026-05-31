'use client'

import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils/formatters'
import { NumeroFormato, type NumeroDestaque } from './numeros-tipos'

export type NumerosProps = {
  destaques: NumeroDestaque[]
}

function formatar(valor: number, formato: NumeroFormato): string {
  if (formato === NumeroFormato.Moeda) return formatCurrency(valor)
  if (formato === NumeroFormato.Decimal) {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  }
  return Math.round(valor).toLocaleString('pt-BR')
}

function Counter({
  alvo,
  formato,
  ativo,
}: {
  alvo: number
  formato: NumeroFormato
  ativo: boolean
}) {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (!ativo) return
    if (alvo <= 0) {
      setValor(0)
      return
    }
    const duracao = 1400
    const inicio = performance.now()
    let raf = 0
    const animar = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValor(alvo * eased)
      if (t < 1) raf = requestAnimationFrame(animar)
    }
    raf = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(raf)
  }, [alvo, ativo])

  return <>{formatar(valor, formato)}</>
}

export function Numeros({ destaques }: NumerosProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setAtivo(true)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="numeros" className="bg-navy-gradient py-24 text-sand-50">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow text-gold-300">Resultados em números</span>
          <h2 className="mt-3 font-display text-3xl text-sand-50 sm:text-4xl">
            Quem confia em nós, confia nos resultados.
          </h2>
        </div>

        <div
          ref={ref}
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {destaques.map((d) => (
            <div
              key={d.label}
              className="rounded-lg border border-navy-600/60 bg-navy-800/40 p-6 backdrop-blur"
            >
              <div className="font-display text-4xl text-gold-300 sm:text-5xl">
                <Counter alvo={d.valor} formato={d.formato} ativo={ativo} />
                {d.sufixo ? (
                  <span className="ml-1 text-3xl text-gold-300/80">
                    {d.sufixo}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm uppercase tracking-[0.15em] text-sand-100/80">
                {d.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
