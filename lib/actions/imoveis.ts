'use server'

import { revalidatePath } from 'next/cache'
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  differenceInCalendarDays,
} from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import { ImovelSchema, type ImovelInput } from '@/lib/validations'
import { calcularTaxaOcupacao } from '@/lib/utils/metricas'
import {
  StatusImovel,
  StatusReserva,
  type ActionResult,
} from '@/types'

const FOTOS_BUCKET = 'imoveis-fotos'

export type ImoveisFilters = {
  status?: StatusImovel
  bairro?: string
  proprietario_id?: string
  orderBy?: 'nome_interno' | 'created_at' | 'bairro'
  asc?: boolean
}

export async function getImoveis(
  filters?: ImoveisFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const hoje = new Date()
  const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd')
  const diasMes = differenceInCalendarDays(endOfMonth(hoje), startOfMonth(hoje)) + 1

  const orderColumn = filters?.orderBy ?? 'nome_interno'
  const ascending = filters?.asc ?? true

  let query = supabase
    .from('imoveis')
    .select(
      `
      id, nome_interno, bairro, cidade, status, comissao_percentual,
      tipo, capacidade_hospedes, created_at,
      proprietario:proprietarios!inner(id, nome, email),
      reservas(id, data_checkin, data_checkout, valor_bruto, status)
    `,
    )
    .order(orderColumn, { ascending })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.bairro) query = query.ilike('bairro', `%${filters.bairro}%`)
  if (filters?.proprietario_id)
    query = query.eq('proprietario_id', filters.proprietario_id)

  const { data, error } = await query
  if (error) return { error: error.message }

  const enriched = (data ?? []).map((row) => {
    const reservas = (row.reservas ?? []) as {
      id: string
      data_checkin: string
      data_checkout: string
      valor_bruto: number
      status: string
    }[]

    // Próxima reserva futura
    const futuras = reservas
      .filter((r) => r.data_checkin >= format(hoje, 'yyyy-MM-dd'))
      .filter(
        (r) =>
          r.status !== StatusReserva.Cancelada &&
          r.status !== StatusReserva.NoShow,
      )
      .sort((a, b) => a.data_checkin.localeCompare(b.data_checkin))
    const proxima_reserva = futuras[0]
      ? {
          data_checkin: futuras[0].data_checkin,
          data_checkout: futuras[0].data_checkout,
        }
      : undefined

    // Reservas do mês corrente para ocupação
    const reservasMes = reservas.filter(
      (r) => r.data_checkin <= fimMes && r.data_checkout >= inicioMes,
    )
    const taxa_ocupacao_mes = calcularTaxaOcupacao(reservasMes, diasMes)

    const { reservas: _ignored, ...rest } = row as Record<string, unknown> & {
      reservas: unknown
    }
    return {
      ...rest,
      proxima_reserva,
      taxa_ocupacao_mes,
    }
  })

  return { data: enriched }
}

export async function getImovelById(id: string): Promise<ActionResult<unknown>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select(
      `
      *,
      proprietario:proprietarios!inner(*),
      fotos:fotos_imoveis(id, url, storage_path, legenda, ordem),
      reservas(id, data_checkin, data_checkout, valor_bruto, plataforma, status, nome_hospede)
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Imóvel não encontrado' }

  const reservas = (data.reservas ?? []) as {
    data_checkin: string
    created_at?: string
  }[]
  const ultimas = [...reservas]
    .sort((a, b) => b.data_checkin.localeCompare(a.data_checkin))
    .slice(0, 5)

  const fotos = ((data.fotos ?? []) as { ordem: number }[]).slice().sort(
    (a, b) => a.ordem - b.ordem,
  )

  return {
    data: {
      ...data,
      fotos,
      ultimas_reservas: ultimas,
    },
  }
}

export async function createImovel(
  input: ImovelInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ImovelSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  const supabase = await createClient()
  const { data: inserted, error } = await supabase
    .from('imoveis')
    .insert({
      proprietario_id: data.proprietario_id,
      nome_interno: data.nome_interno,
      endereco_completo: data.endereco_completo,
      bairro: data.bairro,
      cep: data.cep ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      tipo: data.tipo,
      capacidade_hospedes: data.capacidade_hospedes,
      numero_quartos: data.numero_quartos ?? null,
      numero_banheiros: data.numero_banheiros ?? null,
      andar: data.andar ?? null,
      nome_condominio: data.nome_condominio ?? null,
      status: data.status,
      comissao_percentual: data.comissao_percentual,
      plataformas: data.plataformas ?? null,
      instrucoes_checkin: data.instrucoes_checkin ?? null,
      codigo_acesso: data.codigo_acesso ?? null,
      wifi_nome: data.wifi_nome ?? null,
      wifi_senha: data.wifi_senha ?? null,
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: error?.message ?? 'Erro ao criar' }

  revalidatePath('/imoveis')
  return { data: { id: inserted.id } }
}

export async function updateImovel(
  id: string,
  input: Partial<ImovelInput>,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ImovelSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(d)) {
    if (v !== undefined) payload[k] = v
  }

  const { error } = await supabase.from('imoveis').update(payload).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${id}`)
  return { data: { id } }
}

