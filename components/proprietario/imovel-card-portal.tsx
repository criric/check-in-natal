import Image from 'next/image'
import Link from 'next/link'
import { Building2, Star } from 'lucide-react'
import {
  BadgeStatus,
  BadgeStatusVariant,
} from '@/components/ui/badge-status'
import { formatCurrency } from '@/lib/utils/formatters'
import { StatusImovel } from '@/types'
import type { ImovelDoProprietario } from '@/lib/actions/portal'

export function ImovelCardPortal({ imovel }: { imovel: ImovelDoProprietario }) {
  return (
    <Link
      href={`/portal/imoveis/${imovel.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-xs transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100">
        {imovel.foto_principal ? (
          <Image
            src={imovel.foto_principal}
            alt={imovel.nome_interno}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sand-300">
            <Building2 className="h-16 w-16" aria-hidden />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <BadgeStatus
            variant={BadgeStatusVariant.Imovel}
            status={imovel.status as StatusImovel}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-navy-800">
            {imovel.nome_interno}
          </h3>
          <p className="text-xs text-ink-muted">{imovel.bairro}</p>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <Metric label="Ocupação" value={`${imovel.taxa_ocupacao_mes}%`} />
          <Metric
            label="Receita"
            value={formatCurrency(imovel.receita_mes)}
          />
          <Metric
            label="Nota"
            value={
              imovel.nota_media > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-navy-800">
                  <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                  {imovel.nota_media.toFixed(1)}
                </span>
              ) : (
                '—'
              )
            }
          />
        </div>
      </div>
    </Link>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-navy-800">{value}</p>
    </div>
  )
}
