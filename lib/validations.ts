import { z } from 'zod'
import {
  ExportTarget,
  MotivoBloqueio,
  Plataforma,
  StatusContrato,
  StatusGeralVistoria,
  StatusImovel,
  StatusLimpeza,
  StatusManutencao,
  StatusReserva,
  TipoImovel,
  TipoVistoria,
  UrgenciaManutencao,
} from '@/types'

export const ProprietarioSchema = z.object({
  cpf_cnpj: z.string().min(11).max(18),
  nome: z.string().min(2).max(255),
  email: z.string().email(),
  telefone: z.string().optional(),
  cidade_residencia: z.string().optional(),
  estado_residencia: z.string().length(2).optional(),
  status_contrato: z.nativeEnum(StatusContrato).default(StatusContrato.Ativo),
  observacoes: z.string().optional(),
})

export const ImovelSchema = z.object({
  proprietario_id: z.string().uuid(),
  nome_interno: z.string().min(2).max(100),
  endereco_completo: z.string().min(5),
  bairro: z.string().min(2).max(100),
  cep: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tipo: z.nativeEnum(TipoImovel),
  capacidade_hospedes: z.number().int().min(1).max(20),
  numero_quartos: z.number().int().min(0).optional(),
  numero_banheiros: z.number().int().min(0).optional(),
  andar: z.number().int().optional(),
  nome_condominio: z.string().optional(),
  status: z.nativeEnum(StatusImovel).default(StatusImovel.Ativo),
  comissao_percentual: z.number().min(0).max(100).default(20),
  plataformas: z.array(z.string()).optional(),
  instrucoes_checkin: z.string().optional(),
  codigo_acesso: z.string().optional(),
  wifi_nome: z.string().optional(),
  wifi_senha: z.string().optional(),
})

// Base sem refine — usado em updates parciais, onde nem todos os campos vêm.
export const ReservaBaseSchema = z.object({
  imovel_id: z.string().uuid(),
  plataforma: z.nativeEnum(Plataforma),
  id_externo: z.string().optional(),
  nome_hospede: z.string().optional(),
  email_hospede: z.string().email().optional().or(z.literal('')),
  telefone_hospede: z.string().optional(),
  data_checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  num_hospedes: z.number().int().min(1).default(1),
  valor_bruto: z.number().positive(),
  taxa_plataforma: z.number().min(0).default(0),
  observacoes_internas: z.string().optional(),
  nota_hospede: z.number().min(0).max(5).optional(),
  comentario_hospede: z.string().optional(),
})

export const ReservaSchema = ReservaBaseSchema.refine(
  (data) => data.data_checkout > data.data_checkin,
  {
    message: 'Data de checkout deve ser posterior ao checkin',
    path: ['data_checkout'],
  },
)

export const AtualizarStatusReservaSchema = z.object({
  status: z.nativeEnum(StatusReserva),
})

export const GerarRepasseSchema = z.object({
  imovel_id: z.string().uuid(),
  competencia_mes: z.number().int().min(1).max(12),
  competencia_ano: z.number().int().min(2024).max(2100),
  deducoes_manutencao: z.number().min(0).default(0),
  deducoes_outros: z.number().min(0).default(0),
  observacoes: z.string().optional(),
})

export const LeadSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  bairro_imovel: z.string().optional(),
  mensagem: z.string().optional(),
})

// ─── Fase 2 ─────────────────────────────────────────────────

export const LimpezaSchema = z.object({
  imovel_id: z.string().uuid(),
  reserva_id: z.string().uuid().optional(),
  data_agendada: z.string().datetime(),
  responsavel: z.string().min(2).optional(),
  observacoes: z.string().optional(),
})

const ChecklistLimpezaPartial = z
  .object({
    cozinha: z.boolean(),
    banheiros: z.boolean(),
    quartos: z.boolean(),
    sala: z.boolean(),
    varanda: z.boolean(),
    roupas_cama_trocadas: z.boolean(),
    toalhas_trocadas: z.boolean(),
    lixo_retirado: z.boolean(),
    amenidades_repostas: z.boolean(),
    fotos_registradas: z.boolean(),
  })
  .partial()

export const UpdateLimpezaSchema = z.object({
  status: z.nativeEnum(StatusLimpeza).optional(),
  responsavel: z.string().optional(),
  checklist: ChecklistLimpezaPartial.optional(),
  observacoes: z.string().optional(),
  duracao_minutos: z.number().int().positive().optional(),
  data_inicio: z.string().datetime().optional(),
  data_conclusao: z.string().datetime().optional(),
})

export const ManutencaoSchema = z.object({
  imovel_id: z.string().uuid(),
  tipo: z.string().max(50).optional(),
  descricao: z.string().min(5),
  urgencia: z.nativeEnum(UrgenciaManutencao).default(UrgenciaManutencao.Media),
  prestador_nome: z.string().optional(),
  prestador_contato: z.string().optional(),
  custo_estimado: z.number().positive().optional(),
  observacoes: z.string().optional(),
})

