import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { StatusReserva, type EventoSazonal, type FatorPreco, type SugestaoPreco } from '@/types'

export const SAZONALIDADE_NATAL: Record<number, number> = {
  1: 1.4,
  2: 1.2,
  3: 0.9,
  4: 1.1,
  5: 0.8,
  6: 0.85,
  7: 1.5,
  8: 0.9,
  9: 0.8,
  10: 0.85,
  11: 1.0,
  12: 1.8,
}

const NOME_MES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const PISO_FATOR = 0.6
const TETO_FATOR = 3.0

function arredondarParaMultiploDe5(valor: number): number {
  return Math.round(valor / 5) * 5
}

function fatorDiaSemana(data: Date): { multiplicador: number; descricao: string } {
  const dia = data.getDay()
  if (dia === 5 || dia === 6) {
    return { multiplicador: 1.2, descricao: 'Sexta/Sábado' }
  }
  if (dia === 0 || dia === 1) {
    return { multiplicador: 0.95, descricao: 'Domingo/Segunda' }
  }
  return { multiplicador: 0.9, descricao: 'Meio de semana' }
}

function fatorOcupacao(taxa: number): { multiplicador: number; descricao: string } {
  if (taxa > 80) return { multiplicador: 1.15, descricao: 'Demanda alta na carteira' }
  if (taxa >= 60) return { multiplicador: 1.0, descricao: 'Demanda neutra' }
  if (taxa >= 40) return { multiplicador: 0.95, descricao: 'Demanda média/baixa' }
  return { multiplicador: 0.85, descricao: 'Estimular reservas' }
}

function eventoAtivoNaData(
  data: Date,
  eventos: EventoSazonal[],
): EventoSazonal | undefined {
  const candidatos: { evento: EventoSazonal; multiplicador: number }[] = []
  for (const ev of eventos) {
    if (!ev.ativo) continue
    const inicio = parseISO(ev.data_inicio)
    const fim = parseISO(ev.data_fim)

    if (data >= inicio && data <= fim) {
      candidatos.push({ evento: ev, multiplicador: ev.multiplicador_preco })
      continue
    }

    if (ev.recorrente_anual) {
      const anoAtual = data.getFullYear()
      const inicioVirtual = new Date(
        anoAtual,
        inicio.getMonth(),
        inicio.getDate(),
      )
      let fimVirtual = new Date(anoAtual, fim.getMonth(), fim.getDate())
      if (fimVirtual < inicioVirtual) {
        fimVirtual = new Date(
          anoAtual + 1,
          fim.getMonth(),
          fim.getDate(),
        )
      }
      if (data >= inicioVirtual && data <= fimVirtual) {
        candidatos.push({ evento: ev, multiplicador: ev.multiplicador_preco })
      }
    }
  }

  if (candidatos.length === 0) return undefined
  candidatos.sort((a, b) => b.multiplicador - a.multiplicador)
  return candidatos[0].evento
}

export function calcularPrecoSugerido(params: {
  precoBase: number
  data: Date
  taxaOcupacaoCarteira: number
  eventosAtivos: EventoSazonal[]
}): SugestaoPreco {
  const fatores: FatorPreco[] = []

  const mes = params.data.getMonth() + 1
  const fSazonalidade = SAZONALIDADE_NATAL[mes] ?? 1.0
  fatores.push({
    nome: `Sazonalidade ${NOME_MES_PT[mes - 1] ?? ''}`,
    multiplicador: fSazonalidade,
    descricao: 'Demanda histórica mensal em Natal/RN',
  })

  const fDia = fatorDiaSemana(params.data)
  fatores.push({
    nome: 'Dia da semana',
    multiplicador: fDia.multiplicador,
    descricao: fDia.descricao,
  })

  const evento = eventoAtivoNaData(params.data, params.eventosAtivos)
  if (evento) {
    fatores.push({
      nome: `Evento: ${evento.nome}`,
      multiplicador: evento.multiplicador_preco,
      descricao: evento.descricao ?? evento.nome,
    })
  }

  const fOcup = fatorOcupacao(params.taxaOcupacaoCarteira)
  fatores.push({
    nome: 'Ocupação da carteira',
    multiplicador: fOcup.multiplicador,
    descricao: `${fOcup.descricao} (${params.taxaOcupacaoCarteira.toFixed(0)}%)`,
  })

  let bruto = params.precoBase
  for (const f of fatores) bruto *= f.multiplicador

  const piso = params.precoBase * PISO_FATOR
  const teto = params.precoBase * TETO_FATOR
  const clamped = Math.min(teto, Math.max(piso, bruto))
  const precoSugerido = arredondarParaMultiploDe5(clamped)

  return {
    data: formatISODate(params.data),
    preco_base: Number(params.precoBase.toFixed(2)),
    preco_sugerido: precoSugerido,
    fatores,
    evento_ativo: evento?.nome,
  }
}

export function gerarCalendarioSugestoes(params: {
  precoBase: number
  dataInicio: Date
  dataFim: Date
  taxaOcupacaoCarteira: number
  eventosAtivos: EventoSazonal[]
}): SugestaoPreco[] {
  const total = differenceInCalendarDays(params.dataFim, params.dataInicio)
  if (total < 0) return []

  const resultado: SugestaoPreco[] = []
  for (let i = 0; i <= total; i++) {
    const data = addDays(params.dataInicio, i)
    resultado.push(
      calcularPrecoSugerido({
        precoBase: params.precoBase,
        data,
        taxaOcupacaoCarteira: params.taxaOcupacaoCarteira,
        eventosAtivos: params.eventosAtivos,
      }),
    )
  }
  return resultado
}

export function calcularPrecoBase(
  reservas: Array<{
    valor_bruto: number
    data_checkin: string
    data_checkout: string
    status?: string
  }>,
): number | undefined {
  let receita = 0
  let noites = 0
  for (const r of reservas) {
    if (r.status === StatusReserva.Cancelada || r.status === StatusReserva.NoShow) {
      continue
    }
    const n = differenceInCalendarDays(
      parseISO(r.data_checkout),
      parseISO(r.data_checkin),
    )
    if (n <= 0) continue
    receita += Number(r.valor_bruto)
    noites += n
  }
  if (noites === 0) return undefined
  return Number((receita / noites).toFixed(2))
}

function formatISODate(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
