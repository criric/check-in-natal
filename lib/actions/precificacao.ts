'use server'

import { revalidatePath } from 'next/cache'
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  EventoSazonalSchema,
  type EventoSazonalInput,
} from '@/lib/validations'
import {
  calcularPrecoBase,
  gerarCalendarioSugestoes,
} from '@/lib/utils/precificacao'
import { calcularTaxaOcupacao } from '@/lib/utils/metricas'
import {
  BloqueadoPor,
  StatusReserva,
  type ActionResult,
  type CalendarioPrecos,
  type EventoSazonal,
} from '@/types'

type ReservaHistorico = {
  valor_bruto: number
  data_checkin: string
  data_checkout: string
  status: string
}

type ImovelInfo = {
  id: string
  bairro: string
  tipo: string
  capacidade_hospedes: number
}

async function carregarImovelInfo(imovelId: string): Promise<ImovelInfo | undefined> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('imoveis')
    .select('id, bairro, tipo, capacidade_hospedes')
    .eq('id', imovelId)
    .maybeSingle()
  if (!data) return undefined
  return data as ImovelInfo
}

async function estimarPrecoBaseFallback(
  imovel: ImovelInfo,
): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('simulador_estimativas')
    .select('estimativa_min, estimativa_max, capacidade_min, capacidade_max')
    .eq('bairro', imovel.bairro)
    .eq('tipo_imovel', imovel.tipo)
    .lte('capacidade_min', imovel.capacidade_hospedes)
    .gte('capacidade_max', imovel.capacidade_hospedes)
    .limit(1)
    .maybeSingle()

  if (data) {
    const mediaMensal = (Number(data.estimativa_min) + Number(data.estimativa_max)) / 2
    return Number((mediaMensal / 18).toFixed(2))
  }
  return 250
}

async function carregarTaxaOcupacaoCarteira(): Promise<number> {
  const admin = createAdminClient()
  const hoje = new Date()
  const inicio = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fim = format(endOfMonth(hoje), 'yyyy-MM-dd')
  const dias = differenceInCalendarDays(endOfMonth(hoje), startOfMonth(hoje)) + 1

  const { data: imoveis } = await admin
    .from('imoveis')
    .select('id')
    .eq('status', 'ativo')

  const totalImoveis = imoveis?.length ?? 0
  if (totalImoveis === 0) return 0

  const { data: reservas } = await admin
    .from('reservas')
    .select('data_checkin, data_checkout, valor_bruto, status')
    .lte('data_checkin', fim)
    .gte('data_checkout', inicio)

  const taxaPorImovel = calcularTaxaOcupacao(
    (reservas ?? []) as ReservaHistorico[],
    dias * totalImoveis,
  )
  return taxaPorImovel
}

export async function getEventosAtivosNoPeriodo(
  dataInicio: string,
  dataFim: string,
): Promise<EventoSazonal[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('eventos_sazonais')
    .select('*')
    .eq('ativo', true)

  const inicio = parseISO(dataInicio)
  const fim = parseISO(dataFim)
  const eventos = (data ?? []) as EventoSazonal[]
  const filtrados: EventoSazonal[] = []

  for (const ev of eventos) {
    const evInicio = parseISO(ev.data_inicio)
    const evFim = parseISO(ev.data_fim)

    if (evInicio <= fim && evFim >= inicio) {
      filtrados.push(ev)
      continue
    }

    if (ev.recorrente_anual) {
      const anos = new Set<number>([inicio.getFullYear(), fim.getFullYear()])
      for (const ano of anos) {
        const inicioVirtual = new Date(ano, evInicio.getMonth(), evInicio.getDate())
        const fimVirtual = new Date(ano, evFim.getMonth(), evFim.getDate())
        if (inicioVirtual <= fim && fimVirtual >= inicio) {
          filtrados.push(ev)
          break
        }
      }
    }
  }

  return filtrados
}

