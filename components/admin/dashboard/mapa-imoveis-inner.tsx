'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import L from 'leaflet'
import Link from 'next/link'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import type { ImovelDashboard } from '@/lib/actions/dashboard'
import { Plataforma } from '@/types'
import 'leaflet/dist/leaflet.css'

const NATAL_CENTER: [number, number] = [-5.7945, -35.211]

type PinTone = 'verde' | 'amarelo' | 'azul' | 'vermelho'

const PIN_COLORS: Record<PinTone, string> = {
  verde: '#10B981',
  amarelo: '#EAB308',
  azul: '#3B82F6',
  vermelho: '#EF4444',
}

function pinTone(imv: ImovelDashboard, hoje: string): PinTone {
  if (imv.em_manutencao) return 'vermelho'
  if (imv.proxima_reserva?.data_checkin === hoje) return 'amarelo'
  if (imv.ocupado_hoje) return 'verde'
  return 'azul'
}

function makeIcon(tone: PinTone): L.DivIcon {
  const color = PIN_COLORS[tone]
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

export default function MapaImoveisInner({
  imoveis,
}: {
  imoveis: ImovelDashboard[]
}) {
  const hoje = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="relative h-[300px] md:h-[450px]">
      <MapContainer
        center={NATAL_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {imoveis.map((imv) => (
          <Marker
            key={imv.id}
            position={[imv.latitude!, imv.longitude!]}
            icon={makeIcon(pinTone(imv, hoje))}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2">
                <div>
                  <p className="font-display text-sm font-semibold text-navy-800">
                    {imv.nome_interno}
                  </p>
                  <p className="text-xs text-ink-muted">{imv.bairro}</p>
                </div>
                <div className="space-y-1 text-xs text-ink">
                  <p>
                    <span className="text-ink-muted">Proprietário:</span>{' '}
                    {imv.proprietario.nome}
                  </p>
                  <div>
                    <BadgeStatus
                      variant={BadgeStatusVariant.Imovel}
                      status={imv.status}
                    />
                  </div>
                  {imv.proxima_reserva ? (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted">Próxima:</span>
                      <span>
                        {format(parseISO(imv.proxima_reserva.data_checkin), "dd/MM", { locale: ptBR })}
                      </span>
                      <PlataformaBadge
                        plataforma={
                          (imv.proxima_reserva.plataforma ?? Plataforma.Outro) as Plataforma
                        }
                        showLabel={false}
                      />
                    </div>
                  ) : null}
                </div>
                <Link
                  href={`/imoveis/${imv.id}`}
                  className="inline-block text-xs font-medium text-gold-700 hover:underline"
                >
                  Ver detalhes →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[400] rounded-md border border-line bg-white/95 p-2 text-xs shadow-md">
        <p className="mb-1 font-semibold text-navy-700">Legenda</p>
        <ul className="space-y-0.5">
          <LegendaItem cor={PIN_COLORS.verde} label="Ocupado" />
          <LegendaItem cor={PIN_COLORS.amarelo} label="Check-in hoje" />
          <LegendaItem cor={PIN_COLORS.azul} label="Disponível" />
          <LegendaItem cor={PIN_COLORS.vermelho} label="Manutenção" />
        </ul>
      </div>
    </div>
  )
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: cor }}
      />
      <span className="text-ink-muted">{label}</span>
    </li>
  )
}
