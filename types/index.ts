// Enums espelhando os CHECK constraints do banco.
// Regra do projeto: nunca usar union de string literals com `|`.

export enum UserRole {
  Admin = 'admin',
  Proprietario = 'proprietario',
}

export enum StatusContrato {
  Ativo = 'ativo',
  Inativo = 'inativo',
  EmNegociacao = 'em_negociacao',
  Encerrado = 'encerrado',
}

export enum StatusImovel {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Manutencao = 'manutencao',
  Onboarding = 'onboarding',
}

export enum TipoImovel {
  Apartamento = 'apartamento',
  Casa = 'casa',
  Quarto = 'quarto',
  Studio = 'studio',
  Cobertura = 'cobertura',
}

export enum Plataforma {
  Airbnb = 'airbnb',
  Booking = 'booking',
  Direto = 'direto',
  Outro = 'outro',
}

export enum StatusReserva {
  Confirmada = 'confirmada',
  CheckinRealizado = 'checkin_realizado',
  CheckoutRealizado = 'checkout_realizado',
  Cancelada = 'cancelada',
  NoShow = 'no_show',
}

export enum StatusRepasse {
  Pendente = 'pendente',
  Processando = 'processando',
  Pago = 'pago',
}

export enum PrioridadeAlerta {
  Baixa = 'baixa',
  Media = 'media',
  Alta = 'alta',
  Critica = 'critica',
}

// Resultado padrão de Server Actions.
// Usamos optional em vez de `T | null` para evitar union types.
export type ActionResult<T> = {
  data?: T
  error?: string
}

// Tipos enriquecidos (com joins) — sem `|`, usando optional onde for nullable.

export type ImovelComProprietario = {
  id: string
  nome_interno: string
  bairro: string
  status: StatusImovel
  comissao_percentual: number
  proprietario: {
    id: string
    nome: string
    email: string
  }
}

export type ReservaComImovel = {
  id: string
  data_checkin: string
  data_checkout: string
  valor_bruto: number
  valor_liquido_proprietario?: number
  plataforma: Plataforma
  status: StatusReserva
  imovel: {
    id: string
    nome_interno: string
    bairro: string
  }
}

export type ResumoFinanceiroMes = {
  receita_bruta: number
  comissao_gestora: number
  deducoes: number
  valor_liquido: number
  num_reservas: number
  taxa_ocupacao: number
}

export type ReservaParaRepasse = {
  id: string
  data_checkin: string
  data_checkout: string
  noites: number
  plataforma: Plataforma
  valor_bruto: number
  taxa_plataforma: number
  valor_liquido: number
}

export type PreviewRepasse = {
  receita_bruta: number
  comissao_percentual: number
  comissao_valor: number
  valor_liquido_total: number
  num_reservas: number
  reservas: ReservaParaRepasse[]
}

export type CurrentUser = {
  id: string
  email: string
  role: UserRole
  proprietario_id?: string
}

// ─── Fase 2: Limpezas ───────────────────────────────────────
export enum StatusLimpeza {
  Agendada = 'agendada',
  EmAndamento = 'em_andamento',
  Concluida = 'concluida',
  Cancelada = 'cancelada',
}

export type ChecklistLimpeza = {
  cozinha: boolean
  banheiros: boolean
  quartos: boolean
  sala: boolean
  varanda: boolean
  roupas_cama_trocadas: boolean
  toalhas_trocadas: boolean
  lixo_retirado: boolean
  amenidades_repostas: boolean
  fotos_registradas: boolean
}

export type LimpezaComImovel = {
  id: string
  data_agendada: string
  status: StatusLimpeza
  responsavel?: string
  checklist: ChecklistLimpeza
  imovel: {
    id: string
    nome_interno: string
    bairro: string
  }
  reserva?: {
    id: string
    nome_hospede?: string
    data_checkin: string
    data_checkout: string
  }
}

// ─── Fase 2: Manutenções ────────────────────────────────────
export enum UrgenciaManutencao {
  Baixa = 'baixa',
  Media = 'media',
  Urgente = 'urgente',
}

export enum StatusManutencao {
  Aberta = 'aberta',
  EmAndamento = 'em_andamento',
  AguardandoAprovacao = 'aguardando_aprovacao',
  Aprovada = 'aprovada',
  Resolvida = 'resolvida',
  Cancelada = 'cancelada',
}

export type ManutencaoComImovel = {
  id: string
  tipo?: string
  descricao: string
  urgencia: UrgenciaManutencao
  status: StatusManutencao
  custo_estimado?: number
  custo_real?: number
  aprovacao_proprietario?: boolean
  data_abertura: string
  data_resolucao?: string
  fotos_antes: string[]
  fotos_depois: string[]
  imovel: {
    id: string
    nome_interno: string
    proprietario: {
      id: string
      nome: string
      email: string
    }
  }
}

