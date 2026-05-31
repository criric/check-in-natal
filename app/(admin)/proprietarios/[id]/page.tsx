import { notFound } from 'next/navigation'
import {
  ProprietarioDetalheClient,
  type ProprietarioDetalhe,
  type ProprietarioImovelResumo,
  type ProprietarioRepasseResumo,
} from '@/components/admin/proprietarios/detalhe-client'
import { PageHeader } from '@/components/ui/page-header'
import { getProprietarioById } from '@/lib/actions/proprietarios'
import { StatusContrato, StatusImovel, StatusRepasse } from '@/types'

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
  data_entrada?: string | null
  observacoes?: string | null
  imoveis?: Array<{
    id: string
    nome_interno: string
    bairro: string
    status: StatusImovel
    comissao_percentual: number
  }>
  repasses?: Array<{
    id: string
    competencia_mes: number
    competencia_ano: number
    valor_repassado: number
    status: StatusRepasse
  }>
  metricas: {
    total_imoveis: number
    imoveis_ativos: number
    total_repassado: number
  }
}

export default async function ProprietarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getProprietarioById(id)
  if (res.error || !res.data) notFound()

  const raw = res.data as Raw

  const imoveis: ProprietarioImovelResumo[] = (raw.imoveis ?? []).map((i) => ({
    id: i.id,
    nome_interno: i.nome_interno,
    bairro: i.bairro,
    status: i.status,
    comissao_percentual: Number(i.comissao_percentual),
  }))

  const repasses: ProprietarioRepasseResumo[] = (raw.repasses ?? []).map(
    (r) => ({
      id: r.id,
      competencia_mes: r.competencia_mes,
      competencia_ano: r.competencia_ano,
      valor_repassado: Number(r.valor_repassado),
      status: r.status,
    }),
  )

  const detalhe: ProprietarioDetalhe = {
    id: raw.id,
    nome: raw.nome,
    email: raw.email,
    cpf_cnpj: raw.cpf_cnpj,
    telefone: raw.telefone,
    cidade_residencia: raw.cidade_residencia,
    estado_residencia: raw.estado_residencia,
    status_contrato: raw.status_contrato,
    data_entrada: raw.data_entrada,
    observacoes: raw.observacoes,
    imoveis,
    repasses,
    metricas: raw.metricas,
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Detalhes do proprietário"
        descricao="Dados cadastrais, imóveis vinculados e histórico de repasses."
        breadcrumb={
          <span>
            <a href="/proprietarios" className="hover:text-navy-700">
              Proprietários
            </a>
            {' / '}
            {detalhe.nome}
          </span>
        }
      />
      <ProprietarioDetalheClient proprietario={detalhe} />
    </div>
  )
}
