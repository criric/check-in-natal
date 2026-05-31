'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './_guards'
import {
  ReservaSchema,
  ReservaBaseSchema,
  AtualizarStatusReservaSchema,
  type ReservaInput,
} from '@/lib/validations'
import {
  Plataforma,
  StatusReserva,
  type ActionResult,
} from '@/types'

export type ReservasFilters = {
  imovel_id?: string
  plataforma?: Plataforma
  status?: StatusReserva
  data_inicio?: string
  data_fim?: string
  limit?: number
  offset?: number
}

async function calcularValorLiquido(
  supabaseClient: Awaited<ReturnType<typeof createClient>>,
  imovelId: string,
  valorBruto: number,
  taxaPlataforma: number,
): Promise<number | undefined> {
  const { data } = await supabaseClient
    .from('imoveis')
    .select('comissao_percentual')
    .eq('id', imovelId)
    .maybeSingle()
  if (!data) return undefined
  const comissaoPct = Number(data.comissao_percentual ?? 0)
  const baseLiquida = valorBruto - taxaPlataforma
  return Number((baseLiquida * (1 - comissaoPct / 100)).toFixed(2))
}

export async function getReservas(
  filters?: ReservasFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('reservas')
    .select(
      `
      *,
      imovel:imoveis!inner(
        id, nome_interno, bairro,
        proprietario:proprietarios!inner(id, nome, email)
      )
    `,
    )
    .order('data_checkin', { ascending: false })

  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
  if (filters?.plataforma) query = query.eq('plataforma', filters.plataforma)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.data_inicio) query = query.gte('data_checkin', filters.data_inicio)
  if (filters?.data_fim) query = query.lte('data_checkout', filters.data_fim)

  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getReservaById(
  id: string,
): Promise<ActionResult<unknown>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservas')
    .select(
      `
      *,
      imovel:imoveis!inner(
        id, nome_interno, bairro, comissao_percentual,
        proprietario:proprietarios!inner(id, nome, email)
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Reserva não encontrada' }
  return { data }
}

export async function verificarConflitoDatas(
  imovelId: string,
  checkin: string,
  checkout: string,
  excludeId?: string,
): Promise<ActionResult<{ conflito: boolean }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('reservas')
    .select('id, data_checkin, data_checkout, status')
    .eq('imovel_id', imovelId)
    .lt('data_checkin', checkout)
    .gt('data_checkout', checkin)

  if (excludeId) query = query.neq('id', excludeId)

  const { data, error } = await query
  if (error) return { error: error.message }

  const conflito = (data ?? []).some(
    (r) =>
      r.status !== StatusReserva.Cancelada &&
      r.status !== StatusReserva.NoShow,
  )
  return { data: { conflito } }
}

export async function createReserva(
  input: ReservaInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ReservaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const supabase = await createClient()

  const conflito = await verificarConflitoDatas(
    d.imovel_id,
    d.data_checkin,
    d.data_checkout,
  )
  if (conflito.data?.conflito) {
    return { error: 'Conflito de datas com outra reserva ativa neste imóvel' }
  }

  const valor_liquido = await calcularValorLiquido(
    supabase,
    d.imovel_id,
    d.valor_bruto,
    d.taxa_plataforma,
  )

  const { data: inserted, error } = await supabase
    .from('reservas')
    .insert({
      imovel_id: d.imovel_id,
      plataforma: d.plataforma,
      id_externo: d.id_externo ?? null,
      nome_hospede: d.nome_hospede ?? null,
      email_hospede: d.email_hospede || null,
      telefone_hospede: d.telefone_hospede ?? null,
      data_checkin: d.data_checkin,
      data_checkout: d.data_checkout,
      num_hospedes: d.num_hospedes,
      valor_bruto: d.valor_bruto,
      taxa_plataforma: d.taxa_plataforma,
      valor_liquido_proprietario: valor_liquido ?? null,
      observacoes_internas: d.observacoes_internas ?? null,
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: error?.message ?? 'Erro ao criar' }

  revalidatePath('/reservas')
  return { data: { id: inserted.id } }
}

export async function updateReserva(
  id: string,
  input: Partial<ReservaInput>,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ReservaBaseSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const supabase = await createClient()

  // Busca a reserva atual para preencher campos faltantes nas validações
  const { data: atual, error: fetchErr } = await supabase
    .from('reservas')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!atual) return { error: 'Reserva não encontrada' }

  const imovelId = d.imovel_id ?? atual.imovel_id
  const checkin = d.data_checkin ?? atual.data_checkin
  const checkout = d.data_checkout ?? atual.data_checkout

  if (checkout <= checkin) {
    return { error: 'Data de checkout deve ser posterior ao checkin' }
  }

  const datasMudaram =
    d.imovel_id !== undefined ||
    d.data_checkin !== undefined ||
    d.data_checkout !== undefined
  if (datasMudaram) {
    const conf = await verificarConflitoDatas(imovelId, checkin, checkout, id)
    if (conf.data?.conflito) {
      return { error: 'Conflito de datas com outra reserva ativa' }
    }
  }

  const valoresMudaram =
    d.valor_bruto !== undefined ||
    d.taxa_plataforma !== undefined ||
    d.imovel_id !== undefined
  let valor_liquido: number | undefined
  if (valoresMudaram) {
    valor_liquido = await calcularValorLiquido(
      supabase,
      imovelId,
      d.valor_bruto ?? Number(atual.valor_bruto),
      d.taxa_plataforma ?? Number(atual.taxa_plataforma),
    )
  }

  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(d)) {
    if (v !== undefined) payload[k] = v
  }
  if (valor_liquido !== undefined) {
    payload.valor_liquido_proprietario = valor_liquido
  }

  const { error } = await supabase.from('reservas').update(payload).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
  return { data: { id } }
}

export async function updateStatusReserva(
  id: string,
  status: StatusReserva,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = AtualizarStatusReservaSchema.safeParse({ status })
  if (!parsed.success) {
    return { error: 'Status inválido' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reservas')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
  return { data: { id } }
}

export async function getReservasPorImovelMes(
  imovelId: string,
  mes: number,
  ano: number,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('imovel_id', imovelId)
    .gte('data_checkout', inicio)
    .lte('data_checkout', fim)
    .order('data_checkout', { ascending: true })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

/**
 * Retorna as datas (yyyy-MM-dd) já ocupadas de um imóvel — noites de reservas
 * ativas e datas bloqueadas no calendário. Usado para desabilitar dias no
 * date picker do formulário de reserva. `excludeId` ignora a própria reserva
 * ao editar.
 */
export async function getDatasOcupadasImovel(
  imovelId: string,
  excludeId?: string,
): Promise<ActionResult<{ datas: string[] }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()

  let reservasQuery = supabase
    .from('reservas')
    .select('id, data_checkin, data_checkout, status')
    .eq('imovel_id', imovelId)
  if (excludeId) reservasQuery = reservasQuery.neq('id', excludeId)

  const { data: reservas, error: errReservas } = await reservasQuery
  if (errReservas) return { error: errReservas.message }

  const ocupadas = new Set<string>()

  for (const r of reservas ?? []) {
    if (
      r.status === StatusReserva.Cancelada ||
      r.status === StatusReserva.NoShow
    ) {
      continue
    }
    // Ocupa as noites: de check-in (inclusive) até check-out (exclusivo)
    const cursor = new Date(`${r.data_checkin}T12:00:00`)
    const fim = new Date(`${r.data_checkout}T12:00:00`)
    while (cursor < fim) {
      ocupadas.add(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`,
      )
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  // Datas bloqueadas manualmente no calendário
  const hoje = new Date()
  const inicioPeriodo = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const { data: bloqueios, error: errBloqueios } = await supabase
    .from('precos_calendario')
    .select('data, disponivel')
    .eq('imovel_id', imovelId)
    .eq('disponivel', false)
    .gte('data', inicioPeriodo)

  if (errBloqueios) return { error: errBloqueios.message }
  for (const b of bloqueios ?? []) {
    if (b.data) ocupadas.add(b.data as string)
  }

  return { data: { datas: Array.from(ocupadas).sort() } }
}
