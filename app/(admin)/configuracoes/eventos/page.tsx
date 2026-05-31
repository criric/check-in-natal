import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/actions/_guards'
import { getEventosSazonais } from '@/lib/actions/precificacao'
import { PageHeader } from '@/components/ui/page-header'
import type { EventoSazonal } from '@/types'
import { EventosClient } from './eventos-client'

export const dynamic = 'force-dynamic'

export default async function EventosSazonaisPage() {
  const g = await requireAdmin()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-[1100px] p-4 md:p-6">
        <PageHeader titulo="Eventos sazonais" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {g.error}
        </p>
      </div>
    )
  }

  const res = await getEventosSazonais()
  const eventos = (res.data ?? []) as EventoSazonal[]

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <PageHeader
        titulo="Eventos sazonais"
        descricao="Períodos com multiplicador de preço — usados pelo motor de precificação dinâmica."
        breadcrumb={
          <Link
            href="/configuracoes"
            className="inline-flex items-center gap-1 text-ink-muted hover:text-navy-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Configurações
          </Link>
        }
      />
      <EventosClient eventos={eventos} />
    </div>
  )
}
