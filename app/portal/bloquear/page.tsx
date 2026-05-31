import { createClient } from '@/lib/supabase/server'
import { requireProprietario } from '@/lib/actions/_guards'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarOff } from 'lucide-react'
import { BloquearCalendarioClient } from './bloquear-client'

export const dynamic = 'force-dynamic'

export default async function BloquearPage({
  searchParams,
}: {
  searchParams: { imovel?: string }
}) {
  const g = await requireProprietario()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {g.error}
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, nome_interno, bairro')
    .eq('proprietario_id', g.user.proprietario_id!)
    .order('nome_interno', { ascending: true })

  const lista = imoveis ?? []
  const imovelInicial =
    searchParams.imovel && lista.some((i) => i.id === searchParams.imovel)
      ? searchParams.imovel
      : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Bloquear datas"
        descricao="Reserve dias para uso próprio, reforma ou outra finalidade"
      />

      {lista.length === 0 ? (
        <EmptyState
          icone={<CalendarOff className="h-12 w-12" aria-hidden />}
          titulo="Nenhum imóvel vinculado"
          descricao="Para bloquear datas você precisa ter ao menos um imóvel cadastrado em seu nome."
        />
      ) : (
        <BloquearCalendarioClient
          imoveis={lista}
          imovelInicial={imovelInicial}
        />
      )}
    </div>
  )
}
