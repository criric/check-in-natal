import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Pencil } from 'lucide-react'
import { addMonths, differenceInCalendarDays, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { DetalheTabs } from '@/components/admin/imoveis/detalhe-tabs'
import type { ImovelVisaoGeral } from '@/components/admin/imoveis/tab-visao-geral'
import type { ReservaCal, BloqueioCal } from '@/components/admin/imoveis/tab-calendario'
import type { ReservaRow } from '@/components/admin/imoveis/tab-reservas'
import type { LimpezaRow } from '@/components/admin/imoveis/tab-limpezas'
import type { ManutencaoRow } from '@/components/admin/imoveis/tab-manutencoes'
import type { RepasseRow } from '@/components/admin/imoveis/tab-financeiro'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonVariant } from '@/components/ui/button'
import { getImovelById } from '@/lib/actions/imoveis'
import { getLimpezas } from '@/lib/actions/limpezas'
import { getManutencoes } from '@/lib/actions/manutencoes'
import { getRepasses } from '@/lib/actions/repasses'
import { getReservas } from '@/lib/actions/reservas'
import { getMetricasCarteira, getMetricasMensais } from '@/lib/actions/analytics'
import {
  Plataforma,
  StatusImovel,
  StatusReserva,
  TipoImovel,
} from '@/types'

export const dynamic = 'force-dynamic'

type ImovelFull = ImovelVisaoGeral & {
  status: StatusImovel
  proprietario_id: string
  reservas?: Array<{ id: string; data_checkin: string; data_checkout: string }>
}

