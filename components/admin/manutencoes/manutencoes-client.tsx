'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Wrench } from 'lucide-react'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import { StatusManutencao, UrgenciaManutencao } from '@/types'
import { ManutencaoCard } from './manutencao-card'
import { ManutencaoForm } from './manutencao-form'
import { ManutencaoSheet } from './manutencao-sheet'

export type ImovelOpt = {
  id: string
  nome_interno: string
  bairro: string
}

export type ManutencaoItem = {
  id: string
  descricao: string
  urgencia: UrgenciaManutencao
  status: StatusManutencao
  tipo?: string
  prestador_nome?: string
  prestador_contato?: string
  custo_estimado?: number
  custo_real?: number
  data_abertura: string
  data_resolucao?: string
  observacoes?: string
  observacao_proprietario?: string
  aprovacao_proprietario?: boolean
  fotos_antes: string[]
  fotos_depois: string[]
  imovel: {
    id: string
    nome_interno: string
    proprietario: { id: string; nome: string; email: string }
  }
}

type TabDef = {
  id: string
  label: string
  filter?: (m: ManutencaoItem) => boolean
}

const TABS: TabDef[] = [
  { id: 'todas', label: 'Todas' },
  {
    id: 'abertas',
    label: 'Abertas',
    filter: (m) => m.status === StatusManutencao.Aberta,
  },
  {
    id: 'aprovacao',
    label: 'Aguard. aprovação',
    filter: (m) => m.status === StatusManutencao.AguardandoAprovacao,
  },
  {
    id: 'em_andamento',
    label: 'Em andamento',
    filter: (m) =>
      m.status === StatusManutencao.EmAndamento ||
      m.status === StatusManutencao.Aprovada,
  },
  {
    id: 'resolvidas',
    label: 'Resolvidas',
    filter: (m) => m.status === StatusManutencao.Resolvida,
  },
]

export type ManutencoesClientProps = {
  manutencoes: ManutencaoItem[]
  imoveis: ImovelOpt[]
  tabInicial: string
}

export function ManutencoesClient({
  manutencoes,
  imoveis,
  tabInicial,
}: ManutencoesClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<string>(
    TABS.find((t) => t.id === tabInicial)?.id ?? 'todas',
  )
  const [novoAberto, setNovoAberto] = useState(false)
  const [sheetId, setSheetId] = useState<string | undefined>()

  const aguardandoCount = useMemo(
    () =>
      manutencoes.filter(
        (m) => m.status === StatusManutencao.AguardandoAprovacao,
      ).length,
    [manutencoes],
  )

  const filtradas = useMemo(() => {
    const def = TABS.find((t) => t.id === tab)
    return def?.filter ? manutencoes.filter(def.filter) : manutencoes
  }, [manutencoes, tab])

  const handleTabChange = (id: string) => {
    setTab(id)
    const params = new URLSearchParams()
    if (id !== 'todas') params.set('tab', id)
    const qs = params.toString()
    router.push(qs ? `/manutencoes?${qs}` : '/manutencoes')
  }

  const sheetManut = useMemo(
    () => (sheetId ? manutencoes.find((m) => m.id === sheetId) : undefined),
    [manutencoes, sheetId],
  )

  const refresh = () => router.refresh()

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-white p-1">
          {TABS.map((t) => {
            const ativo = t.id === tab
            const showBadge = t.id === 'aprovacao' && aguardandoCount > 0
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                  ativo
                    ? 'bg-navy-700 text-white shadow-sm'
                    : 'text-ink-muted hover:text-navy-700',
                )}
              >
                {t.label}
                {showBadge ? (
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-2xs font-semibold',
                      ativo
                        ? 'bg-white/20 text-white'
                        : 'bg-warning-100 text-warning-700',
                    )}
                  >
                    {aguardandoCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Sm}
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setNovoAberto(true)}
          disabled={imoveis.length === 0}
        >
          Nova manutenção
        </Button>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icone={<Wrench className="h-10 w-10" />}
          titulo={
            tab === 'todas'
              ? 'Nenhuma manutenção registrada'
              : 'Nada para mostrar nesta aba'
          }
          descricao={
            tab === 'todas'
              ? 'Abra o primeiro chamado para começar a rastrear manutenções.'
              : 'Mude para outra aba ou abra um novo chamado.'
          }
          ctaLabel={imoveis.length > 0 ? 'Nova manutenção' : undefined}
          ctaAction={imoveis.length > 0 ? () => setNovoAberto(true) : undefined}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((m) => (
            <li key={m.id}>
              <ManutencaoCard
                manutencao={m}
                onAbrir={() => setSheetId(m.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={novoAberto}
        onOpenChange={(o) => {
          if (!o) setNovoAberto(false)
        }}
      >
        <DialogContent className="max-w-xl">
          {novoAberto ? (
            <ManutencaoForm
              imoveis={imoveis}
              onCancel={() => setNovoAberto(false)}
              onSuccess={() => {
                setNovoAberto(false)
                refresh()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ManutencaoSheet
        manutencao={sheetManut}
        open={Boolean(sheetId)}
        onOpenChange={(o) => {
          if (!o) setSheetId(undefined)
        }}
        onChanged={refresh}
      />
    </>
  )
}
