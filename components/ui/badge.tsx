import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
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

export enum BadgeTone {
  Neutral = 'neutral',
  Navy = 'navy',
  Gold = 'gold',
  Success = 'success',
  Warning = 'warning',
  Danger = 'danger',
  Info = 'info',
}

const toneClasses: Record<BadgeTone, string> = {
  [BadgeTone.Neutral]: 'bg-sand-200 text-navy-800 border-line-strong',
  [BadgeTone.Navy]: 'bg-navy-50 text-navy-700 border-navy-100',
  [BadgeTone.Gold]: 'bg-gold-50 text-gold-700 border-gold-100',
  [BadgeTone.Success]: 'bg-success-50 text-success-700 border-success-100',
  [BadgeTone.Warning]: 'bg-warning-50 text-warning-700 border-warning-100',
  [BadgeTone.Danger]: 'bg-danger-50 text-danger-700 border-danger-100',
  [BadgeTone.Info]: 'bg-info-50 text-info-700 border-info-100',
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  dot?: boolean
}

export function Badge({
  tone = BadgeTone.Neutral,
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
        />
      ) : null}
      {children}
    </span>
  )
}

const reservaTone: Record<StatusReserva, BadgeTone> = {
  [StatusReserva.Confirmada]: BadgeTone.Info,
  [StatusReserva.CheckinRealizado]: BadgeTone.Navy,
  [StatusReserva.CheckoutRealizado]: BadgeTone.Success,
  [StatusReserva.Cancelada]: BadgeTone.Danger,
  [StatusReserva.NoShow]: BadgeTone.Warning,
}

const reservaLabel: Record<StatusReserva, string> = {
  [StatusReserva.Confirmada]: 'Confirmada',
  [StatusReserva.CheckinRealizado]: 'Check-in realizado',
  [StatusReserva.CheckoutRealizado]: 'Check-out realizado',
  [StatusReserva.Cancelada]: 'Cancelada',
  [StatusReserva.NoShow]: 'No-show',
}

export function ReservaBadge({ status }: { status: StatusReserva }) {
  return (
    <Badge tone={reservaTone[status]} dot>
      {reservaLabel[status]}
    </Badge>
  )
}

const limpezaTone: Record<StatusLimpeza, BadgeTone> = {
  [StatusLimpeza.Agendada]: BadgeTone.Info,
  [StatusLimpeza.EmAndamento]: BadgeTone.Gold,
  [StatusLimpeza.Concluida]: BadgeTone.Success,
  [StatusLimpeza.Cancelada]: BadgeTone.Danger,
}

const limpezaLabel: Record<StatusLimpeza, string> = {
  [StatusLimpeza.Agendada]: 'Agendada',
  [StatusLimpeza.EmAndamento]: 'Em andamento',
  [StatusLimpeza.Concluida]: 'Concluída',
  [StatusLimpeza.Cancelada]: 'Cancelada',
}

export function LimpezaBadge({ status }: { status: StatusLimpeza }) {
  return (
    <Badge tone={limpezaTone[status]} dot>
      {limpezaLabel[status]}
    </Badge>
  )
}

const manutencaoTone: Record<StatusManutencao, BadgeTone> = {
  [StatusManutencao.Aberta]: BadgeTone.Warning,
  [StatusManutencao.EmAndamento]: BadgeTone.Gold,
  [StatusManutencao.AguardandoAprovacao]: BadgeTone.Info,
  [StatusManutencao.Aprovada]: BadgeTone.Navy,
  [StatusManutencao.Resolvida]: BadgeTone.Success,
  [StatusManutencao.Cancelada]: BadgeTone.Neutral,
}

const manutencaoLabel: Record<StatusManutencao, string> = {
  [StatusManutencao.Aberta]: 'Aberta',
  [StatusManutencao.EmAndamento]: 'Em andamento',
  [StatusManutencao.AguardandoAprovacao]: 'Aguardando aprovação',
  [StatusManutencao.Aprovada]: 'Aprovada',
  [StatusManutencao.Resolvida]: 'Resolvida',
  [StatusManutencao.Cancelada]: 'Cancelada',
}

export function ManutencaoBadge({ status }: { status: StatusManutencao }) {
  const isPulsing = status === StatusManutencao.AguardandoAprovacao
  return (
    <Badge
      tone={manutencaoTone[status]}
      dot
      className={cn(isPulsing && 'ring-1 ring-info-300 animate-pulse')}
    >
      {manutencaoLabel[status]}
    </Badge>
  )
}

