'use server'

import { revalidatePath } from 'next/cache'
import { addDays, differenceInHours, format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  LimpezaSchema,
  UpdateLimpezaSchema,
  type LimpezaInput,
  type UpdateLimpezaInput,
} from '@/lib/validations'
import { alertarCheckinSemLimpeza } from '@/lib/utils/emails'
import {
  PrioridadeAlerta,
  StatusLimpeza,
  StatusReserva,
  TipoAlerta,
  type ActionResult,
} from '@/types'

const BUCKET = 'limpezas-fotos'

export type LimpezasFilters = {
  imovel_id?: string
  status?: StatusLimpeza
  data_inicio?: string
  data_fim?: string
  responsavel?: string
  limit?: number
  offset?: number
}

const SELECT_LIMPEZA = `
  *,
  imovel:imoveis!inner(id, nome_interno, bairro),
  reserva:reservas(id, nome_hospede, data_checkin, data_checkout)
`

export async function getLimpezas(
  filters?: LimpezasFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('limpezas')
    .select(SELECT_LIMPEZA)
    .order('data_agendada', { ascending: true })

  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.responsavel)
    query = query.ilike('responsavel', `%${filters.responsavel}%`)
  if (filters?.data_inicio) query = query.gte('data_agendada', filters.data_inicio)
  if (filters?.data_fim) query = query.lte('data_agendada', filters.data_fim)

  const limit = filters?.limit ?? 100
  const offset = filters?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getLimpezasByData(
  data: string,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { error: 'Data inválida' }
  }

  const supabase = await createClient()
  const inicio = `${data}T00:00:00.000Z`
  const fim = `${data}T23:59:59.999Z`

  const { data: rows, error } = await supabase
    .from('limpezas')
    .select(SELECT_LIMPEZA)
    .gte('data_agendada', inicio)
    .lte('data_agendada', fim)
    .order('data_agendada', { ascending: true })

  if (error) return { error: error.message }
  return { data: rows ?? [] }
}

export async function getLimpezaById(
  id: string,
): Promise<ActionResult<unknown>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('limpezas')
    .select(SELECT_LIMPEZA)
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Limpeza não encontrada' }
  return { data }
}

