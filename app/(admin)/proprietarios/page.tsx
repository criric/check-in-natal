import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  ProprietariosGrid,
  type ProprietarioCardData,
} from '@/components/admin/proprietarios/proprietarios-grid'
import { Button, ButtonVariant } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { getProprietarios } from '@/lib/actions/proprietarios'
import { StatusContrato } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProprietariosPage() {
  const res = await getProprietarios()

  if (res.error || !res.data) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Proprietários" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {res.error ?? 'Erro ao carregar proprietários'}
        </p>
      </div>
    )
  }

  const dados: ProprietarioCardData[] = res.data.map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    cpf_cnpj: p.cpf_cnpj,
    telefone: p.telefone,
    cidade_residencia: null,
    estado_residencia: null,
    status_contrato: p.status_contrato as StatusContrato,
    num_imoveis_ativos: p.num_imoveis_ativos,
  }))

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Proprietários"
        descricao="Carteira de proprietários, contratos e métricas agregadas."
        acoes={
          <Link href="/proprietarios/novo">
            <Button
              variant={ButtonVariant.Primary}
              leadingIcon={<Plus className="h-4 w-4" />}
            >
              Novo proprietário
            </Button>
          </Link>
        }
      />
      <ProprietariosGrid proprietarios={dados} />
    </div>
  )
}
