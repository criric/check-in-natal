import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { MagicLinkState } from './magic-link-state'
import { MagicLinkStatus } from './magic-link-status'

export const dynamic = 'force-dynamic'

type MagicLinkSearchParams = {
  code?: string
  error?: string
  error_description?: string
}

export default function MagicLinkPage({
  searchParams,
}: {
  searchParams: MagicLinkSearchParams
}) {
  // Erro retornado pelo provedor (ex.: link já usado/expirado) chega na query.
  // A troca do código por sessão acontece no client, que persiste os cookies.
  const initialState = searchParams.error
    ? MagicLinkState.Error
    : MagicLinkState.Checking

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-sand-gradient px-4 py-12">
      <div className="absolute inset-0 bg-grain opacity-60" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4" />
        </div>

        <Card className="p-8 shadow-md">
          <Suspense
            fallback={
              <div className="flex justify-center py-4" aria-hidden>
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-r-transparent" />
              </div>
            }
          >
            <MagicLinkStatus initialState={initialState} />
          </Suspense>
        </Card>
      </div>
    </main>
  )
}
