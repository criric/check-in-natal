import Link from 'next/link'
import { CalendarRange } from 'lucide-react'
import { requireAdmin } from '@/lib/actions/_guards'
import { listarConfiguracoesCompletas } from '@/lib/actions/configuracoes'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { TipoConfiguracao, type Configuracao } from '@/types'
import { ConfiguracoesClient } from './configuracoes-client'
import type { GrupoConfig } from './types'

export const dynamic = 'force-dynamic'

const GRUPOS: GrupoConfig[] = [
  {
    titulo: 'Financeiro',
    descricao:
      'Parâmetros usados no cálculo de repasses, aprovações e custos operacionais.',
    campos: [
      {
        chave: 'comissao_padrao',
        label: 'Comissão padrão',
        descricao: 'Aplicada a novos imóveis cadastrados.',
        suffix: '%',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '0.5',
        min: 0,
        max: 100,
      },
      {
        chave: 'limite_aprovacao_manutencao',
        label: 'Limite de aprovação',
        descricao:
          'Manutenções acima deste valor exigem aprovação do proprietário.',
        prefix: 'R$',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '10',
        min: 0,
      },
      {
        chave: 'custo_limpeza_padrao',
        label: 'Custo padrão de limpeza',
        descricao: 'Usado para calcular o custo operacional dos relatórios.',
        prefix: 'R$',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '5',
        min: 0,
      },
    ],
  },
  {
    titulo: 'Alertas e Automações',
    descricao:
      'Limites que disparam alertas e ditam o calendário de repasses.',
    campos: [
      {
        chave: 'dias_sem_reserva_alerta',
        label: 'Dias sem reserva para alerta',
        descricao:
          'Após este número de dias sem reserva futura, abrimos um alerta.',
        suffix: 'dias',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '1',
        min: 1,
      },
      {
        chave: 'dias_manutencao_parada',
        label: 'Dias até manutenção parada',
        descricao:
          'Manutenções abertas por mais tempo geram alerta automático.',
        suffix: 'dias',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '1',
        min: 1,
      },
      {
        chave: 'dia_corte_repasse',
        label: 'Dia de corte do repasse',
        descricao: 'Dia do mês seguinte em que o repasse é fechado e enviado.',
        suffix: 'do mês',
        inputType: 'number',
        tipo: TipoConfiguracao.Number,
        step: '1',
        min: 1,
        max: 28,
      },
    ],
  },
  {
    titulo: 'Dados da Empresa',
    descricao:
      'Informações exibidas em e-mails, PDFs e na landing page pública.',
    campos: [
      {
        chave: 'nome_empresa',
        label: 'Nome',
        inputType: 'text',
        tipo: TipoConfiguracao.String,
      },
      {
        chave: 'cnpj_empresa',
        label: 'CNPJ',
        inputType: 'text',
        tipo: TipoConfiguracao.String,
      },
      {
        chave: 'endereco_empresa',
        label: 'Endereço',
        inputType: 'text',
        tipo: TipoConfiguracao.String,
      },
      {
        chave: 'admin_email',
        label: 'E-mail administrativo',
        inputType: 'email',
        tipo: TipoConfiguracao.String,
      },
      {
        chave: 'whatsapp_contato',
        label: 'WhatsApp',
        descricao: 'Formato com DDI: 5584999999999',
        inputType: 'tel',
        tipo: TipoConfiguracao.String,
      },
      {
        chave: 'instagram_empresa',
        label: 'Instagram',
        inputType: 'text',
        tipo: TipoConfiguracao.String,
      },
    ],
  },
]

export default async function ConfiguracoesPage() {
  const g = await requireAdmin()
  if (!g.ok) {
    return (
      <div className="mx-auto max-w-[1100px] p-4 md:p-6">
        <PageHeader titulo="Configurações" />
        <p className="rounded-md border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {g.error}
        </p>
      </div>
    )
  }

  const res = await listarConfiguracoesCompletas()
  const configuracoes = (res.data ?? []) as Configuracao[]

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <PageHeader
        titulo="Configurações"
        descricao="Parâmetros do sistema. Alterações refletem em todo o painel."
        acoes={
          <Link href="/configuracoes/eventos">
            <Button
              variant={ButtonVariant.Outline}
              size={ButtonSize.Sm}
              leadingIcon={<CalendarRange className="h-4 w-4" />}
            >
              Eventos sazonais
            </Button>
          </Link>
        }
      />

      <ConfiguracoesClient configuracoes={configuracoes} grupos={GRUPOS} />
    </div>
  )
}
