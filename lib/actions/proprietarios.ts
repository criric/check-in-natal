'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import { ProprietarioSchema, type ProprietarioInput } from '@/lib/validations'
import { enviarBoasVindasProprietario } from '@/lib/utils/emails'
import { getAppUrl } from '@/lib/utils/app-url'
import {
  StatusContrato,
  StatusImovel,
  UserRole,
  type ActionResult,
} from '@/types'

type ProprietarioListItem = {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string | null
  status_contrato: string
  data_entrada: string
  num_imoveis_ativos: number
}

export type ProprietariosFilters = {
  status_contrato?: StatusContrato
  busca?: string
}

export async function getProprietarios(
  filters?: ProprietariosFilters,
): Promise<ActionResult<ProprietarioListItem[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('proprietarios')
    .select(
      `
      id, nome, email, cpf_cnpj, telefone, status_contrato, data_entrada,
      imoveis:imoveis(id, status)
    `,
    )
    .order('nome', { ascending: true })

  if (filters?.status_contrato) {
    query = query.eq('status_contrato', filters.status_contrato)
  }
  if (filters?.busca) {
    const b = `%${filters.busca}%`
    query = query.or(`nome.ilike.${b},email.ilike.${b}`)
  }

  const { data, error } = await query
  if (error) return { error: error.message }

  const items: ProprietarioListItem[] = (data ?? []).map((row) => {
    const imoveis = (row.imoveis ?? []) as { id: string; status: string }[]
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      cpf_cnpj: row.cpf_cnpj,
      telefone: row.telefone,
      status_contrato: row.status_contrato,
      data_entrada: row.data_entrada,
      num_imoveis_ativos: imoveis.filter((i) => i.status === StatusImovel.Ativo)
        .length,
    }
  })

  return { data: items }
}

export async function getProprietarioById(
  id: string,
): Promise<ActionResult<unknown>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proprietarios')
    .select(
      `
      *,
      imoveis(id, nome_interno, bairro, status, comissao_percentual),
      repasses(id, competencia_mes, competencia_ano, valor_repassado, status)
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Proprietário não encontrado' }

  // Métricas agregadas
  const imoveis = (data.imoveis ?? []) as { id: string; status: string }[]
  const repasses = (data.repasses ?? []) as { valor_repassado: number }[]

  const totalRepassado = repasses.reduce(
    (s, r) => s + Number(r.valor_repassado ?? 0),
    0,
  )

  return {
    data: {
      ...data,
      metricas: {
        total_imoveis: imoveis.length,
        imoveis_ativos: imoveis.filter((i) => i.status === StatusImovel.Ativo)
          .length,
        total_repassado: totalRepassado,
      },
    },
  }
}

export async function createProprietario(
  input: ProprietarioInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ProprietarioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  const admin = createAdminClient()

  // Garante CPF/CNPJ único
  const { data: existeCpf } = await admin
    .from('proprietarios')
    .select('id')
    .eq('cpf_cnpj', data.cpf_cnpj)
    .maybeSingle()
  if (existeCpf) {
    return { error: 'CPF/CNPJ já cadastrado' }
  }

  // Garante e-mail único na tabela
  const { data: existeEmail } = await admin
    .from('proprietarios')
    .select('id')
    .eq('email', data.email)
    .maybeSingle()
  if (existeEmail) {
    return { error: 'E-mail já cadastrado' }
  }

  // Cria usuário Auth com role proprietario
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { role: UserRole.Proprietario, nome: data.nome },
  })

  if (authErr || !created.user) {
    return { error: authErr?.message ?? 'Erro ao criar usuário Auth' }
  }

  const userId = created.user.id

  const { data: inserted, error: insErr } = await admin
    .from('proprietarios')
    .insert({
      user_id: userId,
      cpf_cnpj: data.cpf_cnpj,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone ?? null,
      cidade_residencia: data.cidade_residencia ?? null,
      estado_residencia: data.estado_residencia ?? null,
      status_contrato: data.status_contrato,
      observacoes: data.observacoes ?? null,
    })
    .select('id')
    .single()

  if (insErr || !inserted) {
    // rollback do usuário Auth se a inserção falhar
    await admin.auth.admin.deleteUser(userId)
    return { error: insErr?.message ?? 'Erro ao inserir proprietário' }
  }

  // Gera magic link e dispara e-mail de boas-vindas
  try {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: data.email,
      options: {
        redirectTo: `${getAppUrl()}/portal`,
      },
    })
    const action_link = linkData?.properties?.action_link
    if (action_link) {
      await enviarBoasVindasProprietario(data.nome, data.email, action_link)
    }
  } catch {
    // Falha em e-mail não desfaz o cadastro
  }

  revalidatePath('/proprietarios')
  return { data: { id: inserted.id } }
}

export async function updateProprietario(
  id: string,
  input: Partial<ProprietarioInput>,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ProprietarioSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  const admin = createAdminClient()

  if (data.cpf_cnpj) {
    const { data: outro } = await admin
      .from('proprietarios')
      .select('id')
      .eq('cpf_cnpj', data.cpf_cnpj)
      .neq('id', id)
      .maybeSingle()
    if (outro) return { error: 'CPF/CNPJ já cadastrado para outro proprietário' }
  }

  const { error } = await admin
    .from('proprietarios')
    .update({
      ...(data.cpf_cnpj !== undefined && { cpf_cnpj: data.cpf_cnpj }),
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.telefone !== undefined && { telefone: data.telefone ?? null }),
      ...(data.cidade_residencia !== undefined && {
        cidade_residencia: data.cidade_residencia ?? null,
      }),
      ...(data.estado_residencia !== undefined && {
        estado_residencia: data.estado_residencia ?? null,
      }),
      ...(data.status_contrato !== undefined && {
        status_contrato: data.status_contrato,
      }),
      ...(data.observacoes !== undefined && {
        observacoes: data.observacoes ?? null,
      }),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/proprietarios')
  revalidatePath(`/proprietarios/${id}`)
  return { data: { id } }
}

export async function deleteProprietario(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()

  const { data: imoveis, error: imErr } = await admin
    .from('imoveis')
    .select('id, status')
    .eq('proprietario_id', id)

  if (imErr) return { error: imErr.message }

  const ativos = (imoveis ?? []).filter((i) => i.status === StatusImovel.Ativo)
  if (ativos.length > 0) {
    return {
      error: `Não é possível excluir: existem ${ativos.length} imóvel(eis) ativo(s) vinculado(s)`,
    }
  }

  // Captura user_id antes de deletar
  const { data: row } = await admin
    .from('proprietarios')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  const { error: delErr } = await admin
    .from('proprietarios')
    .delete()
    .eq('id', id)
  if (delErr) return { error: delErr.message }

  if (row?.user_id) {
    await admin.auth.admin.deleteUser(row.user_id)
  }

  revalidatePath('/proprietarios')
  return { data: { id } }
}