export async function deleteImovel(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const { data: futuras, error: futErr } = await supabase
    .from('reservas')
    .select('id, status')
    .eq('imovel_id', id)
    .gte('data_checkin', hoje)

  if (futErr) return { error: futErr.message }
  const ativas = (futuras ?? []).filter(
    (r) =>
      r.status !== StatusReserva.Cancelada &&
      r.status !== StatusReserva.NoShow,
  )
  if (ativas.length > 0) {
    return {
      error: `Não é possível excluir: há ${ativas.length} reserva(s) futura(s)`,
    }
  }

  const { error } = await supabase.from('imoveis').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/imoveis')
  return { data: { id } }
}

export async function uploadFotoImovel(
  imovelId: string,
  file: File,
  legenda?: string,
): Promise<ActionResult<{ id: string; url: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storage_path = `${imovelId}/${Date.now()}-${safeName}`

  const arrayBuf = await file.arrayBuffer()
  const { error: upErr } = await admin.storage
    .from(FOTOS_BUCKET)
    .upload(storage_path, arrayBuf, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
  if (upErr) return { error: upErr.message }

  const { data: pub } = admin.storage.from(FOTOS_BUCKET).getPublicUrl(storage_path)
  const url = pub.publicUrl

  // Próxima ordem
  const { data: fotos } = await admin
    .from('fotos_imoveis')
    .select('ordem')
    .eq('imovel_id', imovelId)
  const maxOrdem = (fotos ?? []).reduce((m, f) => Math.max(m, f.ordem ?? 0), -1)

  const { data: inserted, error: insErr } = await admin
    .from('fotos_imoveis')
    .insert({
      imovel_id: imovelId,
      url,
      storage_path,
      legenda: legenda ?? null,
      ordem: maxOrdem + 1,
    })
    .select('id')
    .single()

  if (insErr || !inserted) {
    await admin.storage.from(FOTOS_BUCKET).remove([storage_path])
    return { error: insErr?.message ?? 'Erro ao registrar foto' }
  }

  revalidatePath(`/imoveis/${imovelId}`)
  return { data: { id: inserted.id, url } }
}

export async function deleteFotoImovel(
  fotoId: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const { data: foto, error: fetchErr } = await admin
    .from('fotos_imoveis')
    .select('id, storage_path, imovel_id')
    .eq('id', fotoId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!foto) return { error: 'Foto não encontrada' }

  await admin.storage.from(FOTOS_BUCKET).remove([foto.storage_path])
  const { error } = await admin.from('fotos_imoveis').delete().eq('id', fotoId)
  if (error) return { error: error.message }

  revalidatePath(`/imoveis/${foto.imovel_id}`)
  return { data: { id: fotoId } }
}

export async function reordenarFotos(
  imovelId: string,
  ordemIds: string[],
): Promise<ActionResult<{ ok: true }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  for (let i = 0; i < ordemIds.length; i++) {
    const { error } = await admin
      .from('fotos_imoveis')
      .update({ ordem: i })
      .eq('id', ordemIds[i])
      .eq('imovel_id', imovelId)
    if (error) return { error: error.message }
  }

  revalidatePath(`/imoveis/${imovelId}`)
  return { data: { ok: true } }
}
