'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Mail } from 'lucide-react'
import { toast } from 'sonner'
import {
  loginAdmin,
  sendPasswordReset,
} from '@/lib/actions/auth'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { getAppUrl } from '@/lib/utils/app-url'

enum AuthTab {
  Admin = 'admin',
  Proprietario = 'proprietario',
}

export function LoginForm() {
  return (
    <Tabs defaultValue={AuthTab.Admin} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value={AuthTab.Admin} className="justify-center">
          Administrador
        </TabsTrigger>
        <TabsTrigger value={AuthTab.Proprietario} className="justify-center">
          Proprietário
        </TabsTrigger>
      </TabsList>

      <TabsContent value={AuthTab.Admin}>
        <AdminForm />
      </TabsContent>

      <TabsContent value={AuthTab.Proprietario}>
        <ProprietarioForm />
      </TabsContent>
    </Tabs>
  )
}

function AdminForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(undefined)
    setLoading(true)

    const res = await loginAdmin(email, senha)
    if (res.error || !res.data) {
      setErro(res.error ?? 'Falha ao entrar')
      setLoading(false)
      return
    }

    router.replace(res.data.redirectTo)
    router.refresh()
  }

  async function handleForgotPassword() {
    if (!email) {
      setErro('Informe seu e-mail acima para recuperar a senha')
      return
    }
    setErro(undefined)
    setResetting(true)
    const res = await sendPasswordReset(email)
    setResetting(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Enviamos um link de recuperação para seu e-mail.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="E-mail" required>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={invalid}
            placeholder="voce@email.com"
          />
        )}
      </Field>

      <Field label="Senha" required>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            invalid={invalid}
            placeholder="••••••••"
          />
        )}
      </Field>

      <div className="-mt-1 text-right">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetting}
          className="text-xs font-medium text-gold-700 transition-colors hover:text-gold-800 disabled:opacity-60"
        >
          {resetting ? 'Enviando…' : 'Esqueceu a senha?'}
        </button>
      </div>

      {erro ? (
        <p
          role="alert"
          className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700"
        >
          {erro}
        </p>
      ) : null}

      <Button
        type="submit"
        size={ButtonSize.Lg}
        fullWidth
        loading={loading}
        leadingIcon={<KeyRound className="h-4 w-4" aria-hidden />}
        className="mt-1"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function ProprietarioForm() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(undefined)
    setLoading(true)

    // 1. Valida server-side se o e-mail pertence a um proprietário.
    const res = await fetch('/api/auth/validate-proprietario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Falha ao validar o e-mail')
      setLoading(false)
      return
    }

    // 2. Envia o magic link a partir do BROWSER.
    //    O SDK do Supabase armazena o code_verifier (PKCE) nos cookies
    //    locais antes de enviar o e-mail. Isso é obrigatório para que
    //    exchangeCodeForSession funcione quando o usuário clicar no link.
    const supabase = createClient()
    const redirectTo = `${getAppUrl()}/magic-link`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    setLoading(false)

    if (error) {
      setErro(error.message)
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-card border border-line bg-sand-50 px-4 py-8 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-700">
          <Mail className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-lg text-navy-700">
            Verifique seu e-mail
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Enviamos um link de acesso para{' '}
            <span className="font-medium text-navy-700">{email}</span>. Abra-o
            neste dispositivo para entrar no portal.
          </p>
        </div>
        <Button
          type="button"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={() => {
            setEnviado(false)
            setEmail('')
          }}
        >
          Usar outro e-mail
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Informe o e-mail cadastrado e enviaremos um link seguro de acesso ao
        portal — sem senha.
      </p>

      <Field label="E-mail" required>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={invalid}
            placeholder="voce@email.com"
          />
        )}
      </Field>

      {erro ? (
        <p
          role="alert"
          className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700"
        >
          {erro}
        </p>
      ) : null}

      <Button
        type="submit"
        size={ButtonSize.Lg}
        fullWidth
        loading={loading}
        leadingIcon={<Mail className="h-4 w-4" aria-hidden />}
        className="mt-1"
      >
        {loading ? 'Enviando…' : 'Receber link de acesso'}
      </Button>
    </form>
  )
}
