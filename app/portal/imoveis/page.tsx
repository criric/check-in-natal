import { Building2 } from 'lucide-react'
import { getImoveisDoProprietario } from '@/lib/actions/portal'
import { ImovelCardPortal } from '@/components/proprietario/imovel-card-portal'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function PortalImoveisPage() {
  const res = await getImoveisDoProprietario()
  const imoveis = res.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Meus imóveis"
        descricao="Visão da sua carteira e desempenho deste mês"
      />

      {res.error ? (
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error}
        </div>
      ) : null}

      {imoveis.length === 0 ? (
        <EmptyState
          icone={<Building2 className="h-12 w-12" aria-hidden />}
          titulo="Nenhum imóvel cadastrado"
          descricao="Quando um imóvel for vinculado à sua conta ele aparecerá aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((i) => (
            <ImovelCardPortal key={i.id} imovel={i} />
          ))}
        </div>
      )}
    </div>
  )
}
