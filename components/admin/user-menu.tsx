'use client'

import { LogOut, Settings } from 'lucide-react'
import { useTransition } from 'react'
import Link from 'next/link'
import { Avatar, AvatarSize } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown'
import { logout } from '@/lib/actions/auth'

export function UserMenu({ email }: { email: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md p-1 hover:bg-sand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label="Abrir menu do usuário"
        >
          <Avatar name={email} size={AvatarSize.Sm} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Conectado como</DropdownMenuLabel>
        <div className="px-3 pb-2 text-sm text-navy-800 truncate" title={email}>
          {email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracoes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault()
            startTransition(() => {
              void logout()
            })
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
