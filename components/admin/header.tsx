import { AlertasPopover, type AlertaPreview } from './alertas-popover'
import { Breadcrumb } from './breadcrumb'
import { MobileSidebar } from './mobile-sidebar'
import { UserMenu } from './user-menu'

export function Header({
  alertasCount,
  alertas,
  userEmail,
}: {
  alertasCount: number
  alertas: AlertaPreview[]
  userEmail: string
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar alertasCount={alertasCount} userEmail={userEmail} />
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-1">
        <AlertasPopover alertas={alertas} totalNaoLidos={alertasCount} />
        <UserMenu email={userEmail} />
      </div>
    </header>
  )
}
