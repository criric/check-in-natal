'use server'

import Papa from 'papaparse'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './_guards'
import {
  ExportFiltroSchema,
  type ExportFiltroInput,
} from '@/lib/validations'
import { formatCpfCnpj, formatMesAno } from '@/lib/utils/formatters'
import { ExportTarget, StatusImovel, type ActionResult } from '@/types'

const BOM_UTF8 = '﻿'

function montarCSV(linhas: Record<string, unknown>[]): string {
  if (linhas.length === 0) {
    return BOM_UTF8
  }
  const csv = Papa.unparse(linhas, {
    quotes: true,
    delimiter: ';',
    header: true,
  })
  return BOM_UTF8 + csv
}

function fmtData(s?: string | null): string {
  if (!s) return ''
  return s.length >= 10 ? s.slice(0, 10) : s
}

function fmtBool(v?: boolean | null): string {
  if (v === true) return 'Sim'
  if (v === false) return 'Não'
  return ''
}

async function exportarImoveis(): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('imoveis')
    .select(
      `
      id, nome_interno, bairro, tipo, capacidade_hospedes, status,
      comissao_percentual, plataformas, created_at,
      proprietario:proprietarios!inner(nome)
      `,
    )
    .order('nome_interno', { ascending: true })

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const prop = row.proprietario as { nome?: string } | undefined
    const plataformas = Array.isArray(row.plataformas)
      ? (row.plataformas as string[]).join(', ')
      : ''
    return {
      ID: row.id,
      'Nome Interno': row.nome_interno,
      Bairro: row.bairro,
      Tipo: row.tipo,
      Capacidade: row.capacidade_hospedes,
      Proprietário: prop?.nome ?? '',
      Status: row.status,
      'Comissão (%)': row.comissao_percentual,
      Plataformas: plataformas,
      'Data Cadastro': fmtData(row.created_at as string | null),
    }
  })

  return montarCSV(linhas)
}

async function exportarProprietarios(): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('proprietarios')
    .select(
      `
      id, cpf_cnpj, nome, email, telefone, cidade_residencia, estado_residencia,
      data_entrada, status_contrato,
      imoveis(id, status)
      `,
    )
    .order('nome', { ascending: true })

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const imoveis = (row.imoveis as { status?: string }[] | undefined) ?? []
    const ativos = imoveis.filter((i) => i.status === StatusImovel.Ativo).length
    return {
      ID: row.id,
      'CPF/CNPJ': formatCpfCnpj(String(row.cpf_cnpj ?? '')),
      Nome: row.nome,
      'E-mail': row.email,
      Telefone: row.telefone ?? '',
      Cidade: row.cidade_residencia ?? '',
      Estado: row.estado_residencia ?? '',
      'Data Entrada': fmtData(row.data_entrada as string | null),
      'Status Contrato': row.status_contrato,
      'Qtd Imóveis Ativos': ativos,
    }
  })

  return montarCSV(linhas)
}

async function exportarReservas(filtro: ExportFiltroInput): Promise<string> {
  const admin = createAdminClient()
  let query = admin
    .from('reservas')
    .select(
      `
      id, plataforma, data_checkin, data_checkout, nome_hospede,
      valor_bruto, taxa_plataforma, valor_liquido_proprietario,
      status, nota_hospede, created_at,
      imovel:imoveis!inner(
        nome_interno,
        proprietario:proprietarios!inner(nome)
      )
      `,
    )
    .order('data_checkin', { ascending: false })

  if (filtro.data_inicio) query = query.gte('data_checkin', filtro.data_inicio)
  if (filtro.data_fim) query = query.lte('data_checkin', filtro.data_fim)
  if (filtro.imovel_id) query = query.eq('imovel_id', filtro.imovel_id)
  if (filtro.status) query = query.eq('status', filtro.status)

  const { data } = await query

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const imovel = row.imovel as
      | { nome_interno?: string; proprietario?: { nome?: string } }
      | undefined
    const noites = differenceInCalendarDays(
      parseISO(row.data_checkout as string),
      parseISO(row.data_checkin as string),
    )
    return {
      ID: row.id,
      Imóvel: imovel?.nome_interno ?? '',
      Proprietário: imovel?.proprietario?.nome ?? '',
      Plataforma: row.plataforma,
      'Check-in': fmtData(row.data_checkin as string),
      'Check-out': fmtData(row.data_checkout as string),
      Noites: noites,
      Hóspede: row.nome_hospede ?? '',
      'Valor Bruto': Number(row.valor_bruto ?? 0),
      'Taxa Plataforma': Number(row.taxa_plataforma ?? 0),
      'Valor Líquido': Number(row.valor_liquido_proprietario ?? 0),
      Status: row.status,
      'Nota Hóspede': row.nota_hospede ?? '',
      'Data Criação': fmtData(row.created_at as string | null),
    }
  })

  return montarCSV(linhas)
}

