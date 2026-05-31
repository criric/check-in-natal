'use client'

import { useRouter } from 'next/navigation'
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard'
import { toast } from 'sonner'

export function DashboardRealtimeBridge() {
  const router = useRouter()

  useRealtimeDashboard({
    onNovaReserva: () => {
      toast.success('Nova reserva recebida')
      router.refresh()
    },
    onAtualizacaoReserva: () => {
      router.refresh()
    },
    onNovoAlerta: (alerta) => {
      const titulo = typeof alerta?.titulo === 'string' ? alerta.titulo : 'Novo alerta'
      toast.warning(titulo)
      router.refresh()
    },
    onAtualizacaoLimpeza: () => {
      router.refresh()
    },
  })

  return null
}
