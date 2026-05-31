'use client'

import L from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const icon = L.divIcon({
  className: '',
  html: `<div style="
    width: 24px; height: 24px;
    background: #C8A668;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

export default function MapaMiniInner({
  latitude,
  longitude,
  titulo,
}: {
  latitude: number
  longitude: number
  titulo: string
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: 200, width: '100%' }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]} icon={icon} title={titulo} />
    </MapContainer>
  )
}