export const UpdateManutencaoSchema = z.object({
  status: z.nativeEnum(StatusManutencao).optional(),
  prestador_nome: z.string().optional(),
  prestador_contato: z.string().optional(),
  custo_estimado: z.number().positive().optional(),
  custo_real: z.number().positive().optional(),
  observacoes: z.string().optional(),
  data_resolucao: z.string().datetime().optional(),
})

export const AprovarManutencaoSchema = z.object({
  aprovacao: z.boolean(),
  observacao_proprietario: z.string().optional(),
})

const ChecklistVistoriaSchema = z.object({
  estrutura_paredes: z.nativeEnum(StatusGeralVistoria).nullable(),
  pisos: z.nativeEnum(StatusGeralVistoria).nullable(),
  janelas_portas: z.nativeEnum(StatusGeralVistoria).nullable(),
  eletrodomesticos: z.nativeEnum(StatusGeralVistoria).nullable(),
  moveis: z.nativeEnum(StatusGeralVistoria).nullable(),
  banheiros: z.nativeEnum(StatusGeralVistoria).nullable(),
  cozinha: z.nativeEnum(StatusGeralVistoria).nullable(),
  area_externa: z.nativeEnum(StatusGeralVistoria).nullable(),
  equipamentos_lazer: z.nativeEnum(StatusGeralVistoria).nullable(),
})

export const VistoriaSchema = z.object({
  imovel_id: z.string().uuid(),
  reserva_id: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoVistoria),
  data_vistoria: z.string().datetime(),
  responsavel: z.string().min(2).optional(),
  status_geral: z.nativeEnum(StatusGeralVistoria),
  checklist: ChecklistVistoriaSchema,
  observacoes: z.string().optional(),
})

export const BloquearDatasSchema = z
  .object({
    imovel_id: z.string().uuid(),
    data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    motivo_bloqueio: z.nativeEnum(MotivoBloqueio),
  })
  .refine((d) => d.data_fim >= d.data_inicio, {
    message: 'Data fim deve ser igual ou posterior à data início',
    path: ['data_fim'],
  })

export const FiltroRelatorioSchema = z.object({
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  imovel_id: z.string().uuid().optional(),
  proprietario_id: z.string().uuid().optional(),
  bairro: z.string().optional(),
})

// ─── Fase 3 ─────────────────────────────────────────────────

export const SimuladorSchema = z.object({
  bairro: z.string().min(2),
  tipo_imovel: z.nativeEnum(TipoImovel),
  capacidade: z.number().int().min(1).max(20),
})

export const EventoSazonalSchema = z
  .object({
    nome: z.string().min(2).max(100),
    data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    multiplicador_preco: z.number().min(0.1).max(5.0),
    descricao: z.string().optional(),
    recorrente_anual: z.boolean().default(false),
    ativo: z.boolean().default(true),
  })
  .refine((d) => d.data_fim >= d.data_inicio, {
    message: 'Data fim deve ser igual ou posterior à data início',
    path: ['data_fim'],
  })

export const UpdateConfiguracaoSchema = z.object({
  chave: z.string().min(1),
  valor: z.string().min(1),
})

export const ExportFiltroSchema = z.object({
  target: z.nativeEnum(ExportTarget),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  imovel_id: z.string().uuid().optional(),
  proprietario_id: z.string().uuid().optional(),
  status: z.string().optional(),
})

export type ProprietarioInput = z.infer<typeof ProprietarioSchema>
export type ImovelInput = z.infer<typeof ImovelSchema>
export type ReservaInput = z.infer<typeof ReservaSchema>
export type GerarRepasseInput = z.infer<typeof GerarRepasseSchema>
export type LeadInput = z.infer<typeof LeadSchema>
export type LimpezaInput = z.infer<typeof LimpezaSchema>
export type UpdateLimpezaInput = z.infer<typeof UpdateLimpezaSchema>
export type ManutencaoInput = z.infer<typeof ManutencaoSchema>
export type UpdateManutencaoInput = z.infer<typeof UpdateManutencaoSchema>
export type AprovarManutencaoInput = z.infer<typeof AprovarManutencaoSchema>
export type VistoriaInput = z.infer<typeof VistoriaSchema>
export type BloquearDatasInput = z.infer<typeof BloquearDatasSchema>
export type FiltroRelatorioInput = z.infer<typeof FiltroRelatorioSchema>
export type SimuladorInputSchema = z.infer<typeof SimuladorSchema>
export type EventoSazonalInput = z.infer<typeof EventoSazonalSchema>
export type UpdateConfiguracaoInput = z.infer<typeof UpdateConfiguracaoSchema>
export type ExportFiltroInput = z.infer<typeof ExportFiltroSchema>
