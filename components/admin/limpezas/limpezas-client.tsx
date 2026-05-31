'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { StatusLimpeza } from '@/types'
import { LimpezaCard } from './limpeza-card'
import { LimpezaForm } from './limpeza-form'
import { LimpezaSheet } from './limpeza-sheet'
import { LimpezasCalendario } from './limpezas-calendario'

export type ImovelOpt = {
  id: string
  nome_interno: string
  bairro: string
}

export type ReservaOpt = {
  id: string
  imovel_id: string
  nome_hospede?: string
  data_checkin: string
  data_checkout: string
}

export type LimpezaItem = {
  id: string
  data_agendada: string
  data_inicio?: string
  data_conclusao?: string
  duracao_minutos?: number
  status: StatusLimpeza
  responsavel?: string
  observacoes?: string
  checklist: Record<string, boolean>
  fotos?: string[]
  reserva_id?: string
  imovel: { id: string; nome_interno: string; bairro: string }
  reserva?: {
    id: string
    nome_hospede?: string
    data_checkin: string
    data_checkout: string
  }
}

enum Modo {
  Lista = 'lista',
  Calendario = 'calendario',
}

const isoDay = (s: string) => s.slice(0, 10)

export type LimpezasClientProps = {
  limpezas: LimpezaItem[]
  imoveis: ImovelOpt[]
  reservasProximas: ReservaOpt[]
  dataSelecionada: string
  mesSelecionado: string
  modoInicial: 'lista' | 'calendario'
}

export function LimpezasClient({
  limpezas,
  imoveis,
  reservasProximas,
  dataSelecionada,
  mesSelecionado,
  modoInicial,
}: LimpezasClientProps) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>(
    modoInicial === 'calendario' ? Modo.Calendario : Modo.Lista,
  )
  const [novoAberto, setNovoAberto] = useState(false)
  const [sheetId, setSheetId] = useState<string | undefined>(undefined)

  const pushQuery = useCallback(
    (params: Record<string, string | undefined>) => {
      const search = new URLSearchParams()
      const next = { data: dataSelecionada, mes: mesSelecionado, modo, ...params }
      if (next.data) search.set('data', next.data)
      if (next.mes) search.set('mes', next.mes)
      if (next.modo) search.set('modo', next.modo)
      router.push(`/limpezas?${search.toString()}`)
    },
    [router, dataSelecionada, mesSelecionado, modo],
  )

  const limpezasDoDia = useMemo(
    () =>
      limpezas
        .filter((l) => isoDay(l.data_agendada) === dataSelecionada)
        .slice()
        .sort((a, b) => a.data_agendada.localeCompare(b.data_agendada)),
    [limpezas, dataSelecionada],
  )

  const handleNovoSuccess = () => {
    setNovoAberto(false)
    router.refresh()
  }

  const sheetLimpeza = useMemo(
    () => (sheetId ? limpezas.find((l) => l.id === sheetId) : undefined),
    [limpezas, sheetId],
  )

  const setData = (nova: string) => {
    pushQuery({ data: nova, mes: nova.slice(0, 7) })
  }

  const navegarMes = (delta: number) => {
    const [y, m] = mesSelecionado.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const novoMes = format(d, 'yyyy-MM')
    pushQuery({ mes: novoMes })
  }

  const setModoUrl = (m: Modo) => {
    setModo(m)
    pushQuery({ modo: m })
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-line-strong bg-white">
          <button
            type="button"
            onClick={() => setModoUrl(Modo.Lista)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
              modo === Modo.Lista
                ? 'bg-navy-700 text-white'
                : 'text-ink-muted hover:text-navy-700',
            )}
            aria-pressed={modo === Modo.Lista}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setModoUrl(Modo.Calendario)}
            className={cn(
              'inline-flex items-center gap-1.5 border-l border-line-strong px-3 py-1.5 text-sm font-medium transition-colors',
              modo === Modo.Calendario
                ? 'bg-navy-700 text-white'
                : 'text-ink-muted hover:text-navy-700',
            )}
            aria-pressed={modo === Modo.Calendario}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendário
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modo === Modo.Lista ? (
            <Input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setData(e.target.value)}
              aria-label="Data selecionada"
              className="h-10 w-[170px]"
            />
          ) : (
            <div className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-white">
              <button
                type="button"
                onClick={() => navegarMes(-1)}
                className="p-2 text-ink-muted hover:text-navy-700"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-sm font-medium capitalize text-navy-800">
                {format(parseISO(`${mesSelecionado}-01`), "MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
              <button
                type="button"
                onClick={() => navegarMes(1)}
                className="p-2 text-ink-muted hover:text-navy-700"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => setNovoAberto(true)}
          >
            Nova limpeza
          </Button>
        </div>
      </div>

      {modo === Modo.Lista ? (
        limpezasDoDia.length === 0 ? (
          <EmptyState
            icone={<Sparkles className="h-10 w-10" />}
            titulo="Nenhuma limpeza neste dia"
            descricao="Selecione outra data ou agende uma nova limpeza."
            ctaLabel="Nova limpeza"
            ctaAction={() => setNovoAberto(true)}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {limpezasDoDia.map((l) => (
              <li key={l.id}>
                <LimpezaCard limpeza={l} onAbrir={() => setSheetId(l.id)} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <LimpezasCalendario
          limpezas={limpezas}
          mes={mesSelecionado}
          dataSelecionada={dataSelecionada}
          onSelecionarDia={setData}
          onAbrirLimpeza={(id) => setSheetId(id)}
        />
      )}

      <Dialog
        open={novoAberto}
        onOpenChange={(o) => {
          if (!o) setNovoAberto(false)
        }}
      >
        <DialogContent className="max-w-lg">
          {novoAberto ? (
            <LimpezaForm
              imoveis={imoveis}
              reservasProximas={reservasProximas}
              dataInicial={dataSelecionada}
              onCancel={() => setNovoAberto(false)}
              onSuccess={handleNovoSuccess}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <LimpezaSheet
        limpeza={sheetLimpeza}
        open={Boolean(sheetId)}
        onOpenChange={(o) => {
          if (!o) setSheetId(undefined)
        }}
        onChanged={() => router.refresh()}
      />
    </>
  )
}
