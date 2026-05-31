// Placeholder gerado manualmente. Substituir pelo output de:
//   npx supabase gen types typescript --project-id SEU_PROJECT_ID > types/database.types.ts
//
// Mantemos um shape mínimo aqui para que os clients fiquem tipados enquanto
// o time não roda o gerador na primeira vez.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      proprietarios: {
        Row: {
          id: string
          user_id: string | null
          cpf_cnpj: string
          nome: string
          email: string
          telefone: string | null
          cidade_residencia: string | null
          estado_residencia: string | null
          data_entrada: string
          status_contrato: string
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cpf_cnpj: string
          nome: string
          email: string
          telefone?: string | null
          cidade_residencia?: string | null
          estado_residencia?: string | null
          data_entrada?: string
          status_contrato?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['proprietarios']['Insert']>
        Relationships: []
      }
      imoveis: {
        Row: {
          id: string
          proprietario_id: string
          nome_interno: string
          endereco_completo: string
          bairro: string
          cidade: string
          estado: string
          cep: string | null
          latitude: number | null
          longitude: number | null
          tipo: string | null
          capacidade_hospedes: number
          numero_quartos: number | null
          numero_banheiros: number | null
          andar: number | null
          nome_condominio: string | null
          status: string
          comissao_percentual: number
          plataformas: string[] | null
          amenidades: Json
          instrucoes_checkin: string | null
          codigo_acesso: string | null
          wifi_nome: string | null
          wifi_senha: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proprietario_id: string
          nome_interno: string
          endereco_completo: string
          bairro: string
          cidade?: string
          estado?: string
          cep?: string | null
          latitude?: number | null
          longitude?: number | null
          tipo?: string | null
          capacidade_hospedes: number
          numero_quartos?: number | null
          numero_banheiros?: number | null
          andar?: number | null
          nome_condominio?: string | null
          status?: string
          comissao_percentual?: number
          plataformas?: string[] | null
          amenidades?: Json
          instrucoes_checkin?: string | null
          codigo_acesso?: string | null
          wifi_nome?: string | null
          wifi_senha?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['imoveis']['Insert']>
        Relationships: []
      }
      fotos_imoveis: {
        Row: {
          id: string
          imovel_id: string
          url: string
          storage_path: string
          legenda: string | null
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          imovel_id: string
          url: string
          storage_path: string
          legenda?: string | null
          ordem?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['fotos_imoveis']['Insert']>
        Relationships: []
      }
      reservas: {
        Row: {
          id: string
          imovel_id: string
          plataforma: string | null
          id_externo: string | null
          nome_hospede: string | null
          email_hospede: string | null
          telefone_hospede: string | null
          data_checkin: string
          data_checkout: string
          num_hospedes: number
          valor_bruto: number
          taxa_plataforma: number
          valor_liquido_proprietario: number | null
          status: string
          nota_hospede: number | null
          comentario_hospede: string | null
          observacoes_internas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          imovel_id: string
          plataforma?: string | null
          id_externo?: string | null
          nome_hospede?: string | null
          email_hospede?: string | null
          telefone_hospede?: string | null
          data_checkin: string
          data_checkout: string
          num_hospedes?: number
          valor_bruto: number
          taxa_plataforma?: number
          valor_liquido_proprietario?: number | null
          status?: string
          nota_hospede?: number | null
          comentario_hospede?: string | null
          observacoes_internas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reservas']['Insert']>
        Relationships: []
      }
      repasses: {
        Row: {
          id: string
          proprietario_id: string
          imovel_id: string
          competencia_mes: number
          competencia_ano: number
          receita_bruta: number
          comissao_gestora: number
          deducoes_manutencao: number
          deducoes_outros: number
          valor_repassado: number
          data_repasse: string | null
          status: string
          pdf_url: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          proprietario_id: string
          imovel_id: string
          competencia_mes: number
          competencia_ano: number
          receita_bruta?: number
          comissao_gestora?: number
          deducoes_manutencao?: number
          deducoes_outros?: number
          valor_repassado?: number
          data_repasse?: string | null
          status?: string
          pdf_url?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['repasses']['Insert']>
        Relationships: []
      }
      alertas: {
        Row: {
          id: string
          tipo: string
          titulo: string
          mensagem: string | null
          imovel_id: string | null
          proprietario_id: string | null
          prioridade: string
          lido: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tipo: string
          titulo: string
          mensagem?: string | null
          imovel_id?: string | null
          proprietario_id?: string | null
          prioridade?: string
          lido?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['alertas']['Insert']>
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          nome: string
          telefone: string
          email: string | null
          bairro_imovel: string | null
          mensagem: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          email?: string | null
          bairro_imovel?: string | null
          mensagem?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
