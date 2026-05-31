import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { requireAdmin } from '@/lib/actions/_guards'
import {
  getEventosAtivosNoPeriodo,
  getSugestoesPreco,
} from '@/lib/actions/precificacao'
import { createClient } from '@/lib/supabase/server'
import type { CalendarioPrecos, EventoSazonal } from '@/types'
import { PrecosClient } from './precos-client'

export const dynamic = 'force-dynamic'

type Params = { id: string }
type Search = { mes?: string; ano?: string }

export default async function PrecosImovelPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const g = await requireAdmin()
  if (!g.ok) {
    return <div className="p-6 text-red-600">{g.error}</div>
  }

  const { id } = await params
  const sp = await searchParams
  const hoje = new Date()
  const mesSel = sp.mes ? Number(sp.mes) : hoje.getMonth() + 1
  const anoSel = sp.ano ? Number(sp.ano) : hoje.getFullYear()
  const base = new Date(anoSel, mesSel - 1, 1)
  const dataInicio = format(startOfMonth(base), 'yyyy-MM-dd')
  const dataFim = format(endOfMonth(addMonths(base, 2)), 'yyyy-MM-dd')

  const supabase = await createClient()
  const { data: imovel } = await supabase
    .from('imoveis')
    .select('id, nome_interno, bairro, tipo, capacidade_hospedes')
    .eq('id', id)
    .maybeSingle()

  if (!imovel) {
    return <div className="p-6 text-red-600">Imóvel não encontrado</div>
  }

  const sugRes = await getSugestoesPreco(id, dataInicio, dataFim)
  const calendario = (sugRes.data ?? []) as CalendarioPrecos[]
  const eventos = await getEventosAtivosNoPeriodo(dataInicio, dataFim)

  const precoBase = calendario.length
    ? Math.round(
        calendario.reduce((s, c) => s + c.preco_sugerido, 0) / calendario.length,
      )
    : 0

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Preços · {imovel.nome_interno}
          </h1>
          <p className="text-sm text-gray-600">
            {imovel.bairro} · {imovel.tipo} · {imovel.capacidade_hospedes} hóspedes
          </p>
        </div>
        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          Preço médio sugerido: <strong>R$ {precoBase}/noite</strong>
        </div>
      </header>

      <PrecosClient
        imovelId={id}
        calendario={calendario}
        eventos={eventos as EventoSazonal[]}
        mesAtual={mesSel}
        anoAtual={anoSel}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </main>
  )
}
