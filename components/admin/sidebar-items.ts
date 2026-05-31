import {
  BarChart3,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type SidebarItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function buildSidebarItems(alertasCount: number): SidebarItem[] {
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/imoveis', label: 'Imóveis', icon: Building2 },
    { href: '/proprietarios', label: 'Proprietários', icon: Users },
    { href: '/reservas', label: 'Reservas', icon: CalendarDays },
    { href: '/limpezas', label: 'Limpezas', icon: Sparkles },
    { href: '/manutencoes', label: 'Manutenções', icon: Wrench },
    { href: '/repasses', label: 'Repasses', icon: Banknote },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    {
      href: '/alertas',
      label: 'Alertas',
      icon: Bell,
      badge: alertasCount > 0 ? alertasCount : undefined,
    },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ]
}
