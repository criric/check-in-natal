'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarOff, X } from 'lucide-react'
import {
  bloquearDatas,
  desbloquearDatas,
  getBloqueiosAtivos,
  getDatasBloqueadas,
} from '@/lib/actions/calendario'
import { Button, ButtonVariant } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MotivoBloqueio } from '@/types'

type Imovel = { id: string; nome_interno: string; bairro: string }

type Bloqueio = {
  data_inicio: string
  data_fim: string
  motivo: string
  total_dias: number
}

type Disponibilidade = {
  data: string
  disponivel: boolean
  bloqueado_por: string
  motivo_bloqueio?: string
}

const MOTIVO_LABEL: Record<string, string> = {
  uso_proprio: 'Uso próprio',
  reforma: 'Reforma',
  outro: 'Outro',
}

export function BloquearCalendarioClient({
  imoveis,
  imovelInicial,
}: {
  imoveis: Imovel[]
  imovelInicial?: string
}) {
  const [imovelId, setImovelId] = useState<string>(
    imovelInicial ?? imoveis[0]?.id ?? '',
  )
  const [mes, setMes] = useState<Date>(new Date())
  const [range, setRange] = useState<DateRange | undefined>()
  const [motivo, setMotivo] = useState<MotivoBloqueio>(MotivoBloqueio.UsoProprio)
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([])
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [mensagem, setMensagem] = useState<string | undefined>()
  const [erro, setErro] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()
  const [cancelarTarget, setCancelarTarget] = useState<Bloqueio | undefined>()

  useEffect(() => {
    if (!imovelId) return
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imovelId, mes])

  async function carregar() {
    const datas = await getDatasBloqueadas(
      imovelId,
      mes.getMonth() + 1,
      mes.getFullYear(),
    )
    setDisponibilidades((datas.data ?? []) as Disponibilidade[])

    const blq = await getBloqueiosAtivos(imovelId)
    setBloqueios(blq.data ?? [])
  }

  const datasReservas = useMemo(
    () =>
      disponibilidades
        .filter((d) => !d.disponivel && d.bloqueado_por === 'reserva')
        .map((d) => new Date(`${d.data}T12:00:00`)),
    [disponibilidades],
  )

  const datasBloqueadasProprio = useMemo(
    () =>
      disponibilidades
        .filter((d) => !d.disponivel && d.bloqueado_por !== 'reserva')
        .map((d) => new Date(`${d.data}T12:00:00`)),
    [disponibilidades],
  )

  const desabilitadas = useMemo(
    () => [...datasReservas, ...datasBloqueadasProprio],
    [datasReservas, datasBloqueadasProprio],
  )

  function aplicarBloqueio() {
    if (!range?.from || !range?.to) {
      setErro('Selecione um intervalo')
      return
    }
    setErro(undefined)
    setMensagem(undefined)

    startTransition(async () => {
      const res = await bloquearDatas({
        imovel_id: imovelId,
        data_inicio: format(range.from!, 'yyyy-MM-dd'),
        data_fim: format(range.to!, 'yyyy-MM-dd'),
        motivo_bloqueio: motivo,
      })
      if (res.error) {
        setErro(res.error)
      } else {
        setMensagem(
          `Bloqueio criado (${res.data?.dias_bloqueados ?? 0} ${
            res.data?.dias_bloqueados === 1 ? 'dia' : 'dias'
          })`,
        )
        setRange(undefined)
        await carregar()
      }
    })
  }

  function confirmarCancelar() {
    if (!cancelarTarget) return
    const b = cancelarTarget
    setCancelarTarget(undefined)
    startTransition(async () => {
      const res = await desbloquearDatas(imovelId, b.data_inicio, b.data_fim)
      if (res.error) {
        setErro(res.error)
      } else {
        setMensagem('Bloqueio cancelado')
        await carregar()
      }
    })
  }

  const diasSelecionados =
    range?.from && range?.to
      ? Math.round(
          (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1
      : 0

  return (
    <div className="space-y-6">
      {imoveis.length > 1 && (
        <div className="rounded-lg border border-line bg-white p-4 shadow-xs">
          <label
            htmlFor="imovel-select"
            className="mb-1 block text-sm font-medium text-navy-700"
          >
            Imóvel
          </label>
          <select
            id="imovel-select"
            value={imovelId}
            onChange={(e) => setImovelId(e.target.value)}
            className="w-full max-w-md rounded-md border border-line-strong bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300"
          >
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome_interno} — {i.bairro}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base font-semibold text-navy-800">
            Calendário
          </h2>
          <DayPicker
            mode="range"
            locale={ptBR}
            month={mes}
            onMonthChange={setMes}
            selected={range}
            onSelect={setRange}
            disabled={desabilitadas}
            modifiers={{
              reserva: datasReservas,
              bloqueado: datasBloqueadasProprio,
            }}
            modifiersStyles={{
              reserva: {
                backgroundColor: '#D6DFEA',
                color: '#1F3A57',
                fontWeight: 600,
              },
              bloqueado: {
                backgroundColor: '#F5EFE6',
                color: '#87693C',
                textDecoration: 'line-through',
              },
            }}
            styles={{
              day: { borderRadius: 8 },
            }}
          />
          <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-xs text-ink-muted">
            <LegendDot color="#D6DFEA" label="Reservas" />
            <LegendDot color="#F5EFE6" label="Bloqueado por você" />
            <LegendDot color="#C8A668" label="Selecionado" />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base font-semibold text-navy-800">
            Novo bloqueio
          </h2>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="motivo-select"
                className="mb-1 block text-sm font-medium text-navy-700"
              >
                Motivo
              </label>
              <select
                id="motivo-select"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as MotivoBloqueio)}
                className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300"
              >
                <option value={MotivoBloqueio.UsoProprio}>Uso próprio</option>
                <option value={MotivoBloqueio.Reforma}>Reforma</option>
                <option value={MotivoBloqueio.Outro}>Outro</option>
              </select>
            </div>

            <div className="rounded-md border border-line bg-sand-50 p-3 text-sm">
              {range?.from && range?.to ? (
                <>
                  <p className="text-xs text-ink-muted">
                    {diasSelecionados}{' '}
                    {diasSelecionados === 1 ? 'dia' : 'dias'} selecionados
                  </p>
                  <p className="font-medium text-navy-800">
                    {format(range.from, 'dd/MM/yyyy')} →{' '}
                    {format(range.to, 'dd/MM/yyyy')}
                  </p>
                </>
              ) : (
                <p className="text-ink-muted">Nenhum intervalo selecionado</p>
              )}
            </div>

            <button
              type="button"
              disabled={pending || !range?.from || !range?.to}
              onClick={aplicarBloqueio}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              <CalendarOff className="h-4 w-4" />
              {pending ? 'Salvando…' : 'Bloquear datas'}
            </button>

            {erro && (
              <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                {erro}
              </p>
            )}
            {mensagem && (
              <p className="rounded-md border border-success-100 bg-success-50 px-3 py-2 text-sm text-success-700">
                {mensagem}
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-display text-base font-semibold text-navy-800">
          Bloqueios ativos
        </h2>
        {bloqueios.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum bloqueio futuro.</p>
        ) : (
          <ul className="divide-y divide-line">
            {bloqueios.map((b) => (
              <li
                key={`${b.data_inicio}-${b.data_fim}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarOff
                      className="h-4 w-4 text-ink-subtle"
                      aria-hidden
                    />
                    <p className="font-medium text-navy-800">
                      {b.data_inicio} → {b.data_fim}
                    </p>
                  </div>
                  <p className="ml-6 text-xs text-ink-muted">
                    {MOTIVO_LABEL[b.motivo] ?? b.motivo} · {b.total_dias}{' '}
                    {b.total_dias === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCancelarTarget(b)}
                  className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-white px-3 py-1.5 text-xs font-medium text-danger-700 hover:bg-danger-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={!!cancelarTarget}
        onOpenChange={(o: boolean) => {
          if (!o) setCancelarTarget(undefined)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar bloqueio?</DialogTitle>
            {cancelarTarget ? (
              <DialogDescription>
                O período de {cancelarTarget.data_inicio} a{' '}
                {cancelarTarget.data_fim} voltará a ficar disponível para
                reservas.
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={ButtonVariant.Ghost}
              onClick={() => setCancelarTarget(undefined)}
              disabled={pending}
            >
              Manter
            </Button>
            <Button
              variant={ButtonVariant.Danger}
              onClick={confirmarCancelar}
              loading={pending}
            >
              Cancelar bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}
