import { differenceInCalendarDays, parseISO } from 'date-fns'
import { StatusReserva } from '@/types'

type ReservaParaMetricas = {
  data_checkin: string
  data_checkout: string
  valor_bruto: number
  status: string
}

// Taxa de ocupação: noites ocupadas / noites disponíveis no período.
// Considera apenas reservas não canceladas / não no-show.
export function calcularTaxaOcupacao(
  reservas: ReservaParaMetricas[],
  diasPeriodo: number,
): number {
  if (diasPeriodo <= 0) return 0
  const noitesOcupadas = reservas
    .filter(
      (r) =>
        r.status !== StatusReserva.Cancelada &&
        r.status !== StatusReserva.NoShow,
    )
    .reduce((sum, r) => {
      const noites = differenceInCalendarDays(
        parseISO(r.data_checkout),
        parseISO(r.data_checkin),
      )
      return sum + Math.max(noites, 0)
    }, 0)
  return Number(((noitesOcupadas / diasPeriodo) * 100).toFixed(2))
}

// Average Daily Rate.
export function calcularADR(receita: number, noitesVendidas: number): number {
  if (noitesVendidas <= 0) return 0
  return Number((receita / noitesVendidas).toFixed(2))
}

// Revenue Per Available Room.
export function calcularRevPAR(
  receita: number,
  numImoveis: number,
  diasPeriodo: number,
): number {
  if (numImoveis <= 0 || diasPeriodo <= 0) return 0
  return Number((receita / (numImoveis * diasPeriodo)).toFixed(2))
}
