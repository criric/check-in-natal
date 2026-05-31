'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TipoImovel, type SimuladorResultado } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'
import { BAIRROS_NATAL } from './bairros'

const TIPO_LABEL: Record<TipoImovel, string> = {
  [TipoImovel.Apartamento]: 'Apartamento',
  [TipoImovel.Casa]: 'Casa',
  [TipoImovel.Quarto]: 'Quarto',
  [TipoImovel.Studio]: 'Studio',
  [TipoImovel.Cobertura]: 'Cobertura',
}

const SELECT_CLS =
  'h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink shadow-xs transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200'

export function Simulador() {
  const [bairros, setBairros] = useState<string[]>([...BAIRROS_NATAL])
  const [bairro, setBairro] = useState<string>(BAIRROS_NATAL[0])
  const [tipo, setTipo] = useState<TipoImovel>(TipoImovel.Apartamento)
  const [capacidade, setCapacidade] = useState<number>(4)
  const [resultado, setResultado] = useState<SimuladorResultado>()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | undefined>()

  useEffect(() => {
    fetch('/api/simulador')
      .then((r) => r.json())
      .then((data: { bairros?: string[] }) => {
        if (data.bairros && data.bairros.length > 0) {
          setBairros(data.bairros)
          if (!data.bairros.includes(bairro)) {
            setBairro(data.bairros[0])
          }
        }
      })
      .catch(() => {})
    // intencional: rodar apenas no mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function simular(e: React.FormEvent) {
    e.preventDefault()
    setErro(undefined)
    setCarregando(true)
    try {
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bairro, tipo_imovel: tipo, capacidade }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error ?? 'Erro ao simular')
        return
      }
      setResultado(json as SimuladorResultado)
    } catch {
      setErro('Erro de rede')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section id="simulador" className="bg-sand-100 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Simulador</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Quanto seu imóvel pode render?
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Estimativa baseada em dados reais dos nossos imóveis em Natal. Para
            uma projeção precisa, fale com a nossa equipe.
          </p>
        </div>

        <Card className="mx-auto mt-12 max-w-3xl p-8 shadow-md">
          <form onSubmit={simular} className="grid gap-5 md:grid-cols-3">
            <Field label="Bairro" required>
              {({ id, describedBy }) => (
                <select
                  id={id}
                  aria-describedby={describedBy}
                  className={SELECT_CLS}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                >
                  {bairros.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Tipo" required>
              {({ id, describedBy }) => (
                <select
                  id={id}
                  aria-describedby={describedBy}
                  className={SELECT_CLS}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoImovel)}
                >
                  {Object.values(TipoImovel).map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Capacidade de hóspedes" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  min={1}
                  max={20}
                  value={capacidade}
                  onChange={(e) =>
                    setCapacidade(Number(e.target.value) || 1)
                  }
                />
              )}
            </Field>

            <div className="md:col-span-3">
              <Button
                type="submit"
                size={ButtonSize.Lg}
                variant={ButtonVariant.Primary}
                loading={carregando}
                fullWidth
              >
                Simular receita
              </Button>
            </div>
          </form>

          {erro ? (
            <p className="mt-4 text-center text-sm text-red-600">{erro}</p>
          ) : null}

          {resultado ? (
            <div
              className="mt-8 rounded-lg border border-gold-200 bg-gold-50 p-6 text-center"
              aria-live="polite"
            >
              <p className="text-eyebrow text-gold-700">Estimativa mensal</p>
              <p className="mt-2 font-display text-3xl text-navy-700 sm:text-4xl">
                {formatCurrency(resultado.estimativa_min)} —{' '}
                {formatCurrency(resultado.estimativa_max)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-ink-muted sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-gold-700">Ocupação</p>
                  <p className="font-semibold text-navy-700">
                    {resultado.taxa_ocupacao_estimada}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gold-700">Diária média</p>
                  <p className="font-semibold text-navy-700">
                    {formatCurrency(resultado.ticket_medio_estimado)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs uppercase text-gold-700">Média mensal</p>
                  <p className="font-semibold text-navy-700">
                    {formatCurrency(resultado.media_mensal)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                Valores estimados com base no histórico de imóveis similares na
                região. Resultado real pode variar.
              </p>
              <a
                href="#contato"
                className="mt-4 inline-block text-sm font-semibold text-gold-700 hover:text-gold-800"
              >
                Quero uma análise personalizada →
              </a>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  )
}
