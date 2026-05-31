import {
  ContratoBadge,
  ImovelBadge,
  LimpezaBadge,
  ManutencaoBadge,
  PrioridadeBadge,
  RepasseBadge,
  ReservaBadge,
  UrgenciaBadge,
} from './badge'
import {
  PrioridadeAlerta,
  StatusContrato,
  StatusImovel,
  StatusLimpeza,
  StatusManutencao,
  StatusRepasse,
  StatusReserva,
  UrgenciaManutencao,
} from '@/types'

export enum BadgeStatusVariant {
  Imovel = 'imovel',
  Reserva = 'reserva',
  Limpeza = 'limpeza',
  Manutencao = 'manutencao',
  Urgencia = 'urgencia',
  Repasse = 'repasse',
  Contrato = 'contrato',
  Prioridade = 'prioridade',
}

type Props =
  | { variant: BadgeStatusVariant.Imovel; status: StatusImovel }
  | { variant: BadgeStatusVariant.Reserva; status: StatusReserva }
  | { variant: BadgeStatusVariant.Limpeza; status: StatusLimpeza }
  | { variant: BadgeStatusVariant.Manutencao; status: StatusManutencao }
  | { variant: BadgeStatusVariant.Urgencia; status: UrgenciaManutencao }
  | { variant: BadgeStatusVariant.Repasse; status: StatusRepasse }
  | { variant: BadgeStatusVariant.Contrato; status: StatusContrato }
  | { variant: BadgeStatusVariant.Prioridade; status: PrioridadeAlerta }

export function BadgeStatus(props: Props) {
  switch (props.variant) {
    case BadgeStatusVariant.Imovel:
      return <ImovelBadge status={props.status} />
    case BadgeStatusVariant.Reserva:
      return <ReservaBadge status={props.status} />
    case BadgeStatusVariant.Limpeza:
      return <LimpezaBadge status={props.status} />
    case BadgeStatusVariant.Manutencao:
      return <ManutencaoBadge status={props.status} />
    case BadgeStatusVariant.Urgencia:
      return <UrgenciaBadge urgencia={props.status} />
    case BadgeStatusVariant.Repasse:
      return <RepasseBadge status={props.status} />
    case BadgeStatusVariant.Contrato:
      return <ContratoBadge status={props.status} />
    case BadgeStatusVariant.Prioridade:
      return <PrioridadeBadge prioridade={props.status} />
  }
}
