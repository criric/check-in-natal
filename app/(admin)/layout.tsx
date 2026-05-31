import { redirect } from 'next/navigation'
import {
  getAlertas,
  getContagemAlertasNaoLidos,
} from '@/lib/actions/alertas'
import { getCurrentUser } from '@/lib/actions/auth'
import { Header } from '@/components/admin/header'
import { Sidebar } from '@/components/admin/sidebar'
import { UserRole, PrioridadeAlerta } from '@/types'
import type { AlertaPreview } from '@/components/admin/alertas-popover'

export const dynamic = 'force-dynamic'

type AlertaRow = {
  id: string
  titulo: string
  prioridade: PrioridadeAlerta
  created_at: string
  lido: boolean
  imovel?: { id: string; nome_interno: string }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userRes = await getCurrentUser()
  if (!userRes.data) {
    redirect('/login')
  }
  if (userRes.data.role !== UserRole.Admin) {
    redirect('/portal')
  }

  const [countRes, alertasRes] = await Promise.all([
    getContagemAlertasNaoLidos(),
    getAlertas({ lido: false }),
  ])

  const alertasCount = countRes.data ?? 0
  const alertas: AlertaPreview[] = ((alertasRes.data ?? []) as AlertaRow[])
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      titulo: a.titulo,
      prioridade: a.prioridade,
      created_at: a.created_at,
      lido: a.lido,
      imovel: a.imovel,
    }))

  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar
        alertasCount={alertasCount}
        userEmail={userRes.data.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          alertasCount={alertasCount}
          alertas={alertas}
          userEmail={userRes.data.email}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
