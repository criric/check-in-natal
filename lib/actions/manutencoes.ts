'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireAuth } from './_guards'
import {
  AprovarManutencaoSchema,
  ManutencaoSchema,
  UpdateManutencaoSchema,
  type AprovarManutencaoInput,
  type ManutencaoInput,
  type UpdateManutencaoInput,
} from '@/lib/validations'
import {
  notificarManutencaoUrgente,
  notificarRespostaManutencao,
} from '@/lib/utils/emails'
import {
  PrioridadeAlerta,
  StatusManutencao,
  TipoAlerta,
  UrgenciaManutencao,
  UserRole,
  type ActionResult,
} from '@/types'

const BUCKET = 'manutencoes-fotos'
const LIMITE_APROVACAO = 200

const SELECT_MANUTENCAO = `
  *,
  imovel:imoveis!inner(
    id, nome_interno,
    proprietario:proprietarios!inner(id, nome, email)
  )
`

export type ManutencoesFilters = {
  imovel_id?: string
  status?: StatusManutencao
  urgencia?: UrgenciaManutencao
  data_inicio?: string
  data_fim?: string
}

const ORDEM_URGENCIA: Record<string, number> = {
  [UrgenciaManutencao.Urgente]: 0,
  [UrgenciaManutencao.Media]: 1,
  [UrgenciaManutencao.Baixa]: 2,
}

export async function getManutencoes(
  filters?: ManutencoesFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('manutencoes')
    .select(SELECT_MANUTENCAO)
    .order('data_abertura', { ascending: false })

  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.urgencia) query = query.eq('urgencia', filters.urgencia)
  if (filters?.data_inicio) query = query.gte('data_abertura', filters.data_inicio)
  if (filters?.data_fim) query = query.lte('data_abertura', filters.data_fim)

  const { data, error } = await query
  if (error) return { error: error.message }

  const sorted = (data ?? []).slice().sort((a, b) => {
    const ua = ORDEM_URGENCIA[a.urgencia] ?? 9
    const ub = ORDEM_URGENCIA[b.urgencia] ?? 9
    if (ua !== ub) return ua - ub
    return (b.data_abertura ?? '').localeCompare(a.data_abertura ?? '')
  })

  return { data: sorted }
}

export async function getManutencaoById(
  id: string,
): Promise<ActionResult<unknown>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('manutencoes')
    .select(SELECT_MANUTENCAO)
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Manutenção não encontrada' }
  return { data }
}

