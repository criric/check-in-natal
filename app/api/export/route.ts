import { NextResponse } from 'next/server'
import { exportarCSV } from '@/lib/actions/export'
import { ExportFiltroSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    params[k] = v
  })

  const parsed = ExportFiltroSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' },
      { status: 400 },
    )
  }

  const res = await exportarCSV(parsed.data)
  if (res.error || res.data === undefined) {
    const status = res.error?.includes('admin') ? 403 : 500
    return NextResponse.json({ error: res.error ?? 'Erro' }, { status })
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const filename = `gestora_${parsed.data.target}_${hoje}.csv`

  return new Response(res.data, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
