import { requireAdmin } from '@/lib/actions/_guards'
import { getManutencoes } from '@/lib/actions/manutencoes'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import {
  ManutencoesClient,
  type ImovelOpt,
  type ManutencaoItem,
} from '@/components/admin/manutencoes/manutencoes-client'
import { StatusManutencao, UrgenciaManutencao } from '@/types'

export const dynamic = 'force-dynamic'

type Search = { tab?: string }

type ManutencaoRaw = {
  id: string
  descricao: string
  urgencia: UrgenciaManutencao
  status: StatusManutencao
  tipo?: string | null
  prestador_nome?: string | null
  prestador_contato?: string | null
  custo_estimado?: number | string | null
  custo_real?: number | string | null
  data_abertura: string
  data_resolucao?: string | null
  observacoes?: string | null
  observacao_proprietario?: string | null
  aprovacao_proprietario?: boolean | null
  fotos_antes: string[] | null
  fotos_depois: string[] | null
  imovel: {
    id: string
    nome_interno: string
    proprietario: { id: string; nome: string; email: string }
  }
}

export default async function ManutencoesPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const g = await requireAdmin()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Manutenções" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {g.error}
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const tab = sp.tab ?? 'todas'

  const res = await getManutencoes()
  const todasRaw = (res.data ?? []) as ManutencaoRaw[]

  const manutencoes: ManutencaoItem[] = todasRaw.map((m) => ({
    id: m.id,
    descricao: m.descricao,
    urgencia: m.urgencia,
    status: m.status,
    tipo: m.tipo ?? undefined,
    prestador_nome: m.prestador_nome ?? undefined,
    prestador_contato: m.prestador_contato ?? undefined,
    custo_estimado: m.custo_estimado != null ? Number(m.custo_estimado) : undefined,
    custo_real: m.custo_real != null ? Number(m.custo_real) : undefined,
    data_abertura: m.data_abertura,
    data_resolucao: m.data_resolucao ?? undefined,
    observacoes: m.observacoes ?? undefined,
    observacao_proprietario: m.observacao_proprietario ?? undefined,
    aprovacao_proprietario: m.aprovacao_proprietario ?? undefined,
    fotos_antes: m.fotos_antes ?? [],
    fotos_depois: m.fotos_depois ?? [],
    imovel: m.imovel,
  }))

  const supabase = await createClient()
  const { data: imoveisRaw } = await supabase
    .from('imoveis')
    .select('id, nome_interno, bairro')
    .order('nome_interno', { ascending: true })

  const imoveis: ImovelOpt[] = (imoveisRaw ?? []).map((i) => ({
    id: String(i.id),
    nome_interno: String(i.nome_interno),
    bairro: String(i.bairro),
  }))

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Manutenções"
        descricao="Chamados, prestadores e o fluxo de aprovação do proprietário."
      />

      <ManutencoesClient
        manutencoes={manutencoes}
        imoveis={imoveis}
        tabInicial={tab}
      />
    </div>
  )
}