export async function createManutencao(
  input: ManutencaoInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ManutencaoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const admin = createAdminClient()

  const statusInicial =
    d.custo_estimado != null && d.custo_estimado >= LIMITE_APROVACAO
      ? StatusManutencao.AguardandoAprovacao
      : StatusManutencao.Aberta

  const { data: inserted, error } = await admin
    .from('manutencoes')
    .insert({
      imovel_id: d.imovel_id,
      tipo: d.tipo ?? null,
      descricao: d.descricao,
      urgencia: d.urgencia,
      status: statusInicial,
      prestador_nome: d.prestador_nome ?? null,
      prestador_contato: d.prestador_contato ?? null,
      custo_estimado: d.custo_estimado ?? null,
      observacoes: d.observacoes ?? null,
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: error?.message ?? 'Erro ao criar' }

  // Buscar imóvel + proprietário para alerta e e-mail
  const { data: imovel } = await admin
    .from('imoveis')
    .select(
      'id, nome_interno, proprietario:proprietarios!inner(id, nome, email)',
    )
    .eq('id', d.imovel_id)
    .maybeSingle()

  // Alerta no sistema
  const prioridade =
    d.urgencia === UrgenciaManutencao.Urgente
      ? PrioridadeAlerta.Critica
      : PrioridadeAlerta.Media

  await admin.from('alertas').insert({
    tipo: TipoAlerta.ManutencaoAberta,
    prioridade,
    titulo: `Nova manutenção (${d.urgencia}): ${d.descricao.slice(0, 60)}`,
    imovel_id: d.imovel_id,
    lido: false,
  })

  // E-mail ao proprietário se aguarda aprovação
  if (statusInicial === StatusManutencao.AguardandoAprovacao && imovel) {
    const prop = (imovel as unknown as {
      proprietario: { nome: string; email: string }
    }).proprietario
    const linkPortal = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/portal/manutencoes`
    try {
      await notificarManutencaoUrgente({
        proprietario_email: prop.email,
        proprietario_nome: prop.nome,
        imovel_nome: imovel.nome_interno,
        descricao: d.descricao,
        custo_estimado: d.custo_estimado ?? 0,
        link_portal: linkPortal,
      })
    } catch {
      // não bloqueia
    }
  }

  revalidatePath('/manutencoes')
  return { data: { id: inserted.id } }
}

export async function updateManutencao(
  id: string,
  input: UpdateManutencaoInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = UpdateManutencaoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const supabase = await createClient()

  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(d)) {
    if (v !== undefined) payload[k] = v
  }

  if (
    d.status === StatusManutencao.Resolvida &&
    d.data_resolucao === undefined
  ) {
    payload.data_resolucao = new Date().toISOString()
  }

  const { error } = await supabase
    .from('manutencoes')
    .update(payload)
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/manutencoes')
  revalidatePath(`/manutencoes/${id}`)
  return { data: { id } }
}

export async function uploadFotoManutencao(
  manutencaoId: string,
  file: File,
  tipo: 'antes' | 'depois',
): Promise<ActionResult<{ url: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${manutencaoId}/${tipo}/${Date.now()}-${safeName}`
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

  const col = tipo === 'antes' ? 'fotos_antes' : 'fotos_depois'
  const { data: atual } = await admin
    .from('manutencoes')
    .select(col)
    .eq('id', manutencaoId)
    .maybeSingle()

  const arrAtual = ((atual as Record<string, unknown> | null)?.[col] ?? []) as string[]
  const { error: updErr } = await admin
    .from('manutencoes')
    .update({ [col]: [...arrAtual, url] })
    .eq('id', manutencaoId)

  if (updErr) {
    await admin.storage.from(BUCKET).remove([path])
    return { error: updErr.message }
  }

  revalidatePath(`/manutencoes/${manutencaoId}`)
  return { data: { url } }
}

export async function aprovarManutencao(
  id: string,
  input: AprovarManutencaoInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const parsed = AprovarManutencaoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const admin = createAdminClient()

  // Buscar manutenção + imóvel + proprietário
  const { data: manut, error: mErr } = await admin
    .from('manutencoes')
    .select(
      `
      id, status, imovel:imoveis!inner(
        id, nome_interno,
        proprietario:proprietarios!inner(id, user_id, nome, email)
      )
      `,
    )
    .eq('id', id)
    .maybeSingle()
  if (mErr) return { error: mErr.message }
  if (!manut) return { error: 'Manutenção não encontrada' }

  const imovel = (manut as unknown as {
    imovel: {
      id: string
      nome_interno: string
      proprietario: { id: string; user_id: string; nome: string; email: string }
    }
  }).imovel

  // Permissão: admin sempre pode; proprietário só pode se o imóvel for dele
  if (g.user.role === UserRole.Proprietario) {
    if (g.user.id !== imovel.proprietario.user_id) {
      return { error: 'Você não tem permissão para aprovar esta manutenção' }
    }
  } else if (g.user.role !== UserRole.Admin) {
    return { error: 'Sem permissão' }
  }

  const novoStatus = d.aprovacao
    ? StatusManutencao.Aprovada
    : StatusManutencao.Cancelada

  const { error: updErr } = await admin
    .from('manutencoes')
    .update({
      status: novoStatus,
      aprovacao_proprietario: d.aprovacao,
      observacao_proprietario: d.observacao_proprietario ?? null,
    })
    .eq('id', id)
  if (updErr) return { error: updErr.message }

  // E-mail ao admin
  if (process.env.ADMIN_EMAIL) {
    try {
      await notificarRespostaManutencao({
        admin_email: process.env.ADMIN_EMAIL,
        proprietario_nome: imovel.proprietario.nome,
        imovel_nome: imovel.nome_interno,
        aprovado: d.aprovacao,
        observacao: d.observacao_proprietario,
        manutencao_id: id,
      })
    } catch {
      // não bloqueia
    }
  }

  revalidatePath('/manutencoes')
  revalidatePath(`/manutencoes/${id}`)
  revalidatePath('/portal/manutencoes')
  return { data: { id } }
}

export async function getManutencoesPendentesAprovacao(
  proprietarioId?: string,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAuth()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('manutencoes')
    .select(SELECT_MANUTENCAO)
    .eq('status', StatusManutencao.AguardandoAprovacao)
    .order('data_abertura', { ascending: false })

  if (proprietarioId) {
    const { data: imoveis } = await supabase
      .from('imoveis')
      .select('id')
      .eq('proprietario_id', proprietarioId)
    const ids = (imoveis ?? []).map((i) => i.id)
    if (ids.length === 0) return { data: [] }
    query = query.in('imovel_id', ids)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}
