'use server'

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { SimuladorSchema } from '@/lib/validations'
import {
  TipoImovel,
  type ActionResult,
  type SimuladorInput,
  type SimuladorResultado,
} from '@/types'

const BAIRROS_LITORANEOS = new Set([
  'Ponta Negra',
  'Via Costeira',
  'Areia Preta',
  'Praia do Forte',
  'Praia do Meio',
  'Mãe Luiza',
])

const TAXAS_OCUPACAO: Record<string, number> = {
  'Ponta Negra': 72,
  'Via Costeira': 68,
}

const FALLBACKS_TIPO: Record<TipoImovel, { min: number; max: number }> = {
  [TipoImovel.Apartamento]: { min: 1200, max: 2200 },
  [TipoImovel.Casa]: { min: 2000, max: 3800 },
  [TipoImovel.Quarto]: { min: 800, max: 1400 },
  [TipoImovel.Studio]: { min: 1000, max: 1800 },
  [TipoImovel.Cobertura]: { min: 4500, max: 8000 },
}

function calcularTaxaOcupacaoBairro(bairro: string): number {
  if (TAXAS_OCUPACAO[bairro] !== undefined) return TAXAS_OCUPACAO[bairro]
  if (BAIRROS_LITORANEOS.has(bairro)) return 62
  return 55
}

export async function simularReceita(
  input: SimuladorInput,
): Promise<ActionResult<SimuladorResultado>> {
  const parsed = SimuladorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const admin = createAdminClient()
  const { data } = await admin
    .from('simulador_estimativas')
    .select('estimativa_min, estimativa_max')
    .eq('bairro', d.bairro)
    .eq('tipo_imovel', d.tipo_imovel)
    .lte('capacidade_min', d.capacidade)
    .gte('capacidade_max', d.capacidade)
    .limit(1)
    .maybeSingle()

  let estimativa_min: number
  let estimativa_max: number
  if (data) {
    estimativa_min = Number(data.estimativa_min)
    estimativa_max = Number(data.estimativa_max)
  } else {
    const fb = FALLBACKS_TIPO[d.tipo_imovel]
    estimativa_min = fb.min
    estimativa_max = fb.max
  }

  const taxaOcupacao =
    calcularTaxaOcupacaoBairro(d.bairro) ||
    (BAIRROS_LITORANEOS.has(d.bairro) ? 62 : 60)

  const media_mensal = Number(((estimativa_min + estimativa_max) / 2).toFixed(2))
  const ticket_medio_estimado = Number(
    (media_mensal / ((30 * taxaOcupacao) / 100)).toFixed(2),
  )

  return {
    data: {
      estimativa_min,
      estimativa_max,
      media_mensal,
      taxa_ocupacao_estimada: taxaOcupacao,
      ticket_medio_estimado,
      bairro: d.bairro,
      tipo_imovel: d.tipo_imovel,
    },
  }
}

const carregarBairrosCached = unstable_cache(
  async (): Promise<string[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('simulador_estimativas')
      .select('bairro')
    const set = new Set<string>()
    for (const row of data ?? []) {
      if (row.bairro) set.add(row.bairro)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  },
  ['simulador-bairros'],
  { revalidate: 3600, tags: ['simulador-bairros'] },
)

export async function getBairrosDisponiveis(): Promise<string[]> {
  return carregarBairrosCached()
}
