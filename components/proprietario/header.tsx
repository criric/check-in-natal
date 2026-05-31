import { BreadcrumbPortal } from './breadcrumb'
import { MobileSidebarPortal } from './mobile-sidebar'

export function HeaderProprietario({
  userEmail,
  proprietarioNome,
}: {
  userEmail: string
  proprietarioNome?: string
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebarPortal
          userEmail={userEmail}
          proprietarioNome={proprietarioNome}
        />
        <BreadcrumbPortal />
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-xs text-ink-muted">Portal do proprietário</span>
      </div>
    </header>
  )
}
