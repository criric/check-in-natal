'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  UpdateConfiguracaoSchema,
  type UpdateConfiguracaoInput,
} from '@/lib/validations'
import type { ActionResult, Configuracao, ConfiguracoesMap } from '@/types'

const CACHE_TAG_CONFIG = 'configuracoes'

const carregarConfiguracoesCached = unstable_cache(
  async (): Promise<ConfiguracoesMap> => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('configuracoes')
      .select('chave, valor')
    if (error || !data) return {}
    const mapa: ConfiguracoesMap = {}
    for (const row of data) {
      mapa[row.chave] = row.valor
    }
    return mapa
  },
  ['configuracoes-map'],
  { revalidate: 300, tags: [CACHE_TAG_CONFIG] },
)

export async function getConfiguracoes(): Promise<ConfiguracoesMap> {
  return carregarConfiguracoesCached()
}

export async function getConfiguracao(chave: string): Promise<string | undefined> {
  const mapa = await carregarConfiguracoesCached()
  return mapa[chave]
}

export async function getConfiguracaoNumerica(
  chave: string,
  fallback: number,
): Promise<number> {
  const valor = await getConfiguracao(chave)
  if (!valor) return fallback
  const n = Number(valor)
  return Number.isFinite(n) ? n : fallback
}

export async function listarConfiguracoesCompletas(): Promise<
  ActionResult<Configuracao[]>
> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('configuracoes')
    .select('chave, valor, descricao, tipo, updated_at')
    .order('chave', { ascending: true })

  if (error) return { error: error.message }
  return { data: (data ?? []) as Configuracao[] }
}

export async function updateConfiguracao(
  input: UpdateConfiguracaoInput,
): Promise<ActionResult<{ chave: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = UpdateConfiguracaoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from('configuracoes')
    .update({ valor: d.valor })
    .eq('chave', d.chave)

  if (error) return { error: error.message }

  revalidateTag(CACHE_TAG_CONFIG)
  revalidatePath('/configuracoes')
  return { data: { chave: d.chave } }
}
