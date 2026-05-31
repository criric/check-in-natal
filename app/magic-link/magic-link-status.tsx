'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonSize } from '@/components/ui/button'
import { MagicLinkState } from './magic-link-state'

export function MagicLinkStatus({
  initialState,
}: {
  initialState: MagicLinkState
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<MagicLinkState>(initialState)

  useEffect(() => {
    if (initialState !== MagicLinkState.Checking) return

    let cancelled = false
    const supabase = createClient()

    function goToPortal() {
      router.replace('/portal')
      router.refresh()
    }

    async function verify() {
      const code = searchParams.get('code')

      // Fluxo PKCE: troca o código (na query) por uma sessão; o client do
      // browser persiste os cookies que o servidor lê em seguida.
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (!error && data.session) {
          goToPortal()
          return
        }
        setState(MagicLinkState.Error)
        return
      }

      // Fluxo implícito (token no hash): o supabase-js processa a URL no init.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        goToPortal()
      } else {
        setState(MagicLinkState.Error)
      }
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [initialState, router, searchParams])

  if (state === MagicLinkState.Checking) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 text-center"
      >
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" aria-hidden />
        <div>
          <p className="font-display text-xl text-navy-700">Validando acesso</p>
          <p className="mt-1 text-sm text-ink-muted">
            Aguarde enquanto confirmamos seu link de acesso…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <p className="font-display text-xl text-navy-700">
          Link expirado ou inválido
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Este link de acesso não é mais válido. Solicite um novo para entrar no
          portal.
        </p>
      </div>
      <Button
        type="button"
        size={ButtonSize.Lg}
        className="mt-2"
        onClick={() => router.push('/login')}
      >
        Solicitar novo link
      </Button>
    </div>
  )
}
