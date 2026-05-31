import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { Sparkles } from 'lucide-react'
import { requireAdmin } from '@/lib/actions/_guards'
import { getLimpezas } from '@/lib/actions/limpezas'
import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  LimpezasClient,
  type LimpezaItem,
  type ImovelOpt,
  type ReservaOpt,
} from '@/components/admin/limpezas/limpezas-client'
import { StatusLimpeza, StatusReserva } from '@/types'

export const dynamic = 'force-dynamic'

type Search = { data?: string; mes?: string; modo?: string }

type LimpezaRaw = {
  id: string
  data_agendada: string
  data_inicio?: string | null
  data_conclusao?: string | null
  duracao_minutos?: number | null
  status: StatusLimpeza
  responsavel?: string | null
  observacoes?: string | null
  checklist: Record<string, boolean>
  fotos?: string[] | null
  reserva_id?: string | null
  imovel: { id: string; nome_interno: string; bairro: string }
  reserva?: {
    id: string
    nome_hospede?: string | null
    data_checkin: string
    data_checkout: string
  } | null
}

function isoDay(s: string) {
  return s.slice(0, 10)
}

export default async function LimpezasPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const g = await requireAdmin()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Limpezas" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {g.error}
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const hojeStr = format(new Date(), 'yyyy-MM-dd')
  const dataSel = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : hojeStr
  const mesSel = sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : dataSel.slice(0, 7)

  const refMes = parseISO(`${mesSel}-01`)
  const inicioMes = format(startOfMonth(refMes), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(refMes), 'yyyy-MM-dd')

  const limpezasRes = await getLimpezas({
    data_inicio: `${inicioMes}T00:00:00.000Z`,
    data_fim: `${fimMes}T23:59:59.999Z`,
    limit: 500,
  })
  const todasMes = (limpezasRes.data ?? []) as LimpezaRaw[]

  const limpezas: LimpezaItem[] = todasMes.map((l) => ({
    id: l.id,
    data_agendada: l.data_agendada,
    data_inicio: l.data_inicio ?? undefined,
    data_conclusao: l.data_conclusao ?? undefined,
    duracao_minutos: l.duracao_minutos ?? undefined,
    status: l.status,
    responsavel: l.responsavel ?? undefined,
    observacoes: l.observacoes ?? undefined,
    checklist: l.checklist ?? {},
    fotos: l.fotos ?? [],
    reserva_id: l.reserva_id ?? undefined,
    imovel: l.imovel,
    reserva: l.reserva
      ? {
          id: l.reserva.id,
          nome_hospede: l.reserva.nome_hospede ?? undefined,
          data_checkin: l.reserva.data_checkin,
          data_checkout: l.reserva.data_checkout,
        }
      : undefined,
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

  const { data: reservasRaw } = await supabase
    .from('reservas')
    .select('id, imovel_id, nome_hospede, data_checkin, data_checkout, status')
    .gte('data_checkin', hojeStr)
    .neq('status', StatusReserva.Cancelada)
    .neq('status', StatusReserva.NoShow)
    .order('data_checkin', { ascending: true })
    .limit(200)

  const reservasProximas: ReservaOpt[] = (reservasRaw ?? []).map((r) => ({
    id: String(r.id),
    imovel_id: String(r.imovel_id),
    nome_hospede: (r.nome_hospede as string | null) ?? undefined,
    data_checkin: String(r.data_checkin),
    data_checkout: String(r.data_checkout),
  }))

  const limpezasDoDia = limpezas.filter((l) => isoDay(l.data_agendada) === dataSel)
  const totalDia = limpezasDoDia.length
  const concluidasDia = limpezasDoDia.filter(
    (l) => l.status === StatusLimpeza.Concluida,
  ).length
  const emAndamentoDia = limpezasDoDia.filter(
    (l) => l.status === StatusLimpeza.EmAndamento,
  ).length
  const pendentesDia = totalDia - concluidasDia - emAndamentoDia

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Limpezas"
        descricao="Controle as limpezas agendadas, em andamento e concluídas — por dia ou por mês."
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total no dia"
          valor={String(totalDia)}
          descricao={format(parseISO(dataSel), "dd/MM/yyyy")}
          icone={<Sparkles aria-hidden />}
        />
        <KpiCard
          titulo="Agendadas"
          valor={String(pendentesDia)}
          descricao="Aguardando início"
        />
        <KpiCard
          titulo="Em andamento"
          valor={String(emAndamentoDia)}
          descricao="Equipe trabalhando agora"
        />
        <KpiCard
          titulo="Concluídas"
          valor={String(concluidasDia)}
          descricao={`${totalDia > 0 ? Math.round((concluidasDia / totalDia) * 100) : 0}% do dia`}
        />
      </section>

      <LimpezasClient
        limpezas={limpezas}
        imoveis={imoveis}
        reservasProximas={reservasProximas}
        dataSelecionada={dataSel}
        mesSelecionado={mesSel}
        modoInicial={sp.modo === 'calendario' ? 'calendario' : 'lista'}
      />
    </div>
  )
}
