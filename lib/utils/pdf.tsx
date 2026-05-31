import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { Plataforma } from '@/types'
import { formatCurrency, formatDate, formatMesAno, formatCpfCnpj } from './formatters'

export interface DadosRepasse {
  proprietario: {
    nome: string
    cpf_cnpj: string
    email: string
  }
  imovel: {
    nome_interno: string
    endereco_completo: string
    bairro: string
  }
  competencia: { mes: number; ano: number }
  data_emissao: string
  reservas: {
    data_checkin: string
    data_checkout: string
    noites: number
    plataforma: Plataforma
    valor_bruto: number
    taxa_plataforma: number
    valor_liquido: number
  }[]
  receita_bruta: number
  comissao_percentual: number
  comissao_valor: number
  deducoes_manutencao: number
  deducoes_outros: number
  valor_repassado: number
  observacoes?: string
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emissao: {
    fontSize: 9,
    color: '#6b7280',
  },
  block: {
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: 110,
    color: '#6b7280',
  },
  value: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#111827',
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  },
  colCheckin: { width: '14%' },
  colCheckout: { width: '14%' },
  colNoites: { width: '10%', textAlign: 'center' },
  colPlataforma: { width: '15%' },
  colBruto: { width: '15%', textAlign: 'right' },
  colTaxa: { width: '15%', textAlign: 'right' },
  colLiquido: { width: '17%', textAlign: 'right' },
  summary: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  summaryLabel: {
    width: 180,
    textAlign: 'right',
    color: '#374151',
    paddingRight: 12,
  },
  summaryValue: {
    width: 110,
    textAlign: 'right',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },
  summaryTotalLabel: {
    width: 180,
    textAlign: 'right',
    paddingRight: 12,
    fontWeight: 'bold',
    fontSize: 12,
  },
  summaryTotalValue: {
    width: 110,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
  },
  observacoes: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f9fafb',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
})

function RepasseDocument({ dados }: { dados: DadosRepasse }) {
  const totalBruto = dados.reservas.reduce((s, r) => s + r.valor_bruto, 0)
  const totalTaxa = dados.reservas.reduce((s, r) => s + r.taxa_plataforma, 0)
  const totalLiquido = dados.reservas.reduce((s, r) => s + r.valor_liquido, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Gestora Imóveis</Text>
            <Text style={styles.emissao}>Extrato de Repasse</Text>
          </View>
          <Text style={styles.emissao}>
            Emitido em {formatDate(dados.data_emissao)}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Identificação</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Proprietário:</Text>
            <Text style={styles.value}>{dados.proprietario.nome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF/CNPJ:</Text>
            <Text style={styles.value}>
              {formatCpfCnpj(dados.proprietario.cpf_cnpj)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>E-mail:</Text>
            <Text style={styles.value}>{dados.proprietario.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Imóvel:</Text>
            <Text style={styles.value}>{dados.imovel.nome_interno}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>
              {dados.imovel.endereco_completo} — {dados.imovel.bairro}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Competência:</Text>
            <Text style={styles.value}>
              {formatMesAno(dados.competencia.mes, dados.competencia.ano)}
            </Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Reservas do período</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colCheckin}>Check-in</Text>
              <Text style={styles.colCheckout}>Check-out</Text>
              <Text style={styles.colNoites}>Noites</Text>
              <Text style={styles.colPlataforma}>Plataforma</Text>
              <Text style={styles.colBruto}>Bruto</Text>
              <Text style={styles.colTaxa}>Taxa</Text>
              <Text style={styles.colLiquido}>Líquido</Text>
            </View>
            {dados.reservas.map((r, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colCheckin}>{formatDate(r.data_checkin)}</Text>
                <Text style={styles.colCheckout}>{formatDate(r.data_checkout)}</Text>
                <Text style={styles.colNoites}>{r.noites}</Text>
                <Text style={styles.colPlataforma}>{r.plataforma}</Text>
                <Text style={styles.colBruto}>{formatCurrency(r.valor_bruto)}</Text>
                <Text style={styles.colTaxa}>{formatCurrency(r.taxa_plataforma)}</Text>
                <Text style={styles.colLiquido}>{formatCurrency(r.valor_liquido)}</Text>
              </View>
            ))}
            <View style={styles.tableTotalRow}>
              <Text style={styles.colCheckin}>Total</Text>
              <Text style={styles.colCheckout}></Text>
              <Text style={styles.colNoites}></Text>
              <Text style={styles.colPlataforma}></Text>
              <Text style={styles.colBruto}>{formatCurrency(totalBruto)}</Text>
              <Text style={styles.colTaxa}>{formatCurrency(totalTaxa)}</Text>
              <Text style={styles.colLiquido}>{formatCurrency(totalLiquido)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Receita Bruta:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(dados.receita_bruta)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              (−) Comissão ({dados.comissao_percentual.toFixed(2)}%):
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(dados.comissao_valor)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>(−) Deduções Manutenção:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(dados.deducoes_manutencao)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>(−) Outras Deduções:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(dados.deducoes_outros)}
            </Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Valor a Receber:</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(dados.valor_repassado)}
            </Text>
          </View>
        </View>

        {dados.observacoes ? (
          <View style={styles.observacoes}>
            <Text>{dados.observacoes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Documento gerado automaticamente. Válido para declaração de Imposto de Renda.
        </Text>
      </Page>
    </Document>
  )
}

export async function gerarPdfRepasse(dados: DadosRepasse): Promise<Buffer> {
  return renderToBuffer(<RepasseDocument dados={dados} />)
}
