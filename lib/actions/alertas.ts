'use server'

import { revalidatePath } from 'next/cache'
import { addDays, addMonths, format, parseISO, subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  PrioridadeAlerta,
  StatusLimpeza,
  StatusManutencao,
  StatusRepasse,
  StatusReserva,
  StatusImovel,
  StatusContrato,
  TipoAlerta,
  type ActionResult,
} from '@/types'

const ORDEM_PRIORIDADE: Record<string, number> = {
  [PrioridadeAlerta.Critica]: 0,
  [PrioridadeAlerta.Alta]: 1,
  [PrioridadeAlerta.Media]: 2,
  [PrioridadeAlerta.Baixa]: 3,
}

export type AlertasFilters = {
  lido?: boolean
  prioridade?: PrioridadeAlerta
  tipo?: TipoAlerta
  imovel_id?: string
}

export async function getAlertas(
  filters?: AlertasFilters,
): Promise<ActionResult<unknown[]>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  let query = supabase
    .from('alertas')
    .select('*, imovel:imoveis(id, nome_interno, bairro)')
    .order('created_at', { ascending: false })

  if (filters?.lido !== undefined) query = query.eq('lido', filters.lido)
  if (filters?.prioridade) query = query.eq('prioridade', filters.prioridade)
  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.imovel_id) query = query.eq('imovel_id', filters.imovel_id)

  const { data, error } = await query
  if (error) return { error: error.message }

  const sorted = (data ?? []).slice().sort((a, b) => {
    if (a.lido !== b.lido) return a.lido ? 1 : -1
    const pa = ORDEM_PRIORIDADE[a.prioridade] ?? 9
    const pb = ORDEM_PRIORIDADE[b.prioridade] ?? 9
    if (pa !== pb) return pa - pb
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  return { data: sorted }
}

export async function marcarAlertaLido(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('alertas')
    .update({ lido: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data: { id } }
}

export async function marcarTodosLidos(): Promise<ActionResult<{ ok: true }>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('alertas')
    .update({ lido: true })
    .eq('lido', false)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data: { ok: true } }
}

export async function getContagemAlertasNaoLidos(): Promise<
  ActionResult<number>
> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('alertas')
    .select('id', { count: 'exact', head: true })
    .eq('lido', false)

  if (error) return { error: error.message }
  return { data: count ?? 0 }
}

// ─── Verificações executadas pelo cron job diário ───────────

async function jaTemAlertaRecente(
  tipo: TipoAlerta,
  imovelId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const desde = subDays(new Date(), 1).toISOString()
  const { data } = await admin
    .from('alertas')
    .select('id')
    .eq('tipo', tipo)
    .eq('imovel_id', imovelId)
    .gte('created_at', desde)
    .limit(1)
  return (data ?? []).length > 0
}

async function jaTemAlertaNaoLido(
  tipo: TipoAlerta,
  imovelId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('alertas')
    .select('id')
    .eq('tipo', tipo)
    .eq('imovel_id', imovelId)
    .eq('lido', false)
    .limit(1)
  return (data ?? []).length > 0
}

export async function verificarCheckinSemLimpeza(): Promise<number> {
  const admin = createAdminClient()
  const hoje = new Date()
  const limite = addDays(hoje, 2)

  const { data: reservas } = await admin
    .from('reservas')
    .select('id, imovel_id, data_checkin, status')
    .in('status', [StatusReserva.Confirmada, StatusReserva.CheckinRealizado])
    .gte('data_checkin', format(hoje, 'yyyy-MM-dd'))
    .lte('data_checkin', format(limite, 'yyyy-MM-dd'))

  let criados = 0
  for (const r of reservas ?? []) {
    const { data: limpezas } = await admin
      .from('limpezas')
      .select('id, status')
      .eq('reserva_id', r.id)
      .eq('status', StatusLimpeza.Concluida)
      .limit(1)
    if ((limpezas ?? []).length > 0) continue

    if (await jaTemAlertaRecente(TipoAlerta.CheckinSemLimpeza, r.imovel_id))
      continue

    const horas = Math.max(
      Math.round(
        (parseISO(r.data_checkin).getTime() - hoje.getTime()) / 3600000,
      ),
      0,
    )
    await admin.from('alertas').insert({
      tipo: TipoAlerta.CheckinSemLimpeza,
      prioridade: PrioridadeAlerta.Critica,
      titulo: `Check-in em ${horas}h sem limpeza confirmada`,
      imovel_id: r.imovel_id,
      lido: false,
    })
    criados += 1
  }
  return criados
}

