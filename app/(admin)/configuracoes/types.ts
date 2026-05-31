import { TipoConfiguracao } from '@/types'

export type CampoMeta = {
  chave: string
  label: string
  descricao?: string
  tipo?: TipoConfiguracao
  prefix?: string
  suffix?: string
  inputType?: 'number' | 'text' | 'email' | 'tel' | 'url'
  step?: string
  min?: number
  max?: number
}

export type GrupoConfig = {
  titulo: string
  descricao?: string
  campos: CampoMeta[]
}