async function exportarRepasses(filtro: ExportFiltroInput): Promise<string> {
  const admin = createAdminClient()
  let query = admin
    .from('repasses')
    .select(
      `
      id, competencia_mes, competencia_ano, receita_bruta, comissao_gestora,
      deducoes_manutencao, deducoes_outros, valor_repassado, status, data_repasse,
      proprietario:proprietarios!inner(nome, cpf_cnpj),
      imovel:imoveis!inner(nome_interno)
      `,
    )
    .order('competencia_ano', { ascending: false })
    .order('competencia_mes', { ascending: false })

  if (filtro.imovel_id) query = query.eq('imovel_id', filtro.imovel_id)
  if (filtro.proprietario_id)
    query = query.eq('proprietario_id', filtro.proprietario_id)
  if (filtro.status) query = query.eq('status', filtro.status)

  const { data } = await query

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const prop = row.proprietario as
      | { nome?: string; cpf_cnpj?: string }
      | undefined
    const imovel = row.imovel as { nome_interno?: string } | undefined
    return {
      ID: row.id,
      Proprietário: prop?.nome ?? '',
      'CPF/CNPJ': formatCpfCnpj(prop?.cpf_cnpj ?? ''),
      Imóvel: imovel?.nome_interno ?? '',
      'Mês/Ano': formatMesAno(
        row.competencia_mes as number,
        row.competencia_ano as number,
      ),
      'Receita Bruta': Number(row.receita_bruta ?? 0),
      Comissão: Number(row.comissao_gestora ?? 0),
      'Deduções Manutenção': Number(row.deducoes_manutencao ?? 0),
      'Outras Deduções': Number(row.deducoes_outros ?? 0),
      'Valor Repassado': Number(row.valor_repassado ?? 0),
      Status: row.status,
      'Data Repasse': fmtData(row.data_repasse as string | null),
    }
  })

  return montarCSV(linhas)
}

async function exportarLimpezas(filtro: ExportFiltroInput): Promise<string> {
  const admin = createAdminClient()
  let query = admin
    .from('limpezas')
    .select(
      `
      id, data_agendada, responsavel, status, duracao_minutos, created_at,
      reserva_id,
      imovel:imoveis!inner(nome_interno)
      `,
    )
    .order('data_agendada', { ascending: false })

  if (filtro.data_inicio) query = query.gte('data_agendada', filtro.data_inicio)
  if (filtro.data_fim) query = query.lte('data_agendada', filtro.data_fim)
  if (filtro.imovel_id) query = query.eq('imovel_id', filtro.imovel_id)
  if (filtro.status) query = query.eq('status', filtro.status)

  const { data } = await query

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const imovel = row.imovel as { nome_interno?: string } | undefined
    return {
      ID: row.id,
      Imóvel: imovel?.nome_interno ?? '',
      'Reserva Vinculada': row.reserva_id ?? '',
      'Data Agendada': fmtData(row.data_agendada as string),
      Responsável: row.responsavel ?? '',
      Status: row.status,
      'Duração (min)': row.duracao_minutos ?? '',
      'Data Criação': fmtData(row.created_at as string | null),
    }
  })

  return montarCSV(linhas)
}

