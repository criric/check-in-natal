import { Wrench } from 'lucide-react'
import { getManutencoesProprietario } from '@/lib/actions/portal'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusManutencao, UrgenciaManutencao } from '@/types'
import { ManutencaoCardProprietario } from './manutencao-card'

export const dynamic = 'force-dynamic'

const URGENCIA_LABEL: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  urgente: 'Urgente',
}

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovada: 'Aprovada',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
}

export default async function PortalManutencoesPage() {
  const res = await getManutencoesProprietario()
  if (res.error) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <PageHeader
          titulo="Manutenções"
          descricao="Acompanhe e aprove manutenções nos seus imóveis"
        />
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error}
        </div>
      </div>
    )
  }

  const minhas = (res.data ?? []) as Array<{
    id: string
    descricao: string
    urgencia: UrgenciaManutencao
    status: StatusManutencao
    tipo?: string
    custo_estimado?: number
    custo_real?: number
    data_abertura: string
    fotos_antes: string[]
    fotos_depois: string[]
    imovel: { id: string; nome_interno: string }
  }>

  const aguardando = minhas.filter(
    (m) => m.status === StatusManutencao.AguardandoAprovacao,
  )
  const outras = minhas.filter(
    (m) => m.status !== StatusManutencao.AguardandoAprovacao,
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo="Manutenções"
        descricao="Acompanhe e aprove manutenções nos seus imóveis"
      />

      {aguardando.length > 0 && (
        <section className="rounded-lg border border-warning-100 bg-warning-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 animate-pulse rounded-full bg-warning-600"
            />
            <h2 className="font-display text-base font-semibold text-warning-700">
              Aguardando sua aprovação ({aguardando.length})
            </h2>
          </div>
          <ul className="space-y-3">
            {aguardando.map((m) => (
              <ManutencaoCardProprietario
                key={m.id}
                manutencao={m}
                statusLabel={STATUS_LABEL[m.status] ?? m.status}
                urgenciaLabel={URGENCIA_LABEL[m.urgencia] ?? m.urgencia}
                destacar
              />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-navy-800">
          Histórico ({outras.length})
        </h2>
        {outras.length === 0 ? (
          <EmptyState
            icone={<Wrench className="h-12 w-12" aria-hidden />}
            titulo="Nenhuma manutenção registrada"
            descricao="Quando a equipe abrir uma manutenção em um imóvel seu, ela aparecerá aqui."
          />
        ) : (
          <ul className="space-y-3">
            {outras.map((m) => (
              <ManutencaoCardProprietario
                key={m.id}
                manutencao={m}
                statusLabel={STATUS_LABEL[m.status] ?? m.status}
                urgenciaLabel={URGENCIA_LABEL[m.urgencia] ?? m.urgencia}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
