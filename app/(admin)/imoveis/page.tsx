import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TabelaImoveis } from '@/components/admin/dashboard/tabela-imoveis'
import { Button, ButtonVariant } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { getDashboardData } from '@/lib/actions/dashboard'

export const dynamic = 'force-dynamic'

export default async function ImoveisPage() {
  const res = await getDashboardData()

  if (res.error || !res.data) {
    return (
      <div className="p-6">
        <p className="text-danger-700">Erro: {res.error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Imóveis"
        descricao="Gestão da carteira de imóveis."
        acoes={
          <Link href="/imoveis/novo">
            <Button
              variant={ButtonVariant.Primary}
              leadingIcon={<Plus className="h-4 w-4" />}
            >
              Novo imóvel
            </Button>
          </Link>
        }
      />
      <TabelaImoveis imoveis={res.data.imoveis} />
    </div>
  )
}
