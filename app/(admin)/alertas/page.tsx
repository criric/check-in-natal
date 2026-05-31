import { getAlertas } from '@/lib/actions/alertas'
import { getImoveis } from '@/lib/actions/imoveis'
import { PageHeader } from '@/components/ui/page-header'
import {
  AlertasClient,
  type AlertaItem,
  type ImovelOpt,
} from '@/components/admin/alertas/alertas-client'
import { PrioridadeAlerta, TipoAlerta } from '@/types'

export const dynamic = 'force-dynamic'

type AlertaRaw = {
  id: string
  tipo: TipoAlerta
  prioridade: PrioridadeAlerta
  titulo: string
  mensagem?: string | null
  lido: boolean
  created_at: string
  imovel?: { id: string; nome_interno: string; bairro: string } | null
}

type ImovelRaw = {
  id: string
  nome_interno: string
  bairro: string
}

export default async function AlertasPage() {
  const [alertasRes, imoveisRes] = await Promise.all([
    getAlertas(),
    getImoveis(),
  ])

  if (alertasRes.error) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <PageHeader titulo="Alertas" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {alertasRes.error}
        </p>
      </div>
    )
  }

  const alertas: AlertaItem[] = ((alertasRes.data ?? []) as AlertaRaw[]).map(
    (a) => ({
      id: a.id,
      tipo: a.tipo,
      prioridade: a.prioridade,
      titulo: a.titulo,
      mensagem: a.mensagem ?? undefined,
      lido: a.lido,
      created_at: a.created_at,
      imovel: a.imovel
        ? {
            id: a.imovel.id,
            nome_interno: a.imovel.nome_interno,
            bairro: a.imovel.bairro,
          }
        : undefined,
    }),
  )

  const imoveis: ImovelOpt[] = ((imoveisRes.data ?? []) as ImovelRaw[]).map(
    (i) => ({ id: i.id, nome_interno: i.nome_interno, bairro: i.bairro }),
  )

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo="Alertas"
        descricao="Centralize avisos operacionais do sistema: check-ins, repasses, manutenções e contratos."
      />
      <AlertasClient alertas={alertas} imoveis={imoveis} />
    </div>
  )
}
