'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import { VistoriaSchema, type VistoriaInput } from '@/lib/validations'
import {
  PrioridadeAlerta,
  StatusGeralVistoria,
  TipoAlerta,
  TipoVistoria,
  type ActionResult,
} from '@/types'

const BUCKET = 'vistorias-fotos'

const SELECT_VISTORIA = `
  *,
  imovel:imoveis!inner(id, nome_interno, bairro),
  reserva:reservas(id, nome_hospede, data_checkin, data_checkout)
`

export type VistoriasFilters = {
  imovel_id?: string
  tipo?: TipoVistoria
  status_geral?: StatusGeralVistoria
  data_inicio?: string
  data_fim?: string
}

export async function getVistorias(
  filters?: VistoriasFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('vistorias')
    .select(SELECT_VISTORIA)
    .order('data_vistoria', { ascending: false })

  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)
  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.status_geral) query = query.eq('status_geral', filters.status_geral)
  if (filters?.data_inicio) query = query.gte('data_vistoria', filters.data_inicio)
  if (filters?.data_fim) query = query.lte('data_vistoria', filters.data_fim)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getVistoriaById(
  id: string,
): Promise<ActionResult<unknown>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vistorias')
    .select(SELECT_VISTORIA)
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Vistoria não encontrada' }
  return { data }
}

export async function createVistoria(
  input: VistoriaInput,
  fotos?: File[],
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = VistoriaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const admin = createAdminClient()

  // Cria com fotos vazias; carrega depois e atualiza array
  const { data: inserted, error } = await admin
    .from('vistorias')
    .insert({
      imovel_id: d.imovel_id,
      reserva_id: d.reserva_id ?? null,
      tipo: d.tipo,
      data_vistoria: d.data_vistoria,
      responsavel: d.responsavel ?? null,
      status_geral: d.status_geral,
      checklist: d.checklist,
      observacoes: d.observacoes ?? null,
      fotos: [],
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: error?.message ?? 'Erro ao criar' }

  // Upload das fotos, se houver
  if (fotos && fotos.length > 0) {
    const urls: string[] = []
    for (const file of fotos) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${inserted.id}/${Date.now()}-${safeName}`
      const buf = await file.arrayBuffer()
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, buf, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })
      if (!upErr) {
        const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
        urls.push(pub.publicUrl)
      }
    }
    if (urls.length > 0) {
      await admin.from('vistorias').update({ fotos: urls }).eq('id', inserted.id)
    }
  }

  // Alerta conforme status_geral
  if (
    d.status_geral === StatusGeralVistoria.Critico ||
    d.status_geral === StatusGeralVistoria.Atencao
  ) {
    const prioridade =
      d.status_geral === StatusGeralVistoria.Critico
        ? PrioridadeAlerta.Critica
        : PrioridadeAlerta.Alta
    const tipoAlerta =
      d.status_geral === StatusGeralVistoria.Critico
        ? TipoAlerta.VistoriaCritica
        : TipoAlerta.VistoriaAtencao

    await admin.from('alertas').insert({
      tipo: tipoAlerta,
      prioridade,
      titulo: `Vistoria ${d.status_geral} registrada`,
      imovel_id: d.imovel_id,
      lido: false,
    })
  }

  revalidatePath('/vistorias')
  return { data: { id: inserted.id } }
}

export async function uploadFotoVistoria(
  vistoriaId: string,
  file: File,
): Promise<ActionResult<{ url: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${vistoriaId}/${Date.now()}-${safeName}`
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
    .from('vistorias')
    .select('fotos')
    .eq('id', vistoriaId)
    .maybeSingle()

  const fotosAtuais = (atual?.fotos ?? []) as string[]
  const { error: updErr } = await admin
    .from('vistorias')
    .update({ fotos: [...fotosAtuais, url] })
    .eq('id', vistoriaId)

  if (updErr) {
    await admin.storage.from(BUCKET).remove([path])
    return { error: updErr.message }
  }

  revalidatePath(`/vistorias/${vistoriaId}`)
  return { data: { url } }
}
