import { notFound } from 'next/navigation'
import { ProprietarioForm } from '@/components/admin/proprietarios/proprietario-form'
import { PageHeader } from '@/components/ui/page-header'
import { getProprietarioById } from '@/lib/actions/proprietarios'
import { StatusContrato } from '@/types'

export const dynamic = 'force-dynamic'

type Raw = {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string | null
  cidade_residencia?: string | null
  estado_residencia?: string | null
  status_contrato: StatusContrato
  observacoes?: string | null
}

export default async function EditarProprietarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getProprietarioById(id)
  if (res.error || !res.data) notFound()
  const p = res.data as Raw

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <PageHeader
        titulo="Editar proprietário"
        descricao={p.nome}
      />
      <ProprietarioForm
        modo="editar"
        proprietarioId={id}
        defaultValues={{
          nome: p.nome,
          email: p.email,
          cpf_cnpj: p.cpf_cnpj,
          telefone: p.telefone ?? undefined,
          cidade_residencia: p.cidade_residencia ?? undefined,
          estado_residencia: p.estado_residencia ?? undefined,
          status_contrato: p.status_contrato,
          observacoes: p.observacoes ?? undefined,
        }}
      />
    </div>
  )
}
