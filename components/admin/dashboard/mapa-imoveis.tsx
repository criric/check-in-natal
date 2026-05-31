'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { ImovelDashboard } from '@/lib/actions/dashboard'

const MapaInner = dynamic(() => import('./mapa-imoveis-inner'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="flex h-[300px] items-center justify-center rounded-lg border border-line bg-sand-50 md:h-[450px]"
    >
      <p className="text-sm text-ink-muted">Carregando mapa...</p>
    </div>
  ),
})

export function MapaImoveis({ imoveis }: { imoveis: ImovelDashboard[] }) {
  const comGeo = useMemo(
    () => imoveis.filter((i) => i.latitude != null && i.longitude != null),
    [imoveis],
  )

  if (comGeo.length === 0) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-line bg-sand-50 px-4 py-3">
          <h2 className="font-display text-lg text-navy-700">
            Distribuição dos imóveis
          </h2>
        </div>
        <div className="p-6">
          <EmptyState
            icone={<Building2 className="h-10 w-10" />}
            titulo="Sem coordenadas cadastradas"
            descricao="Preencha latitude e longitude nos imóveis para visualizá-los no mapa."
          />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-line bg-sand-50 px-4 py-3">
        <h2 className="font-display text-lg text-navy-700">
          Distribuição dos imóveis
        </h2>
      </div>
      <MapaInner imoveis={comGeo} />
    </Card>
  )
}