export async function createLimpeza(
  input: LimpezaInput,
): Promise<ActionResult<{ id: string; aviso?: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = LimpezaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const supabase = await createClient()
  const admin = createAdminClient()

  // Se reserva fornecida, validar que pertence ao mesmo imóvel
  if (d.reserva_id) {
    const { data: reserva } = await supabase
      .from('reservas')
      .select('id, imovel_id, data_checkin')
      .eq('id', d.reserva_id)
      .maybeSingle()
    if (!reserva) return { error: 'Reserva não encontrada' }
    if (reserva.imovel_id !== d.imovel_id) {
      return { error: 'Reserva não pertence ao imóvel informado' }
    }
  }

  // Aviso (não erro) se já há limpeza no mesmo dia para o mesmo imóvel
  const dia = d.data_agendada.slice(0, 10)
  const { data: mesmoDia } = await supabase
    .from('limpezas')
    .select('id')
    .eq('imovel_id', d.imovel_id)
    .gte('data_agendada', `${dia}T00:00:00.000Z`)
    .lte('data_agendada', `${dia}T23:59:59.999Z`)

  const aviso = (mesmoDia ?? []).length > 0
    ? 'Já existe uma limpeza agendada para este imóvel no mesmo dia'
    : undefined

  const { data: inserted, error } = await supabase
    .from('limpezas')
    .insert({
      imovel_id: d.imovel_id,
      reserva_id: d.reserva_id ?? null,
      data_agendada: d.data_agendada,
      responsavel: d.responsavel ?? null,
      observacoes: d.observacoes ?? null,
      status: StatusLimpeza.Agendada,
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: error?.message ?? 'Erro ao criar' }

  // Se check-in da reserva está em menos de 24h, criar alerta crítico
  if (d.reserva_id) {
    const { data: reserva } = await supabase
      .from('reservas')
      .select('data_checkin, imovel_id')
      .eq('id', d.reserva_id)
      .maybeSingle()
    if (reserva) {
      const horas = differenceInHours(parseISO(reserva.data_checkin), new Date())
      if (horas <= 24 && horas >= 0) {
        await admin.from('alertas').insert({
          tipo: TipoAlerta.CheckinSemLimpeza,
          prioridade: PrioridadeAlerta.Critica,
          titulo: `Check-in em ${horas}h com limpeza recém-agendada`,
          imovel_id: reserva.imovel_id,
          lido: false,
        })
      }
    }
  }

  revalidatePath('/limpezas')
  return { data: { id: inserted.id, aviso } }
}

export async function updateLimpeza(
  id: string,
  input: UpdateLimpezaInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = UpdateLimpezaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const supabase = await createClient()

  const { data: atual, error: fetchErr } = await supabase
    .from('limpezas')
    .select('id, status, data_inicio, data_agendada, reserva_id, checklist, imovel_id')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!atual) return { error: 'Limpeza não encontrada' }

  const payload: Record<string, unknown> = {}
  if (d.responsavel !== undefined) payload.responsavel = d.responsavel
  if (d.observacoes !== undefined) payload.observacoes = d.observacoes
  if (d.duracao_minutos !== undefined) payload.duracao_minutos = d.duracao_minutos
  if (d.data_inicio !== undefined) payload.data_inicio = d.data_inicio
  if (d.data_conclusao !== undefined) payload.data_conclusao = d.data_conclusao

  if (d.checklist !== undefined) {
    payload.checklist = {
      ...(atual.checklist as Record<string, boolean>),
      ...d.checklist,
    }
  }

  let novoStatus: StatusLimpeza | undefined = d.status
  if (novoStatus === StatusLimpeza.EmAndamento && !atual.data_inicio) {
    payload.data_inicio = new Date().toISOString()
  }
  if (novoStatus === StatusLimpeza.Concluida) {
    const agora = new Date()
    payload.data_conclusao = agora.toISOString()
    if (atual.data_inicio) {
      const dur = Math.round(
        (agora.getTime() - new Date(atual.data_inicio).getTime()) / 60000,
      )
      if (dur > 0) payload.duracao_minutos = dur
    }
  }
  if (novoStatus) payload.status = novoStatus

  const { error } = await supabase.from('limpezas').update(payload).eq('id', id)
  if (error) return { error: error.message }

  // Alerta: limpeza só foi concluída perto demais do check-in
  if (
    novoStatus === StatusLimpeza.Concluida &&
    atual.reserva_id &&
    process.env.ADMIN_EMAIL
  ) {
    const { data: reserva } = await supabase
      .from('reservas')
      .select('data_checkin')
      .eq('id', atual.reserva_id)
      .maybeSingle()
    const { data: imovel } = await supabase
      .from('imoveis')
      .select('nome_interno')
      .eq('id', atual.imovel_id)
      .maybeSingle()
    if (reserva && imovel) {
      const horas = differenceInHours(
        parseISO(reserva.data_checkin),
        new Date(),
      )
      if (horas <= 2 && horas >= 0) {
        await alertarCheckinSemLimpeza({
          admin_email: process.env.ADMIN_EMAIL,
          imovel_nome: imovel.nome_interno,
          data_checkin: reserva.data_checkin,
          horas_restantes: horas,
        })
      }
    }
  }

  revalidatePath('/limpezas')
  revalidatePath(`/limpezas/${id}`)
  return { data: { id } }
}

export async function uploadFotoLimpeza(
  limpezaId: string,
  file: File,
): Promise<ActionResult<{ url: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${limpezaId}/${Date.now()}-${safeName}`
  const buf = await file.arrayBuffer()

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
  if (upErr) return { error: upErr.message }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const url = pub.publicUrl

  const { data: atual } = await admin
    .from('limpezas')
    .select('fotos')
    .eq('id', limpezaId)
    .maybeSingle()

  const fotosAtuais = (atual?.fotos ?? []) as string[]
  const { error: updErr } = await admin
    .from('limpezas')
    .update({ fotos: [...fotosAtuais, url] })
    .eq('id', limpezaId)

  if (updErr) {
    await admin.storage.from(BUCKET).remove([path])
    return { error: updErr.message }
  }

  revalidatePath(`/limpezas/${limpezaId}`)
  return { data: { url } }
}

export async function deleteLimpeza(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data: atual } = await supabase
    .from('limpezas')
    .select('status')
    .eq('id', id)
    .maybeSingle()
  if (!atual) return { error: 'Limpeza não encontrada' }
  if (atual.status === StatusLimpeza.EmAndamento) {
    return { error: 'Não é possível excluir uma limpeza em andamento' }
  }

  const { error } = await supabase.from('limpezas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/limpezas')
  return { data: { id } }
}

export async function getLimpezasAgendadasHoje(): Promise<
  ActionResult<unknown[]>
> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const amanha = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('limpezas')
    .select(SELECT_LIMPEZA)
    .gte('data_agendada', `${hoje}T00:00:00.000Z`)
    .lte('data_agendada', `${amanha}T23:59:59.999Z`)
    .order('data_agendada', { ascending: true })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}
