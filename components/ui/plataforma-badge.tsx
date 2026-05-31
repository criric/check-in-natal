import { Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Plataforma } from '@/types'

type PlataformaConfig = {
  label: string
  bg: string
  text: string
  icon: React.ReactNode
}

function AirbnbMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M12 1c-1.6 0-3 .9-3.7 2.4l-7 14c-.7 1.4-.3 3 .9 4 .8.6 1.7.8 2.7.6 1-.2 1.9-.7 2.4-1.6L12 11l4.7 9.4c.5.9 1.4 1.4 2.4 1.6 1 .2 1.9 0 2.7-.6 1.2-1 1.6-2.6.9-4l-7-14C15 1.9 13.6 1 12 1zm0 4l5.6 11.2c.3.6.1 1.3-.4 1.7-.5.4-1.2.3-1.6-.2L12 12l-3.6 5.7c-.4.5-1.1.6-1.6.2-.5-.4-.7-1.1-.4-1.7L12 5z" />
    </svg>
  )
}

function BookingMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M4 3h8a5 5 0 0 1 3.5 8.6A5 5 0 0 1 13 21H4V3zm3 3v5h5a2.5 2.5 0 0 0 0-5H7zm0 8v4h6a2 2 0 0 0 0-4H7z" />
    </svg>
  )
}

const PLATAFORMA_CONFIG: Record<Plataforma, PlataformaConfig> = {
  [Plataforma.Airbnb]: {
    label: 'Airbnb',
    bg: 'bg-[#FFEDED]',
    text: 'text-[#D2333A]',
    icon: <AirbnbMark />,
  },
  [Plataforma.Booking]: {
    label: 'Booking',
    bg: 'bg-[#E6EEFF]',
    text: 'text-[#003580]',
    icon: <BookingMark />,
  },
  [Plataforma.Direto]: {
    label: 'Direto',
    bg: 'bg-success-50',
    text: 'text-success-700',
    icon: <Home className="h-3 w-3" />,
  },
  [Plataforma.Outro]: {
    label: 'Outro',
    bg: 'bg-sand-200',
    text: 'text-navy-700',
    icon: <Home className="h-3 w-3" />,
  },
}

export type PlataformaBadgeProps = {
  plataforma: Plataforma
  showLabel?: boolean
  className?: string
}

export function PlataformaBadge({
  plataforma,
  showLabel = true,
  className,
}: PlataformaBadgeProps) {
  const cfg = PLATAFORMA_CONFIG[plataforma]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium',
        cfg.bg,
        cfg.text,
        className,
      )}
      aria-label={cfg.label}
    >
      {cfg.icon}
      {showLabel ? <span>{cfg.label}</span> : null}
    </span>
  )
}