export async function getSugestoesPreco(
  imovelId: string,
  dataInicio: string,
  dataFim: string,
): Promise<ActionResult<CalendarioPrecos[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)
  ) {
    return { error: 'Datas inválidas' }
  }

  const imovel = await carregarImovelInfo(imovelId)
  if (!imovel) return { error: 'Imóvel não encontrado' }

  const admin = createAdminClient()
  const hoje = new Date()
  const corte90d = format(subDays(hoje, 90), 'yyyy-MM-dd')

  const { data: reservasHist } = await admin
    .from('reservas')
    .select('valor_bruto, data_checkin, data_checkout, status')
    .eq('imovel_id', imovelId)
    .gte('data_checkin', corte90d)

  let precoBase = calcularPrecoBase((reservasHist ?? []) as ReservaHistorico[])
  if (precoBase === undefined) {
    precoBase = await estimarPrecoBaseFallback(imovel)
  }

  const taxaCarteira = await carregarTaxaOcupacaoCarteira()
  const eventosAtivos = await getEventosAtivosNoPeriodo(dataInicio, dataFim)

  const sugestoes = gerarCalendarioSugestoes({
    precoBase,
    dataInicio: parseISO(dataInicio),
    dataFim: parseISO(dataFim),
    taxaOcupacaoCarteira: taxaCarteira,
    eventosAtivos,
  })

  const { data: precosExistentes } = await admin
    .from('precos_calendario')
    .select('data, preco_noite, disponivel, motivo_bloqueio')
    .eq('imovel_id', imovelId)
    .gte('data', dataInicio)
    .lte('data', dataFim)

  const mapaPrecos = new Map<
    string,
    { preco_noite?: number; disponivel: boolean; motivo_bloqueio?: string }
  >()
  for (const p of precosExistentes ?? []) {
    mapaPrecos.set(p.data, {
      preco_noite: p.preco_noite != null ? Number(p.preco_noite) : undefined,
      disponivel: p.disponivel,
      motivo_bloqueio: p.motivo_bloqueio ?? undefined,
    })
  }

  const { data: reservasPeriodo } = await admin
    .from('reservas')
    .select('data_checkin, data_checkout, status')
    .eq('imovel_id', imovelId)
    .lt('data_checkin', format(addDays(parseISO(dataFim), 1), 'yyyy-MM-dd'))
    .gt('data_checkout', dataInicio)

  const diasComReserva = new Set<string>()
  for (const r of reservasPeriodo ?? []) {
    if (
      r.status === StatusReserva.Cancelada ||
      r.status === StatusReserva.NoShow
    ) {
      continue
    }
    let cursor = parseISO(r.data_checkin)
    const fimRes = parseISO(r.data_checkout)
    while (cursor < fimRes) {
      diasComReserva.add(format(cursor, 'yyyy-MM-dd'))
      cursor = addDays(cursor, 1)
    }
  }

  const calendario: CalendarioPrecos[] = sugestoes.map((s) => {
    const existente = mapaPrecos.get(s.data)
    const temReserva = diasComReserva.has(s.data)
    return {
      data: s.data,
      preco_noite: existente?.preco_noite,
      preco_sugerido: s.preco_sugerido,
      disponivel: existente?.disponivel ?? true,
      tem_reserva: temReserva,
      motivo_bloqueio: existente?.motivo_bloqueio,
      evento_ativo: s.evento_ativo,
    }
  })

  return { data: calendario }
}

export async function aplicarSugestoesPreco(
  imovelId: string,
  dataInicio: string,
  dataFim: string,
): Promise<ActionResult<{ dias_atualizados: number }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const sug = await getSugestoesPreco(imovelId, dataInicio, dataFim)
  if (sug.error || !sug.data) return { error: sug.error ?? 'Falha ao calcular' }

  const admin = createAdminClient()
  const registros = sug.data
    .filter((d) => !d.tem_reserva)
    .map((d) => ({
      imovel_id: imovelId,
      data: d.data,
      preco_noite: d.preco_sugerido,
      disponivel: d.disponivel,
      bloqueado_por: BloqueadoPor.Admin,
    }))

  if (registros.length === 0) return { data: { dias_atualizados: 0 } }

  const { error } = await admin
    .from('precos_calendario')
    .upsert(registros, { onConflict: 'imovel_id,data' })

  if (error) return { error: error.message }

  revalidatePath(`/imoveis/${imovelId}/precos`)
  return { data: { dias_atualizados: registros.length } }
}

export async function getEventosSazonais(): Promise<ActionResult<EventoSazonal[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos_sazonais')
    .select('*')
    .order('data_inicio', { ascending: true })

  if (error) return { error: error.message }
  return { data: (data ?? []) as EventoSazonal[] }
}

export async function createEventoSazonal(
  input: EventoSazonalInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = EventoSazonalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('eventos_sazonais')
    .insert({
      nome: d.nome,
      data_inicio: d.data_inicio,
      data_fim: d.data_fim,
      multiplicador_preco: d.multiplicador_preco,
      descricao: d.descricao ?? null,
      recorrente_anual: d.recorrente_anual,
      ativo: d.ativo,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Erro ao criar' }

  revalidatePath('/configuracoes/eventos')
  return { data: { id: data.id } }
}

export async function updateEventoSazonal(
  id: string,
  input: EventoSazonalInput,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = EventoSazonalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data

  const admin = createAdminClient()
  const { error } = await admin
    .from('eventos_sazonais')
    .update({
      nome: d.nome,
      data_inicio: d.data_inicio,
      data_fim: d.data_fim,
      multiplicador_preco: d.multiplicador_preco,
      descricao: d.descricao ?? null,
      recorrente_anual: d.recorrente_anual,
      ativo: d.ativo,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/configuracoes/eventos')
  return { data: { id } }
}

export async function deleteEventoSazonal(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const admin = createAdminClient()
  const { error } = await admin.from('eventos_sazonais').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/configuracoes/eventos')
  return { data: { id } }
}
