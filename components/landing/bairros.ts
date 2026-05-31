import { TipoImovel } from '@/types'

export const BAIRROS_NATAL = [
  'Ponta Negra',
  'Areia Preta',
  'Petrópolis',
  'Tirol',
  'Lagoa Nova',
  'Capim Macio',
  'Cidade Jardim',
  'Candelária',
  'Neópolis',
  'Pitimbu',
  'Praia do Forte',
  'Praia do Meio',
  'Mãe Luiza',
] as const

export type BairroNatal = (typeof BAIRROS_NATAL)[number]

type EstimativaBairro = {
  // Valor base mensal por hóspede ocupado (BRL).
  base: number
  // Multiplicadores por tipo de imóvel.
  ajustes: Record<TipoImovel, number>
}

// Tabela estática. Valores aproximados, calibrados para serem realistas
// mas conservadores — não promete ROI mirabolante.
export const ESTIMATIVAS_BAIRRO: Record<string, EstimativaBairro> = {
  'Ponta Negra': {
    base: 1500,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.2,
      [TipoImovel.Cobertura]: 1.6,
      [TipoImovel.Studio]: 0.75,
      [TipoImovel.Quarto]: 0.5,
    },
  },
  'Areia Preta': {
    base: 1300,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.15,
      [TipoImovel.Cobertura]: 1.5,
      [TipoImovel.Studio]: 0.75,
      [TipoImovel.Quarto]: 0.5,
    },
  },
  Petrópolis: {
    base: 1100,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.1,
      [TipoImovel.Cobertura]: 1.45,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.45,
    },
  },
  Tirol: {
    base: 1050,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.1,
      [TipoImovel.Cobertura]: 1.4,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.45,
    },
  },
  'Lagoa Nova': {
    base: 900,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.05,
      [TipoImovel.Cobertura]: 1.3,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  'Capim Macio': {
    base: 950,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.1,
      [TipoImovel.Cobertura]: 1.35,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  'Cidade Jardim': {
    base: 850,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.05,
      [TipoImovel.Cobertura]: 1.3,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  Candelária: {
    base: 900,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.05,
      [TipoImovel.Cobertura]: 1.3,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  Neópolis: {
    base: 820,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.05,
      [TipoImovel.Cobertura]: 1.25,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  Pitimbu: {
    base: 700,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.05,
      [TipoImovel.Cobertura]: 1.2,
      [TipoImovel.Studio]: 0.65,
      [TipoImovel.Quarto]: 0.4,
    },
  },
  'Praia do Forte': {
    base: 1200,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.15,
      [TipoImovel.Cobertura]: 1.5,
      [TipoImovel.Studio]: 0.75,
      [TipoImovel.Quarto]: 0.5,
    },
  },
  'Praia do Meio': {
    base: 1100,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.15,
      [TipoImovel.Cobertura]: 1.45,
      [TipoImovel.Studio]: 0.75,
      [TipoImovel.Quarto]: 0.5,
    },
  },
  'Mãe Luiza': {
    base: 1000,
    ajustes: {
      [TipoImovel.Apartamento]: 1.0,
      [TipoImovel.Casa]: 1.1,
      [TipoImovel.Cobertura]: 1.4,
      [TipoImovel.Studio]: 0.7,
      [TipoImovel.Quarto]: 0.45,
    },
  },
}

const ESTIMATIVA_PADRAO: EstimativaBairro = {
  base: 800,
  ajustes: {
    [TipoImovel.Apartamento]: 1.0,
    [TipoImovel.Casa]: 1.05,
    [TipoImovel.Cobertura]: 1.25,
    [TipoImovel.Studio]: 0.7,
    [TipoImovel.Quarto]: 0.4,
  },
}

export type SimulacaoReceita = {
  min: number
  max: number
}

export function calcularEstimativa(
  bairro: string,
  tipo: TipoImovel,
  capacidade: number,
): SimulacaoReceita {
  const dados = ESTIMATIVAS_BAIRRO[bairro] ?? ESTIMATIVA_PADRAO
  const ajuste = dados.ajustes[tipo]
  const cap = Math.max(1, Math.min(20, capacidade))

  // Curva sublinear: receita não escala 1:1 com capacidade.
  const fatorCapacidade = 0.55 + cap * 0.45

  const central = dados.base * ajuste * fatorCapacidade
  return {
    min: Math.round((central * 0.85) / 100) * 100,
    max: Math.round((central * 1.2) / 100) * 100,
  }
}
