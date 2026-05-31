import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { Avatar, AvatarSize } from '@/components/ui/avatar'
import { Logo, LogoVariant } from '@/components/ui/logo'
import { SidebarNav } from './sidebar-nav'

export function Sidebar({
  alertasCount,
  userEmail,
}: {
  alertasCount: number
  userEmail: string
}) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[4.5rem] shrink-0 flex-col border-r border-line bg-white md:flex lg:w-64"
      aria-label="Barra lateral"
    >
      <div className="flex items-center justify-center border-b border-line p-4 lg:justify-start lg:p-5">
        <Link href="/dashboard" aria-label="Ir para dashboard">
          <Logo
            variant={LogoVariant.Wordmark}
            className="hidden h-7 w-auto lg:block"
          />
          <Logo
            variant={LogoVariant.Mark}
            className="h-9 w-auto lg:hidden"
          />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav alertasCount={alertasCount} collapsible />
      </div>
      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-2.5 md:justify-center lg:justify-start">
          <Avatar name={userEmail} size={AvatarSize.Sm} />
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-xs text-ink-muted" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sair"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-medium text-navy-700 transition-colors hover:bg-sand-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="md:hidden lg:inline">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
