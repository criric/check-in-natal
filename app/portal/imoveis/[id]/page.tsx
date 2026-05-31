import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarOff, Star } from 'lucide-react'
import { getDetalheImovelPortal } from '@/lib/actions/portal'
import { GaleriaFotos } from '@/components/proprietario/galeria-fotos'
import {
  BadgeStatus,
  BadgeStatusVariant,
} from '@/components/ui/badge-status'
import { PageHeader } from '@/components/ui/page-header'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { formatDate } from '@/lib/utils/formatters'
import { Plataforma, StatusImovel } from '@/types'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  quarto: 'Quarto',
  studio: 'Studio',
  cobertura: 'Cobertura',
}

export default async function PortalImovelDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const res = await getDetalheImovelPortal(params.id)
  if (res.error === 'Imóvel não encontrado') notFound()
  if (res.error || !res.data) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          {res.error ?? 'Não foi possível carregar o imóvel.'}
        </div>
      </div>
    )
  }

  const i = res.data

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        titulo={i.nome_interno}
        descricao={`${i.bairro}${i.cidade ? ` · ${i.cidade}` : ''}`}
        acoes={
          <Link
            href={`/portal/bloquear?imovel=${i.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:bg-sand-50"
          >
            <CalendarOff className="h-3.5 w-3.5" />
            Bloquear datas
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <BadgeStatus
          variant={BadgeStatusVariant.Imovel}
          status={i.status as StatusImovel}
        />
        {i.tipo ? (
          <span className="inline-flex items-center rounded-sm bg-sand-100 px-2 py-0.5 text-xs font-medium text-navy-700">
            {TIPO_LABEL[i.tipo] ?? i.tipo}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <GaleriaFotos fotos={i.fotos} />

        <div className="space-y-4">
          <DataCard titulo="Detalhes">
            <DataRow label="Endereço" valor={i.endereco_completo} />
            <DataRow label="Bairro" valor={i.bairro} />
            {i.cidade ? <DataRow label="Cidade" valor={i.cidade} /> : null}
            {i.nome_condominio ? (
              <DataRow label="Condomínio" valor={i.nome_condominio} />
            ) : null}
            {i.andar != null ? (
              <DataRow label="Andar" valor={String(i.andar)} />
            ) : null}
          </DataCard>

          <DataCard titulo="Capacidade">
            <DataRow
              label="Hóspedes"
              valor={String(i.capacidade_hospedes ?? '—')}
            />
            <DataRow
              label="Quartos"
              valor={String(i.numero_quartos ?? '—')}
            />
            <DataRow
              label="Banheiros"
              valor={String(i.numero_banheiros ?? '—')}
            />
          </DataCard>
        </div>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-lg font-semibold text-navy-800">
          Últimas avaliações
        </h2>
        <p className="mb-4 text-xs text-ink-muted">
          Comentários enviados pelos hóspedes
        </p>
        {i.avaliacoes.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma avaliação registrada.</p>
        ) : (
          <ul className="space-y-3">
            {i.avaliacoes.map((a, idx) => (
              <li
                key={idx}
                className="rounded-md border border-line bg-sand-50 p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-navy-800">
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    {a.nota.toFixed(1)}
                  </span>
                  {a.plataforma ? (
                    <PlataformaBadge plataforma={a.plataforma as Plataforma} />
                  ) : null}
                  <span className="ml-auto text-xs text-ink-muted">
                    {formatDate(a.data_checkout)}
                  </span>
                </div>
                {a.comentario ? (
                  <p className="text-sm text-navy-800">&ldquo;{a.comentario}&rdquo;</p>
                ) : (
                  <p className="text-sm italic text-ink-muted">
                    Sem comentário do hóspede.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DataCard({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-subtle">
        {titulo}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function DataRow({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/50 pb-1.5 text-sm last:border-0 last:pb-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-navy-800">{valor}</dd>
    </div>
  )
}