export default async function ImovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const imovelRes = await getImovelById(id)
  if (imovelRes.error || !imovelRes.data) notFound()
  const imovel = imovelRes.data as ImovelFull & {
    status: StatusImovel
  }

  const hoje = new Date()
  const inicioJanela = format(subMonths(startOfMonth(hoje), 11), 'yyyy-MM-dd')
  const fimJanela = format(addMonths(startOfMonth(hoje), 3), 'yyyy-MM-dd')

  const [
    reservasRes,
    limpezasRes,
    manutencoesRes,
    repassesRes,
    metricasRes,
    mensaisRes,
  ] = await Promise.all([
    getReservas({ imovel_id: id, limit: 500 }),
    getLimpezas({ imovel_id: id, limit: 100 }),
    getManutencoes({ imovel_id: id }),
    getRepasses({ imovel_id: id }),
    getMetricasCarteira({
      data_inicio: inicioJanela,
      data_fim: fimJanela,
      imovel_id: id,
    }),
    getMetricasMensais({
      data_inicio: inicioJanela,
      data_fim: fimJanela,
      imovel_id: id,
    }),
  ])

  const reservasRaw = (reservasRes.data ?? []) as Array<{
    id: string
    data_checkin: string
    data_checkout: string
    nome_hospede?: string | null
    valor_bruto: number
    plataforma: Plataforma | null
    status: StatusReserva
    nota_hospede?: number | null
  }>

  const reservasTabela: ReservaRow[] = reservasRaw.map((r) => ({
    id: r.id,
    data_checkin: r.data_checkin,
    data_checkout: r.data_checkout,
    nome_hospede: r.nome_hospede,
    valor_bruto: Number(r.valor_bruto),
    plataforma: r.plataforma,
    status: r.status,
    nota_hospede: r.nota_hospede,
  }))

  const reservasCalendario: ReservaCal[] = reservasRaw.map((r) => ({
    id: r.id,
    data_checkin: r.data_checkin,
    data_checkout: r.data_checkout,
    plataforma: r.plataforma,
    status: r.status,
    nome_hospede: r.nome_hospede ?? null,
  }))

  const bloqueios: BloqueioCal[] = []

  const limpezas: LimpezaRow[] = ((limpezasRes.data ?? []) as Array<
    LimpezaRow & Record<string, unknown>
  >).map((l) => ({
    id: l.id,
    data_agendada: l.data_agendada,
    responsavel: l.responsavel,
    status: l.status,
    reserva_id: l.reserva_id,
    duracao_minutos: l.duracao_minutos,
  }))

  const manutencoes: ManutencaoRow[] = ((manutencoesRes.data ?? []) as Array<
    ManutencaoRow & Record<string, unknown>
  >).map((m) => ({
    id: m.id,
    tipo: m.tipo,
    descricao: m.descricao,
    urgencia: m.urgencia,
    status: m.status,
    custo_estimado: m.custo_estimado,
    custo_real: m.custo_real,
    data_abertura: m.data_abertura,
  }))

  const repasses: RepasseRow[] = ((repassesRes.data ?? []) as Array<
    RepasseRow & Record<string, unknown>
  >).map((r) => ({
    id: r.id,
    competencia_mes: r.competencia_mes,
    competencia_ano: r.competencia_ano,
    receita_bruta: Number(r.receita_bruta),
    comissao_gestora: Number(r.comissao_gestora),
    deducoes_manutencao: Number(r.deducoes_manutencao),
    deducoes_outros: Number(r.deducoes_outros),
    valor_repassado: Number(r.valor_repassado),
    status: r.status,
    data_repasse: r.data_repasse,
    pdf_url: r.pdf_url as string | undefined,
  }))

  const receitaPorMes = (mensaisRes.data ?? []).map((m) => ({
    mes: m.mes,
    receita_bruta: m.receita_bruta,
  }))

  const kpisFinanceiros = {
    revpar: metricasRes.data?.revpar ?? 0,
    adr: metricasRes.data?.adr ?? 0,
    taxa_ocupacao: metricasRes.data?.taxa_ocupacao ?? 0,
  }

  const fotoCapa = imovel.fotos?.[0]?.url

  const imovelVisaoGeral: ImovelVisaoGeral = {
    id: imovel.id,
    nome_interno: imovel.nome_interno,
    endereco_completo: imovel.endereco_completo,
    bairro: imovel.bairro,
    cep: imovel.cep,
    latitude: imovel.latitude,
    longitude: imovel.longitude,
    tipo: imovel.tipo as TipoImovel,
    capacidade_hospedes: imovel.capacidade_hospedes,
    numero_quartos: imovel.numero_quartos,
    numero_banheiros: imovel.numero_banheiros,
    andar: imovel.andar,
    nome_condominio: imovel.nome_condominio,
    comissao_percentual: Number(imovel.comissao_percentual),
    plataformas: imovel.plataformas,
    instrucoes_checkin: imovel.instrucoes_checkin,
    codigo_acesso: imovel.codigo_acesso,
    wifi_nome: imovel.wifi_nome,
    wifi_senha: imovel.wifi_senha,
    fotos: imovel.fotos ?? [],
    proprietario: imovel.proprietario,
  }

  return (
    <div>
      <div
        className="relative border-b border-line"
        style={
          fotoCapa
            ? {
                backgroundImage: `url(${fotoCapa})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { background: '#1F3A57' }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/85 via-navy-900/60 to-navy-900/40" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-10 md:px-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-gold-300">
            {imovel.bairro}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white md:text-4xl">
            {imovel.nome_interno}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <BadgeStatus
              variant={BadgeStatusVariant.Imovel}
              status={imovel.status}
            />
            <Link href={`/imoveis/${id}/editar`}>
              <Button
                variant={ButtonVariant.Secondary}
                leadingIcon={<Pencil className="h-3.5 w-3.5" />}
              >
                Editar
              </Button>
            </Link>
            <Link href={`/portal/imoveis/${id}`}>
              <Button
                variant={ButtonVariant.Outline}
                leadingIcon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                Portal do proprietário
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <DetalheTabs
          imovel={imovelVisaoGeral}
          reservas={reservasTabela}
          reservasCalendario={reservasCalendario}
          bloqueios={bloqueios}
          receitaPorMes={receitaPorMes}
          kpisFinanceiros={kpisFinanceiros}
          repasses={repasses}
          limpezas={limpezas}
          manutencoes={manutencoes}
        />
      </div>
    </div>
  )
}
