import { ProprietarioForm } from '@/components/admin/proprietarios/proprietario-form'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default function NovoProprietarioPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <PageHeader
        titulo="Novo proprietário"
        descricao="Cadastre um novo proprietário. O magic link de acesso é enviado por e-mail automaticamente."
      />
      <ProprietarioForm modo="novo" />
    </div>
  )
}