const urgenciaTone: Record<UrgenciaManutencao, BadgeTone> = {
  [UrgenciaManutencao.Baixa]: BadgeTone.Neutral,
  [UrgenciaManutencao.Media]: BadgeTone.Warning,
  [UrgenciaManutencao.Urgente]: BadgeTone.Danger,
}

const urgenciaLabel: Record<UrgenciaManutencao, string> = {
  [UrgenciaManutencao.Baixa]: 'Baixa',
  [UrgenciaManutencao.Media]: 'Média',
  [UrgenciaManutencao.Urgente]: 'Urgente',
}

export function UrgenciaBadge({ urgencia }: { urgencia: UrgenciaManutencao }) {
  return <Badge tone={urgenciaTone[urgencia]}>{urgenciaLabel[urgencia]}</Badge>
}

const imovelTone: Record<StatusImovel, BadgeTone> = {
  [StatusImovel.Ativo]: BadgeTone.Success,
  [StatusImovel.Inativo]: BadgeTone.Neutral,
  [StatusImovel.Manutencao]: BadgeTone.Warning,
  [StatusImovel.Onboarding]: BadgeTone.Info,
}

const imovelLabel: Record<StatusImovel, string> = {
  [StatusImovel.Ativo]: 'Ativo',
  [StatusImovel.Inativo]: 'Inativo',
  [StatusImovel.Manutencao]: 'Em manutenção',
  [StatusImovel.Onboarding]: 'Onboarding',
}

export function ImovelBadge({ status }: { status: StatusImovel }) {
  return (
    <Badge tone={imovelTone[status]} dot>
      {imovelLabel[status]}
    </Badge>
  )
}

const contratoTone: Record<StatusContrato, BadgeTone> = {
  [StatusContrato.Ativo]: BadgeTone.Success,
  [StatusContrato.Inativo]: BadgeTone.Neutral,
  [StatusContrato.EmNegociacao]: BadgeTone.Gold,
  [StatusContrato.Encerrado]: BadgeTone.Danger,
}

const contratoLabel: Record<StatusContrato, string> = {
  [StatusContrato.Ativo]: 'Ativo',
  [StatusContrato.Inativo]: 'Inativo',
  [StatusContrato.EmNegociacao]: 'Em negociação',
  [StatusContrato.Encerrado]: 'Encerrado',
}

export function ContratoBadge({ status }: { status: StatusContrato }) {
  return (
    <Badge tone={contratoTone[status]} dot>
      {contratoLabel[status]}
    </Badge>
  )
}

const repasseTone: Record<StatusRepasse, BadgeTone> = {
  [StatusRepasse.Pendente]: BadgeTone.Warning,
  [StatusRepasse.Processando]: BadgeTone.Info,
  [StatusRepasse.Pago]: BadgeTone.Success,
}

const repasseLabel: Record<StatusRepasse, string> = {
  [StatusRepasse.Pendente]: 'Pendente',
  [StatusRepasse.Processando]: 'Processando',
  [StatusRepasse.Pago]: 'Pago',
}

export function RepasseBadge({ status }: { status: StatusRepasse }) {
  return (
    <Badge tone={repasseTone[status]} dot>
      {repasseLabel[status]}
    </Badge>
  )
}

const prioridadeTone: Record<PrioridadeAlerta, BadgeTone> = {
  [PrioridadeAlerta.Baixa]: BadgeTone.Neutral,
  [PrioridadeAlerta.Media]: BadgeTone.Info,
  [PrioridadeAlerta.Alta]: BadgeTone.Warning,
  [PrioridadeAlerta.Critica]: BadgeTone.Danger,
}

const prioridadeLabel: Record<PrioridadeAlerta, string> = {
  [PrioridadeAlerta.Baixa]: 'Baixa',
  [PrioridadeAlerta.Media]: 'Média',
  [PrioridadeAlerta.Alta]: 'Alta',
  [PrioridadeAlerta.Critica]: 'Crítica',
}

export function PrioridadeBadge({
  prioridade,
}: {
  prioridade: PrioridadeAlerta
}) {
  const isPulsing = prioridade === PrioridadeAlerta.Critica
  return (
    <Badge
      tone={prioridadeTone[prioridade]}
      dot
      className={cn(isPulsing && 'ring-1 ring-danger-300 animate-pulse')}
    >
      {prioridadeLabel[prioridade]}
    </Badge>
  )
}
