'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Hourglass,
  Plus,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { KpiCard } from '@/components/ui/kpi-card'
import { formatCurrency, formatDate, formatMesAno } from '@/lib/utils/formatters'
import { StatusRepasse } from '@/types'
import { GerarRepasseModal } from './gerar-repasse-modal'
import { MarcarPagoDialog } from './marcar-pago-dialog'

export type ImovelOpt = {
  id: string
  nome_interno: string
  bairro: string
  comissao_percentual: number
  proprietario_nome: string
  proprietario_id: string
}

export type ProprietarioOpt = {
  id: string
  nome: string
}

export type RepasseItem = {
  id: string
  competencia_mes: number
  competencia_ano: number
  receita_bruta: number
  comissao_gestora: number
  deducoes_manutencao: number
  deducoes_outros: number
  valor_repassado: number
  status: StatusRepasse
  data_repasse?: string
  pdf_url?: string
  observacoes?: string
  proprietario: { id: string; nome: string; email: string }
  imovel: { id: string; nome_interno: string; bairro: string }
}

const MESES: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

function competenciaIso(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export function RepassesClient({
  repasses,
  imoveis,
  proprietarios,
}: {
  repasses: RepasseItem[]
  imoveis: ImovelOpt[]
  proprietarios: ProprietarioOpt[]
}) {
  const router = useRouter()
  const hoje = new Date()
  const [mesFiltro, setMesFiltro] = useState<number>(hoje.getMonth() + 1)
  const [anoFiltro, setAnoFiltro] = useState<number>(hoje.getFullYear())
  const [proprietarioFiltro, setProprietarioFiltro] = useState<string>('')
  const [statusFiltro, setStatusFiltro] = useState<'' | StatusRepasse>('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [marcandoPago, setMarcandoPago] = useState<RepasseItem | undefined>()

  const competenciaSelecionada = competenciaIso(mesFiltro, anoFiltro)

  const filtrados = useMemo(() => {
    return repasses.filter((r) => {
      if (competenciaIso(r.competencia_mes, r.competencia_ano) !== competenciaSelecionada)
        return false
      if (proprietarioFiltro && r.proprietario.id !== proprietarioFiltro)
        return false
      if (statusFiltro && r.status !== statusFiltro) return false
      return true
    })
  }, [repasses, competenciaSelecionada, proprietarioFiltro, statusFiltro])

  // KPIs do mês selecionado (ignorando filtro de proprietário/status para visão geral)
  const repassesDoMes = useMemo(
    () =>
      repasses.filter(
        (r) =>
          competenciaIso(r.competencia_mes, r.competencia_ano) ===
          competenciaSelecionada,
      ),
    [repasses, competenciaSelecionada],
  )

  const kpiPendentes = repassesDoMes.filter(
    (r) => r.status === StatusRepasse.Pendente,
  ).length
  const kpiProcessando = repassesDoMes.filter(
    (r) => r.status === StatusRepasse.Processando,
  ).length
  const totalPagoMes = repassesDoMes
    .filter((r) => r.status === StatusRepasse.Pago)
    .reduce((sum, r) => sum + r.valor_repassado, 0)

  const anos = useMemo(() => {
    const set = new Set<number>([hoje.getFullYear()])
    for (const r of repasses) set.add(r.competencia_ano)
    return Array.from(set).sort((a, b) => b - a)
  }, [repasses, hoje])

  const refresh = () => router.refresh()

  const handleDownload = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const columns: ColumnDef<RepasseItem>[] = [
    {
      id: 'proprietario',
      header: 'Proprietário',
      accessorFn: (r) => r.proprietario.nome,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-navy-800">
            {row.original.proprietario.nome}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {row.original.proprietario.email}
          </p>
        </div>
      ),
    },
    {
      id: 'imovel',
      header: 'Imóvel',
      accessorFn: (r) => r.imovel.nome_interno,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-navy-800">
            {row.original.imovel.nome_interno}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {row.original.imovel.bairro}
          </p>
        </div>
      ),
    },
    {
      id: 'competencia',
      header: 'Competência',
      accessorFn: (r) => competenciaIso(r.competencia_mes, r.competencia_ano),
      cell: ({ row }) =>
        formatMesAno(row.original.competencia_mes, row.original.competencia_ano),
    },
    {
      id: 'bruta',
      header: 'Receita bruta',
      accessorFn: (r) => r.receita_bruta,
      cell: ({ row }) => (
        <span className="text-sm text-ink">
          {formatCurrency(row.original.receita_bruta)}
        </span>
      ),
    },
    {
      id: 'comissao',
      header: 'Comissão',
      accessorFn: (r) => r.comissao_gestora,
      cell: ({ row }) => (
        <span className="text-sm text-ink-muted">
          −{formatCurrency(row.original.comissao_gestora)}
        </span>
      ),
    },
    {
      id: 'deducoes',
      header: 'Deduções',
      accessorFn: (r) => r.deducoes_manutencao + r.deducoes_outros,
      cell: ({ row }) => {
        const total =
          row.original.deducoes_manutencao + row.original.deducoes_outros
        return (
          <span className="text-sm text-ink-muted">
            {total > 0 ? `−${formatCurrency(total)}` : '—'}
          </span>
        )
      },
    },
    {
      id: 'liquido',
      header: 'Valor líquido',
      accessorFn: (r) => r.valor_repassado,
      cell: ({ row }) => (
        <span className="font-semibold text-navy-800">
          {formatCurrency(row.original.valor_repassado)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <BadgeStatus
          variant={BadgeStatusVariant.Repasse}
          status={row.original.status}
        />
      ),
    },
    {
      id: 'data',
      header: 'Data repasse',
      accessorFn: (r) => r.data_repasse ?? '',
      cell: ({ row }) =>
        row.original.data_repasse ? (
          <span className="text-sm text-ink">
            {formatDate(row.original.data_repasse)}
          </span>
        ) : (
          <span className="text-xs text-ink-subtle">—</span>
        ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original
        const podeMarcarPago =
          r.status === StatusRepasse.Pendente ||
          r.status === StatusRepasse.Processando
        return (
          <div className="flex items-center gap-1">
            {r.pdf_url ? (
              <button
                type="button"
                aria-label="Baixar PDF"
                title="Baixar PDF"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(r.pdf_url!)
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-navy-700 transition-colors hover:bg-sand-100"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {podeMarcarPago ? (
              <Button
                variant={ButtonVariant.Outline}
                size={ButtonSize.Sm}
                leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={(e) => {
                  e.stopPropagation()
                  setMarcandoPago(r)
                }}
              >
                Marcar pago
              </Button>
            ) : null}
            {r.pdf_url ? (
              <a
                href={r.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir PDF em nova aba"
                title="Abrir em nova aba"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-sand-100 hover:text-navy-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        )
      },
    },
  ]

  const filtros = (
    <>
      <select
        value={mesFiltro}
        onChange={(e) => setMesFiltro(Number(e.target.value))}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por mês"
      >
        {MESES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={anoFiltro}
        onChange={(e) => setAnoFiltro(Number(e.target.value))}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por ano"
      >
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select
        value={proprietarioFiltro}
        onChange={(e) => setProprietarioFiltro(e.target.value)}
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por proprietário"
      >
        <option value="">Todos os proprietários</option>
        {proprietarios.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <select
        value={statusFiltro}
        onChange={(e) =>
          setStatusFiltro((e.target.value as StatusRepasse) || '')
        }
        className="h-10 rounded-md border border-line-strong bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-200"
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        <option value={StatusRepasse.Pendente}>Pendente</option>
        <option value={StatusRepasse.Processando}>Processando</option>
        <option value={StatusRepasse.Pago}>Pago</option>
      </select>
    </>
  )

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          titulo="Pendentes no mês"
          valor={String(kpiPendentes)}
          icone={<Hourglass />}
          descricao={
            kpiPendentes === 1
              ? '1 repasse aguardando pagamento'
              : `${kpiPendentes} repasses aguardando pagamento`
          }
        />
        <KpiCard
          titulo="Em processamento"
          valor={String(kpiProcessando)}
          icone={<Clock />}
          descricao={
            kpiProcessando === 1
              ? '1 repasse em processamento bancário'
              : `${kpiProcessando} repasses em processamento bancário`
          }
        />
        <KpiCard
          titulo="Total pago no mês"
          valor={formatCurrency(totalPagoMes)}
          icone={<Banknote />}
          descricao={formatMesAno(mesFiltro, anoFiltro)}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {filtrados.length} repasse{filtrados.length === 1 ? '' : 's'} em{' '}
          {formatMesAno(mesFiltro, anoFiltro)}
        </p>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Sm}
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setNovoAberto(true)}
          disabled={imoveis.length === 0}
        >
          Gerar repasse
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtrados}
        filters={filtros}
        searchPlaceholder="Buscar por proprietário ou imóvel..."
        emptyTitle="Nenhum repasse"
        emptyMessage={`Nenhum repasse encontrado para ${formatMesAno(
          mesFiltro,
          anoFiltro,
        )}. Use "Gerar repasse" para criar.`}
        pageSize={25}
      />

      <Dialog
        open={novoAberto}
        onOpenChange={(o) => {
          if (!o) setNovoAberto(false)
        }}
      >
        <DialogContent className="max-w-3xl">
          {novoAberto ? (
            <GerarRepasseModal
              imoveis={imoveis}
              mesInicial={mesFiltro}
              anoInicial={anoFiltro}
              onCancel={() => setNovoAberto(false)}
              onSuccess={() => {
                setNovoAberto(false)
                refresh()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <MarcarPagoDialog
        repasse={marcandoPago}
        open={Boolean(marcandoPago)}
        onOpenChange={(o) => {
          if (!o) setMarcandoPago(undefined)
        }}
        onSuccess={() => {
          setMarcandoPago(undefined)
          refresh()
        }}
      />
    </>
  )
}
