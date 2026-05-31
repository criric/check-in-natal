import { ImovelForm, type ProprietarioOption } from '@/components/admin/imoveis/imovel-form'
import { PageHeader } from '@/components/ui/page-header'
import { getProprietarios } from '@/lib/actions/proprietarios'

export const dynamic = 'force-dynamic'

export default async function NovoImovelPage() {
  const res = await getProprietarios()
  const proprietarios: ProprietarioOption[] = (res.data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
  }))

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Novo imóvel"
        descricao="Preencha os dados em todas as seções abaixo."
      />
      <ImovelForm modo="novo" proprietarios={proprietarios} />
    </div>
  )
}
