import { NextResponse } from 'next/server'
import { getBairrosDisponiveis, simularReceita } from '@/lib/actions/simulador'
import { SimuladorSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

const JANELA_MS = 60_000
const LIMITE_POR_IP = 10
const requestsPorIp = new Map<string, number[]>()

function checarRateLimit(ip: string): boolean {
  const agora = Date.now()
  const inicio = agora - JANELA_MS
  const anteriores = requestsPorIp.get(ip) ?? []
  const recentes = anteriores.filter((t) => t > inicio)
  if (recentes.length >= LIMITE_POR_IP) {
    requestsPorIp.set(ip, recentes)
    return false
  }
  recentes.push(agora)
  requestsPorIp.set(ip, recentes)
  return true
}

function obterIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'anon'
}

export async function GET() {
  const bairros = await getBairrosDisponiveis()
  return NextResponse.json({ bairros })
}

export async function POST(request: Request) {
  const ip = obterIp(request)
  if (!checarRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns instantes.' },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const parsed = SimuladorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 },
      )
    }

    const res = await simularReceita(parsed.data)
    if (res.error || !res.data) {
      return NextResponse.json(
        { error: res.error ?? 'Erro ao simular' },
        { status: 500 },
      )
    }
    return NextResponse.json(res.data)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
