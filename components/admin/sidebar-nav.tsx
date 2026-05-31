'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { buildSidebarItems } from './sidebar-items'

export function SidebarNav({
  alertasCount,
  onNavigate,
  collapsible = false,
}: {
  alertasCount: number
  onNavigate?: () => void
  /** When true, collapses to icon-only between md and lg (tablet) widths. */
  collapsible?: boolean
}) {
  const pathname = usePathname()
  const items = buildSidebarItems(alertasCount)

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsible ? item.label : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              collapsible &&
                'md:justify-center md:px-0 lg:justify-start lg:px-3',
              isActive
                ? 'bg-sand-100 text-navy-800'
                : 'text-ink-muted hover:bg-sand-50 hover:text-navy-700',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-gold-500"
              />
            ) : null}
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isActive ? 'text-gold-600' : 'text-ink-subtle',
              )}
              aria-hidden
            />
            <span
              className={cn(
                'flex-1 truncate',
                collapsible && 'md:hidden lg:inline',
              )}
            >
              {item.label}
            </span>
            {item.badge ? (
              <span
                className={cn(
                  'ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger-600 px-1.5 text-2xs font-semibold text-white',
                  collapsible &&
                    'md:absolute md:right-1 md:top-1 md:ml-0 md:h-4 md:min-w-[1rem] md:px-1 lg:static lg:right-auto lg:top-auto lg:h-5 lg:min-w-[1.25rem] lg:px-1.5',
                )}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
