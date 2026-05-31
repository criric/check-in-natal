export enum NumeroFormato {
  Inteiro = 'inteiro',
  Moeda = 'moeda',
  Decimal = 'decimal',
}

export type NumeroDestaque = {
  label: string
  valor: number
  formato: NumeroFormato
  sufixo?: string
}