async function exportarManutencoes(filtro: ExportFiltroInput): Promise<string> {
  const admin = createAdminClient()
  let query = admin
    .from('manutencoes')
    .select(
      `
      id, tipo, urgencia, status, prestador_nome, custo_estimado, custo_real,
      aprovacao_proprietario, data_abertura, data_resolucao,
      imovel:imoveis!inner(nome_interno)
      `,
    )
    .order('data_abertura', { ascending: false })

  if (filtro.data_inicio) query = query.gte('data_abertura', filtro.data_inicio)
  if (filtro.data_fim) query = query.lte('data_abertura', filtro.data_fim)
  if (filtro.imovel_id) query = query.eq('imovel_id', filtro.imovel_id)
  if (filtro.status) query = query.eq('status', filtro.status)

  const { data } = await query

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const imovel = row.imovel as { nome_interno?: string } | undefined
    return {
      ID: row.id,
      Imóvel: imovel?.nome_interno ?? '',
      Tipo: row.tipo ?? '',
      Urgência: row.urgencia,
      Status: row.status,
      Prestador: row.prestador_nome ?? '',
      'Custo Estimado': row.custo_estimado != null ? Number(row.custo_estimado) : '',
      'Custo Real': row.custo_real != null ? Number(row.custo_real) : '',
      'Aprovação Proprietário': fmtBool(
        row.aprovacao_proprietario as boolean | null,
      ),
      'Data Abertura': fmtData(row.data_abertura as string | null),
      'Data Resolução': fmtData(row.data_resolucao as string | null),
    }
  })

  return montarCSV(linhas)
}

async function exportarAlertas(filtro: ExportFiltroInput): Promise<string> {
  const admin = createAdminClient()
  let query = admin
    .from('alertas')
    .select(
      `
      id, tipo, titulo, prioridade, lido, created_at,
      imovel:imoveis(nome_interno)
      `,
    )
    .order('created_at', { ascending: false })

  if (filtro.imovel_id) query = query.eq('imovel_id', filtro.imovel_id)
  if (filtro.status === 'lido') query = query.eq('lido', true)
  if (filtro.status === 'nao_lido') query = query.eq('lido', false)

  const { data } = await query

  const linhas = (data ?? []).map((row: Record<string, unknown>) => {
    const imovel = row.imovel as { nome_interno?: string } | undefined
    return {
      ID: row.id,
      Tipo: row.tipo,
      Título: row.titulo,
      Prioridade: row.prioridade,
      Lido: fmtBool(row.lido as boolean | null),
      Imóvel: imovel?.nome_interno ?? '',
      'Data Criação': fmtData(row.created_at as string | null),
    }
  })

  return montarCSV(linhas)
}

export async function exportarCSV(
  filtro: ExportFiltroInput,
): Promise<ActionResult<string>> {
  const g = await requireAdmin()
  if (!g.ok) return { error: g.error }

  const parsed = ExportFiltroSchema.safeParse(filtro)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Filtro inválido' }
  }
  const d = parsed.data

  switch (d.target) {
    case ExportTarget.Imoveis:
      return { data: await exportarImoveis() }
    case ExportTarget.Proprietarios:
      return { data: await exportarProprietarios() }
    case ExportTarget.Reservas:
      return { data: await exportarReservas(d) }
    case ExportTarget.Repasses:
      return { data: await exportarRepasses(d) }
    case ExportTarget.Limpezas:
      return { data: await exportarLimpezas(d) }
    case ExportTarget.Manutencoes:
      return { data: await exportarManutencoes(d) }
    case ExportTarget.Alertas:
      return { data: await exportarAlertas(d) }
    default:
      return { error: 'Target inválido' }
  }
}