export async function verificarImoveisSemReserva(): Promise<number> {
  const admin = createAdminClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const corte = format(subDays(new Date(), 15), 'yyyy-MM-dd')

  const { data: imoveis } = await admin
    .from('imoveis')
    .select('id')
    .eq('status', StatusImovel.Ativo)

  let criados = 0
  for (const imv of imoveis ?? []) {
    const { data: futuras } = await admin
      .from('reservas')
      .select('id, status')
      .eq('imovel_id', imv.id)
      .gte('data_checkin', hoje)
      .not('status', 'in', `(${StatusReserva.Cancelada},${StatusReserva.NoShow})`)
      .limit(1)
    if ((futuras ?? []).length > 0) continue

    // Última reserva
    const { data: ultima } = await admin
      .from('reservas')
      .select('data_checkout')
      .eq('imovel_id', imv.id)
      .order('data_checkout', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (ultima && ultima.data_checkout > corte) continue

    if (await jaTemAlertaNaoLido(TipoAlerta.ImovelSemReserva, imv.id)) continue

    await admin.from('alertas').insert({
      tipo: TipoAlerta.ImovelSemReserva,
      prioridade: PrioridadeAlerta.Media,
      titulo: 'Imóvel sem reservas futuras há mais de 15 dias',
      imovel_id: imv.id,
      lido: false,
    })
    criados += 1
  }
  return criados
}

export async function verificarRepassesPendentes(): Promise<number> {
  const admin = createAdminClient()
  const hoje = new Date()
  if (hoje.getDate() < 5) return 0

  const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth()
  const anoMesAnterior =
    hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()

  const inicio = `${anoMesAnterior}-${String(mesAnterior).padStart(2, '0')}-01`
  const ultimoDia = new Date(anoMesAnterior, mesAnterior, 0).getDate()
  const fim = `${anoMesAnterior}-${String(mesAnterior).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  const { data: imoveis } = await admin
    .from('imoveis')
    .select('id')
    .eq('status', StatusImovel.Ativo)

  let criados = 0
  for (const imv of imoveis ?? []) {
    const { data: reservas } = await admin
      .from('reservas')
      .select('id, status')
      .eq('imovel_id', imv.id)
      .gte('data_checkout', inicio)
      .lte('data_checkout', fim)
      .limit(1)
    if ((reservas ?? []).length === 0) continue

    const { data: repasse } = await admin
      .from('repasses')
      .select('id, status')
      .eq('imovel_id', imv.id)
      .eq('competencia_mes', mesAnterior)
      .eq('competencia_ano', anoMesAnterior)
      .maybeSingle()
    if (repasse && repasse.status === StatusRepasse.Pago) continue

    if (await jaTemAlertaNaoLido(TipoAlerta.RepassePendente, imv.id)) continue

    await admin.from('alertas').insert({
      tipo: TipoAlerta.RepassePendente,
      prioridade: PrioridadeAlerta.Alta,
      titulo: `Repasse pendente referente a ${String(mesAnterior).padStart(2, '0')}/${anoMesAnterior}`,
      imovel_id: imv.id,
      lido: false,
    })
    criados += 1
  }
  return criados
}

export async function verificarManutencoesPaadas(): Promise<number> {
  const admin = createAdminClient()
  const corte = subDays(new Date(), 7).toISOString()

  const { data: manuts } = await admin
    .from('manutencoes')
    .select('id, imovel_id, status, data_abertura')
    .in('status', [StatusManutencao.Aberta, StatusManutencao.EmAndamento])
    .lte('data_abertura', corte)

  let criados = 0
  for (const m of manuts ?? []) {
    if (await jaTemAlertaNaoLido(TipoAlerta.ManutencaoParada, m.imovel_id))
      continue
    await admin.from('alertas').insert({
      tipo: TipoAlerta.ManutencaoParada,
      prioridade: PrioridadeAlerta.Media,
      titulo: 'Manutenção parada há mais de 7 dias',
      imovel_id: m.imovel_id,
      lido: false,
    })
    criados += 1
  }
  return criados
}

export async function verificarContratosVencendo(): Promise<number> {
  const admin = createAdminClient()
  const hoje = new Date()
  const limite = addDays(hoje, 30)

  const { data: props } = await admin
    .from('proprietarios')
    .select('id, data_entrada, status_contrato')
    .eq('status_contrato', StatusContrato.Ativo)

  let criados = 0
  for (const p of props ?? []) {
    if (!p.data_entrada) continue
    const dataEntrada = parseISO(p.data_entrada)
    let vencimento = addMonths(dataEntrada, 12)
    while (vencimento < hoje) {
      vencimento = addMonths(vencimento, 12)
    }
    if (vencimento > limite) continue

    // Vincular ao primeiro imóvel ativo do proprietário (alerta exige imovel_id)
    const { data: imv } = await admin
      .from('imoveis')
      .select('id')
      .eq('proprietario_id', p.id)
      .eq('status', StatusImovel.Ativo)
      .limit(1)
      .maybeSingle()
    if (!imv) continue

    if (await jaTemAlertaNaoLido(TipoAlerta.ContratoVencendo, imv.id)) continue

    await admin.from('alertas').insert({
      tipo: TipoAlerta.ContratoVencendo,
      prioridade: PrioridadeAlerta.Baixa,
      titulo: `Contrato vence em ${format(vencimento, 'dd/MM/yyyy')}`,
      imovel_id: imv.id,
      lido: false,
    })
    criados += 1
  }
  return criados
}
