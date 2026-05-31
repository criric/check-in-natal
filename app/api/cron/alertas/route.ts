import { NextResponse } from 'next/server'
import {
  verificarCheckinSemLimpeza,
  verificarContratosVencendo,
  verificarImoveisSemReserva,
  verificarManutencoesPaadas,
  verificarRepassesPendentes,
} from '@/lib/actions/alertas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resultados = {
    checkin_sem_limpeza: await verificarCheckinSemLimpeza(),
    imoveis_sem_reserva: await verificarImoveisSemReserva(),
    repasses_pendentes: await verificarRepassesPendentes(),
    manutencoes_paradas: await verificarManutencoesPaadas(),
    contratos_vencendo: await verificarContratosVencendo(),
  }

  const total = Object.values(resultados).reduce((s, n) => s + n, 0)

  return NextResponse.json({
    alertas_criados: total,
    detalhes: resultados,
    timestamp: new Date().toISOString(),
  })
}
