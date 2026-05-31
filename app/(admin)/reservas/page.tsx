import {
  ReservasClient,
  type ReservaListItem,
} from '@/components/admin/reservas/reservas-client'
import type { ImovelOption } from '@/components/admin/reservas/reserva-form'
import { PageHeader } from '@/components/ui/page-header'
import { getImoveis } from '@/lib/actions/imoveis'
import { getReservas } from '@/lib/actions/reservas'
import { Plataforma, StatusImovel, StatusReserva } from '@/types'

export const dynamic = 'force-dynamic'

type ReservaRaw = {
  id: string
  imovel_id: string
  plataforma: Plataforma
  status: StatusReserva
  data_checkin: string
  data_checkout: string
  valor_bruto: number
  valor_liquido_proprietario?: number | null
  nome_hospede?: string | null
  nota_hospede?: number | null
  imovel: {
    id: string
    nome_interno: string
    bairro: string
  }
}

type ImovelRaw = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number
}

export default async function ReservasPage() {
  const [reservasRes, imoveisRes] = await Promise.all([
    getReservas({ limit: 500 }),
    getImoveis(),
  ])

  if (reservasRes.error || !reservasRes.data) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Reservas" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {reservasRes.error ?? 'Erro ao carregar reservas'}
        </p>
      </div>
    )
  }

  const reservas: ReservaListItem[] = (reservasRes.data as ReservaRaw[]).map(
    (r) => ({
      id: r.id,
      imovel_id: r.imovel_id,
      imovel_nome: r.imovel.nome_interno,
      imovel_bairro: r.imovel.bairro,
      nome_hospede: r.nome_hospede ?? null,
      data_checkin: r.data_checkin,
      data_checkout: r.data_checkout,
      plataforma: r.plataforma,
      status: r.status,
      valor_bruto: Number(r.valor_bruto),
      valor_liquido_proprietario:
        r.valor_liquido_proprietario != null
          ? Number(r.valor_liquido_proprietario)
          : null,
      nota_hospede: r.nota_hospede != null ? Number(r.nota_hospede) : null,
    }),
  )

  const imoveis: ImovelOption[] = ((imoveisRes.data ?? []) as ImovelRaw[])
    .filter((i) => i.status !== StatusImovel.Inativo)
    .map((i) => ({
      id: i.id,
      nome_interno: i.nome_interno,
      bairro: i.bairro,
      comissao_percentual: Number(i.comissao_percentual),
    }))

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Reservas"
        descricao="Histórico de reservas e gestão de check-ins, check-outs e cancelamentos."
      />
      <ReservasClient reservas={reservas} imoveis={imoveis} />
    </div>
  )
}
