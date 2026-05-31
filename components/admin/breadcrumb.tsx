'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  imoveis: 'Imóveis',
  proprietarios: 'Proprietários',
  reservas: 'Reservas',
  limpezas: 'Limpezas',
  manutencoes: 'Manutenções',
  repasses: 'Repasses',
  relatorios: 'Relatórios',
  alertas: 'Alertas',
  configuracoes: 'Configurações',
  eventos: 'Eventos sazonais',
  novo: 'Novo',
  editar: 'Editar',
  precos: 'Precificação',
}

function labelize(segment: string): string {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment]
  if (/^[0-9a-f-]{36}$/i.test(segment)) return 'Detalhes'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const trail = segments.map((seg, idx) => ({
    label: labelize(seg),
    href: '/' + segments.slice(0, idx + 1).join('/'),
  }))

  return (
    <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-xs text-ink-muted">
      <Link
        href="/dashboard"
        className="inline-flex items-center hover:text-navy-700"
        aria-label="Início"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {trail.map((item, idx) => (
        <span key={item.href} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" aria-hidden />
          {idx === trail.length - 1 ? (
            <span className="font-medium text-navy-700">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-navy-700">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
