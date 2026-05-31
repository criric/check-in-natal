import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { HeaderProprietario } from '@/components/proprietario/header'
import { SidebarProprietario } from '@/components/proprietario/sidebar'
import { UserRole } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userRes = await getCurrentUser()
  if (!userRes.data) {
    redirect('/login')
  }
  if (userRes.data.role !== UserRole.Proprietario) {
    redirect('/dashboard')
  }

  let proprietarioNome: string | undefined
  if (userRes.data.proprietario_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('proprietarios')
      .select('nome')
      .eq('id', userRes.data.proprietario_id)
      .maybeSingle()
    proprietarioNome = data?.nome ?? undefined
  }

  return (
    <div className="flex min-h-screen bg-sand-50">
      <SidebarProprietario
        userEmail={userRes.data.email}
        proprietarioNome={proprietarioNome}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderProprietario
          userEmail={userRes.data.email}
          proprietarioNome={proprietarioNome}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
