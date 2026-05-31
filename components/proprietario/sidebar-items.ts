import {
  Banknote,
  Building2,
  CalendarDays,
  CalendarOff,
  LayoutDashboard,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type SidebarPortalItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const PORTAL_SIDEBAR_ITEMS: SidebarPortalItem[] = [
  { href: '/portal', label: 'Resumo', icon: LayoutDashboard },
  { href: '/portal/imoveis', label: 'Meus Imóveis', icon: Building2 },
  { href: '/portal/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/portal/repasses', label: 'Repasses', icon: Banknote },
  { href: '/portal/manutencoes', label: 'Manutenções', icon: Wrench },
  { href: '/portal/bloquear', label: 'Bloquear Datas', icon: CalendarOff },
]
