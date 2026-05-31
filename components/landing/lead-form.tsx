'use client'

import { useState } from 'react'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { LeadSchema, type LeadInput } from '@/lib/validations'
import { BAIRROS_NATAL } from './bairros'

enum EstadoEnvio {
  Inicial = 'inicial',
  Enviando = 'enviando',
  Sucesso = 'sucesso',
  Erro = 'erro',
}

const SELECT_CLS =
  'h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink shadow-xs transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200'

const VALOR_INICIAL: LeadInput = {
  nome: '',
  telefone: '',
  email: '',
  bairro_imovel: '',
  mensagem: '',
}

export function LeadForm() {
  const [valores, setValores] = useState<LeadInput>(VALOR_INICIAL)
  const [estado, setEstado] = useState<EstadoEnvio>(EstadoEnvio.Inicial)
  const [erro, setErro] = useState<string>()
  const [erros, setErros] = useState<Partial<Record<keyof LeadInput, string>>>(
    {},
  )

  function atualizar<K extends keyof LeadInput>(campo: K, valor: LeadInput[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(undefined)
    setErros({})

    const parsed = LeadSchema.safeParse({
      ...valores,
      bairro_imovel: valores.bairro_imovel || undefined,
      mensagem: valores.mensagem || undefined,
    })
    if (!parsed.success) {
      const novos: Partial<Record<keyof LeadInput, string>> = {}
      for (const err of parsed.error.errors) {
        const campo = err.path[0] as keyof LeadInput
        if (campo && !novos[campo]) novos[campo] = err.message
      }
      setErros(novos)
      return
    }

    setEstado(EstadoEnvio.Enviando)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error ?? 'Erro ao enviar')
        setEstado(EstadoEnvio.Erro)
        return
      }
      setEstado(EstadoEnvio.Sucesso)
      setValores(VALOR_INICIAL)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setEstado(EstadoEnvio.Erro)
    }
  }

  if (estado === EstadoEnvio.Sucesso) {
    return (
      <Card className="mx-auto max-w-2xl p-10 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
          <svg
            className="h-7 w-7 text-success-700"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 0 1 1.408-1.408L8.5 12.084l6.796-6.788a1 1 0 0 1 1.408 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="font-display text-2xl text-navy-700">
          Recebemos seu contato!
        </h3>
        <p className="mt-3 text-sm text-ink-muted">
          Em até 1 dia útil um especialista entra em contato pelo WhatsApp.
        </p>
        <Button
          className="mt-6"
          variant={ButtonVariant.Outline}
          onClick={() => setEstado(EstadoEnvio.Inicial)}
        >
          Enviar outro contato
        </Button>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl p-8 shadow-md">
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome completo" required error={erros.nome} className="sm:col-span-2">
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              value={valores.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Como podemos te chamar?"
              autoComplete="name"
              invalid={invalid}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>

        <Field label="Telefone (WhatsApp)" required error={erros.telefone}>
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              value={valores.telefone}
              onChange={(e) => atualizar('telefone', e.target.value)}
              placeholder="(84) 99999-9999"
              autoComplete="tel"
              invalid={invalid}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>

        <Field label="E-mail" error={erros.email}>
          {({ id, invalid, describedBy }) => (
            <Input
              id={id}
              type="email"
              value={valores.email ?? ''}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              invalid={invalid}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Field label="Bairro do imóvel" className="sm:col-span-2" error={erros.bairro_imovel}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className={SELECT_CLS}
              value={valores.bairro_imovel ?? ''}
              onChange={(e) => atualizar('bairro_imovel', e.target.value)}
            >
              <option value="">Selecione o bairro…</option>
              {BAIRROS_NATAL.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="outro">Outro bairro</option>
            </select>
          )}
        </Field>

        <Field label="Mensagem (opcional)" className="sm:col-span-2" error={erros.mensagem}>
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              className="min-h-[110px] w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink shadow-xs transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200"
              value={valores.mensagem ?? ''}
              onChange={(e) => atualizar('mensagem', e.target.value)}
              placeholder="Conte um pouco sobre o imóvel ou o que você está buscando."
            />
          )}
        </Field>

        {erro ? (
          <p
            role="alert"
            className="sm:col-span-2 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {erro}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            size={ButtonSize.Lg}
            fullWidth
            loading={estado === EstadoEnvio.Enviando}
          >
            {estado === EstadoEnvio.Enviando ? 'Enviando…' : 'Quero ser contatado'}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Resposta em até 1 dia útil. Sem spam.
          </p>
        </div>
      </form>
    </Card>
  )
}
