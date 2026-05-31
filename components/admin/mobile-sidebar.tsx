'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetSide, SheetTrigger } from '@/components/ui/sheet'
import { Logo, LogoVariant } from '@/components/ui/logo'
import { SidebarNav } from './sidebar-nav'

export function MobileSidebar({
  alertasCount,
  userEmail,
}: {
  alertasCount: number
  userEmail: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-navy-700 hover:bg-sand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side={SheetSide.Left} className="w-72 p-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-line p-4">
            <Logo variant={LogoVariant.Wordmark} className="h-7 w-auto" />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav
              alertasCount={alertasCount}
              onNavigate={() => setOpen(false)}
            />
          </div>
          <div className="border-t border-line p-4">
            <p className="truncate text-xs text-ink-muted" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
