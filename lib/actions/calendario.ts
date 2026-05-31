'use server'

import { revalidatePath } from 'next/cache'
import { addDays, format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireAuth } from './_guards'
import { BloquearDatasSchema, type BloquearDatasInput } from '@/lib/validations'
import {
  BloqueadoPor,
  MotivoBloqueio,
  StatusReserva,
  UserRole,
  type ActionResult,
} from '@/types'

async function imovelPertenceAoUsuario(
  userId: string,
  imovelId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data: prop } = await admin
    .from('proprietarios')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (!prop) return false

  const { data: imovel } = await admin
    .from('imoveis')
    .select('id')
    .eq('id', imovelId)
    .eq('proprietario_id', prop.id)
    .maybeSingle()
  return !!imovel
}

export async function getDatasBloqueadas(
  imovelId: string,
  mes: number,
  ano: number,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('precos_calendario')
    .select('id, data, disponivel, motivo_bloqueio, bloqueado_por, preco_noite')
    .eq('imovel_id', imovelId)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data', { ascending: true })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function bloquearDatas(
  input: BloquearDatasInput,
): Promise<ActionResult<{ dias_bloqueados: number }>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const parsed = BloquearDatasSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  // Quem está bloqueando
  let bloqueadoPor: BloqueadoPor = BloqueadoPor.Admin
  if (g.user.role === UserRole.Proprietario) {
    const ok = await imovelPertenceAoUsuario(g.user.id, d.imovel_id)
    if (!ok) return { error: 'Imóvel não pertence a você' }
    bloqueadoPor = BloqueadoPor.Proprietario
  }

  const admin = createAdminClient()

  // Conflitos com reservas
  const { data: conflitos } = await admin
    .from('reservas')
    .select('id, data_checkin, data_checkout, status, nome_hospede')
    .eq('imovel_id', d.imovel_id)
    .lt('data_checkin', d.data_fim)
    .gt('data_checkout', d.data_inicio)

  const ativos = (conflitos ?? []).filter(
    (r) =>
      r.status !== StatusReserva.Cancelada && r.status !== StatusReserva.NoShow,
  )
  if (ativos.length > 0) {
    return {
      error: `Conflito com ${ativos.length} reserva(s) confirmada(s) neste intervalo`,
    }
  }

  // Gerar 1 registro por dia
  const registros: Array<{
    imovel_id: string
    data: string
    disponivel: boolean
    motivo_bloqueio: string
    bloqueado_por: string
  }> = []
  let cursor = parseISO(d.data_inicio)
  const fim = parseISO(d.data_fim)
  while (cursor <= fim) {
    registros.push({
      imovel_id: d.imovel_id,
      data: format(cursor, 'yyyy-MM-dd'),
      disponivel: false,
      motivo_bloqueio: d.motivo_bloqueio,
      bloqueado_por: bloqueadoPor,
    })
    cursor = addDays(cursor, 1)
  }

  const { error } = await admin
    .from('precos_calendario')
    .upsert(registros, { onConflict: 'imovel_id,data' })
  if (error) return { error: error.message }

  revalidatePath('/portal/bloquear')
  return { data: { dias_bloqueados: registros.length } }
}

export async function desbloquearDatas(
  imovelId: string,
  dataInicio: string,
  dataFim: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)
  ) {
    return { error: 'Datas inválidas' }
  }

  if (g.user.role === UserRole.Proprietario) {
    const ok = await imovelPertenceAoUsuario(g.user.id, imovelId)
    if (!ok) return { error: 'Imóvel não pertence a você' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('precos_calendario')
    .delete()
    .eq('imovel_id', imovelId)
    .eq('bloqueado_por', BloqueadoPor.Proprietario)
    .gte('data', dataInicio)
    .lte('data', dataFim)

  if (error) return { error: error.message }

  revalidatePath('/portal/bloquear')
  return { data: { id: imovelId } }
}

type BloqueioAgrupado = {
  data_inicio: string
  data_fim: string
  motivo: string
  total_dias: number
}

export async function getBloqueiosAtivos(
  imovelId: string,
): Promise<ActionResult<BloqueioAgrupado[]>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const hoje = format(new Date(), 'yyyy-MM-dd')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('precos_calendario')
    .select('data, motivo_bloqueio, disponivel')
    .eq('imovel_id', imovelId)
    .eq('disponivel', false)
    .gte('data', hoje)
    .order('data', { ascending: true })

  if (error) return { error: error.message }

  const grupos: BloqueioAgrupado[] = []
  let atual: BloqueioAgrupado | undefined

  for (const row of data ?? []) {
    if (
      atual &&
      row.motivo_bloqueio === atual.motivo &&
      format(addDays(parseISO(atual.data_fim), 1), 'yyyy-MM-dd') === row.data
    ) {
      atual.data_fim = row.data
      atual.total_dias += 1
    } else {
      if (atual) grupos.push(atual)
      atual = {
        data_inicio: row.data,
        data_fim: row.data,
        motivo: row.motivo_bloqueio ?? MotivoBloqueio.Outro,
        total_dias: 1,
      }
    }
  }
  if (atual) grupos.push(atual)

  return { data: grupos }
}

export async function atualizarPrecoData(
  imovelId: string,
  data: string,
  preco: number,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { error: 'Data inválida' }
  }
  if (preco <= 0) return { error: 'Preço deve ser positivo' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('precos_calendario')
    .upsert(
      {
        imovel_id: imovelId,
        data,
        preco_noite: preco,
        disponivel: true,
        bloqueado_por: BloqueadoPor.Admin,
      },
      { onConflict: 'imovel_id,data' },
    )

  if (error) return { error: error.message }
  return { data: { id: imovelId } }
}
