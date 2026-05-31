import { PageHeader } from '@/components/ui/page-header'
import {
  RepassesClient,
  type ImovelOpt,
  type ProprietarioOpt,
  type RepasseItem,
} from '@/components/admin/repasses/repasses-client'
import { getRepasses } from '@/lib/actions/repasses'
import { getImoveis } from '@/lib/actions/imoveis'
import { getProprietarios } from '@/lib/actions/proprietarios'
import { StatusImovel, StatusRepasse } from '@/types'

export const dynamic = 'force-dynamic'

type RepasseRaw = {
  id: string
  competencia_mes: number
  competencia_ano: number
  receita_bruta: number | string
  comissao_gestora: number | string
  deducoes_manutencao: number | string | null
  deducoes_outros: number | string | null
  valor_repassado: number | string
  status: StatusRepasse
  data_repasse?: string | null
  pdf_url?: string | null
  observacoes?: string | null
  created_at: string
  proprietario: { id: string; nome: string; email: string }
  imovel: { id: string; nome_interno: string; bairro: string }
}

type ImovelRaw = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number | string
  proprietario: { id: string; nome: string; email: string }
}

type ProprietarioRaw = {
  id: string
  nome: string
}

export default async function RepassesPage() {
  const [repassesRes, imoveisRes, proprietariosRes] = await Promise.all([
    getRepasses(),
    getImoveis(),
    getProprietarios(),
  ])

  if (repassesRes.error) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Repasses" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {repassesRes.error}
        </p>
      </div>
    )
  }

  const repasses: RepasseItem[] = ((repassesRes.data ?? []) as RepasseRaw[]).map(
    (r) => ({
      id: r.id,
      competencia_mes: r.competencia_mes,
      competencia_ano: r.competencia_ano,
      receita_bruta: Number(r.receita_bruta),
      comissao_gestora: Number(r.comissao_gestora),
      deducoes_manutencao:
        r.deducoes_manutencao != null ? Number(r.deducoes_manutencao) : 0,
      deducoes_outros:
        r.deducoes_outros != null ? Number(r.deducoes_outros) : 0,
      valor_repassado: Number(r.valor_repassado),
      status: r.status,
      data_repasse: r.data_repasse ?? undefined,
      pdf_url: r.pdf_url ?? undefined,
      observacoes: r.observacoes ?? undefined,
      proprietario: r.proprietario,
      imovel: r.imovel,
    }),
  )

  const imoveis: ImovelOpt[] = ((imoveisRes.data ?? []) as ImovelRaw[])
    .filter((i) => i.status !== StatusImovel.Inativo)
    .map((i) => ({
      id: i.id,
      nome_interno: i.nome_interno,
      bairro: i.bairro,
      comissao_percentual: Number(i.comissao_percentual),
      proprietario_nome: i.proprietario.nome,
      proprietario_id: i.proprietario.id,
    }))

  const proprietarios: ProprietarioOpt[] = (
    (proprietariosRes.data ?? []) as ProprietarioRaw[]
  ).map((p) => ({ id: p.id, nome: p.nome }))

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Repasses"
        descricao="Cálculo, emissão e acompanhamento dos repasses mensais aos proprietários."
      />
      <RepassesClient
        repasses={repasses}
        imoveis={imoveis}
        proprietarios={proprietarios}
      />
    </div>
  )
}