// ─── Fase 2: Vistorias ──────────────────────────────────────
export enum StatusGeralVistoria {
  Ok = 'ok',
  Atencao = 'atencao',
  Critico = 'critico',
}

export enum TipoVistoria {
  Entrada = 'entrada',
  Saida = 'saida',
  Periodica = 'periodica',
}

export type ItemChecklistVistoria = StatusGeralVistoria | null

export type ChecklistVistoria = {
  estrutura_paredes: ItemChecklistVistoria
  pisos: ItemChecklistVistoria
  janelas_portas: ItemChecklistVistoria
  eletrodomesticos: ItemChecklistVistoria
  moveis: ItemChecklistVistoria
  banheiros: ItemChecklistVistoria
  cozinha: ItemChecklistVistoria
  area_externa: ItemChecklistVistoria
  equipamentos_lazer: ItemChecklistVistoria
}

// ─── Fase 2: Calendário ─────────────────────────────────────
export enum MotivoBloqueio {
  UsoProprio = 'uso_proprio',
  Reforma = 'reforma',
  Outro = 'outro',
}

export enum BloqueadoPor {
  Admin = 'admin',
  Proprietario = 'proprietario',
  Reserva = 'reserva',
}

// ─── Fase 2: Alertas ────────────────────────────────────────
export enum TipoAlerta {
  CheckinSemLimpeza = 'checkin_sem_limpeza',
  ImovelSemReserva = 'imovel_sem_reserva',
  RepassePendente = 'repasse_pendente',
  ManutencaoParada = 'manutencao_parada',
  ManutencaoAberta = 'manutencao_aberta',
  ContratoVencendo = 'contrato_vencendo',
  VistoriaCritica = 'vistoria_critica',
  VistoriaAtencao = 'vistoria_atencao',
}

// ─── Fase 2: Analytics ──────────────────────────────────────
export type MetricasCarteira = {
  revpar: number
  adr: number
  taxa_ocupacao: number
  lead_time_medio: number
  taxa_cancelamento: number
  receita_total: number
  custo_operacional: number
  margem_liquida: number
}

export type MetricasPorPlataforma = {
  plataforma: string
  num_reservas: number
  receita_total: number
  ticket_medio: number
  percentual: number
}

export type MetricasMensais = {
  mes: string
  receita_bruta: number
  receita_liquida: number
  noites_ocupadas: number
  taxa_ocupacao: number
  num_reservas: number
  nota_media: number
}

export type RankingImovel = {
  imovel_id: string
  nome_interno: string
  bairro: string
  revpar: number
  adr: number
  taxa_ocupacao: number
  receita_mes: number
  custo_operacional: number
  margem: number
  nota_media: number
}

// ─── Fase 3: Configurações ──────────────────────────────────
export enum TipoConfiguracao {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Json = 'json',
}

export type Configuracao = {
  chave: string
  valor: string
  descricao?: string
  tipo: TipoConfiguracao
  updated_at: string
}

export type ConfiguracoesMap = Record<string, string>

// ─── Fase 3: Precificação Dinâmica ──────────────────────────
export type EventoSazonal = {
  id: string
  nome: string
  data_inicio: string
  data_fim: string
  multiplicador_preco: number
  descricao?: string
  recorrente_anual: boolean
  ativo: boolean
}

export type FatorPreco = {
  nome: string
  multiplicador: number
  descricao: string
}

export type SugestaoPreco = {
  data: string
  preco_base: number
  preco_sugerido: number
  fatores: FatorPreco[]
  evento_ativo?: string
}

export type CalendarioPrecos = {
  data: string
  preco_noite?: number
  preco_sugerido: number
  disponivel: boolean
  tem_reserva: boolean
  motivo_bloqueio?: string
  evento_ativo?: string
}

// ─── Fase 3: Simulador ──────────────────────────────────────
export type SimuladorInput = {
  bairro: string
  tipo_imovel: TipoImovel
  capacidade: number
}

export type SimuladorResultado = {
  estimativa_min: number
  estimativa_max: number
  media_mensal: number
  taxa_ocupacao_estimada: number
  ticket_medio_estimado: number
  bairro: string
  tipo_imovel: string
}

// ─── Fase 3: Realtime ───────────────────────────────────────
export enum EventoRealtime {
  Insert = 'INSERT',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export type RealtimePayload<T> = {
  eventType: EventoRealtime
  new: T
  old: Partial<T>
  table: string
}

// ─── Fase 3: Export CSV ─────────────────────────────────────
export enum ExportTarget {
  Imoveis = 'imoveis',
  Proprietarios = 'proprietarios',
  Reservas = 'reservas',
  Repasses = 'repasses',
  Limpezas = 'limpezas',
  Manutencoes = 'manutencoes',
  Alertas = 'alertas',
}

export type ExportFiltro = {
  target: ExportTarget
  data_inicio?: string
  data_fim?: string
  imovel_id?: string
  proprietario_id?: string
  status?: string
}
