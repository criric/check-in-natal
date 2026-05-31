'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { atualizarPrecoData } from '@/lib/actions/calendario'
import { aplicarSugestoesPreco } from '@/lib/actions/precificacao'
import type { CalendarioPrecos, EventoSazonal } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'

const NOMES_MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function PrecosClient({
  imovelId,
  calendario,
  eventos,
  mesAtual,
  anoAtual,
  dataInicio,
  dataFim,
}: {
  imovelId: string
  calendario: CalendarioPrecos[]
  eventos: EventoSazonal[]
  mesAtual: number
  anoAtual: number
  dataInicio: string
  dataFim: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | undefined>()

  const porData = useMemo(() => {
    const m = new Map<string, CalendarioPrecos>()
    for (const c of calendario) m.set(c.data, c)
    return m
  }, [calendario])

  const meses = useMemo(() => {
    const lista: { mes: number; ano: number; dias: Date[] }[] = []
    for (let i = 0; i < 3; i++) {
      const base = new Date(anoAtual, mesAtual - 1 + i, 1)
      const ini = startOfMonth(base)
      const fim = endOfMonth(base)
      const dias: Date[] = []
      for (let d = ini.getDate(); d <= fim.getDate(); d++) {
        dias.push(new Date(base.getFullYear(), base.getMonth(), d))
      }
      lista.push({
        mes: base.getMonth() + 1,
        ano: base.getFullYear(),
        dias,
      })
    }
    return lista
  }, [mesAtual, anoAtual])

  function navegar(delta: number) {
    let novoMes = mesAtual + delta
    let novoAno = anoAtual
    while (novoMes < 1) {
      novoMes += 12
      novoAno -= 1
    }
    while (novoMes > 12) {
      novoMes -= 12
      novoAno += 1
    }
    router.push(`/imoveis/${imovelId}/precos?mes=${novoMes}&ano=${novoAno}`)
  }

  function aplicarSugestoes() {
    if (!confirm('Aplicar preços sugeridos aos dias sem reserva?')) return
    start(async () => {
      setMsg(undefined)
      const res = await aplicarSugestoesPreco(imovelId, dataInicio, dataFim)
      if (res.error) {
        setMsg(res.error)
        return
      }
      setMsg(`${res.data?.dias_atualizados ?? 0} dias atualizados ✓`)
      router.refresh()
      setTimeout(() => setMsg(undefined), 3000)
    })
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navegar(-1)}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            ← Anterior
          </button>
          <span className="text-sm font-medium text-gray-800">
            {NOMES_MES[mesAtual - 1]}/{anoAtual} +2 meses
          </span>
          <button
            type="button"
            onClick={() => navegar(1)}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            Próximo →
          </button>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-green-600">{msg}</span>}
          <button
            type="button"
            onClick={aplicarSugestoes}
            disabled={pending}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? 'Aplicando...' : 'Aplicar sugestões automáticas'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {meses.map(({ mes, ano, dias }) => (
          <Mes
            key={`${ano}-${mes}`}
            mes={mes}
            ano={ano}
            dias={dias}
            porData={porData}
            imovelId={imovelId}
            onChange={() => router.refresh()}
          />
        ))}
      </div>

      <Legenda />

      {eventos.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Eventos no período
          </h3>
          <ul className="space-y-2">
            {eventos.map((ev) => (
              <li
                key={ev.id}
                className="rounded border border-gray-200 bg-white p-3 text-sm"
              >
                <span className="font-medium text-gray-900">🎉 {ev.nome}</span>
                <span className="ml-2 text-gray-600">
                  {ev.data_inicio.slice(0, 10)} → {ev.data_fim.slice(0, 10)} ·{' '}
                  multiplicador {Number(ev.multiplicador_preco).toFixed(2)}×
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Mes({
  mes,
  ano,
  dias,
  porData,
  imovelId,
  onChange,
}: {
  mes: number
  ano: number
  dias: Date[]
  porData: Map<string, CalendarioPrecos>
  imovelId: string
  onChange: () => void
}) {
  const offset = getDay(new Date(ano, mes - 1, 1))
  const blanks = Array(offset).fill(null)

  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <h3 className="mb-2 text-center text-sm font-semibold text-gray-800">
        {NOMES_MES[mes - 1]} {ano}
      </h3>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-500">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {dias.map((d) => {
          const data = format(d, 'yyyy-MM-dd')
          const cal = porData.get(data)
          return (
            <Celula
              key={data}
              data={data}
              dia={d.getDate()}
              info={cal}
              imovelId={imovelId}
              onChange={onChange}
            />
          )
        })}
      </div>
    </div>
  )
}

function Celula({
  data,
  dia,
  info,
  imovelId,
  onChange,
}: {
  data: string
  dia: number
  info?: CalendarioPrecos
  imovelId: string
  onChange: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(
    String(info?.preco_noite ?? info?.preco_sugerido ?? ''),
  )
  const [pending, start] = useTransition()

  const temReserva = info?.tem_reserva ?? false
  const bloqueado = info ? !info.disponivel : false
  const disabled = temReserva || bloqueado

  let cor = 'bg-white hover:bg-gray-50'
  if (temReserva) cor = 'bg-green-900 text-white'
  else if (bloqueado) cor = 'bg-red-100 text-red-700'
  else if (info?.evento_ativo) cor = 'bg-amber-50'

  function salvar() {
    start(async () => {
      const preco = Number(valor)
      if (!preco || preco <= 0) return
      await atualizarPrecoData(imovelId, data, preco)
      setEditando(false)
      onChange()
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setEditando(!editando)}
        disabled={disabled}
        title={
          info?.evento_ativo
            ? `Evento: ${info.evento_ativo}`
            : temReserva
              ? 'Dia com reserva'
              : bloqueado
                ? `Bloqueado${info?.motivo_bloqueio ? `: ${info.motivo_bloqueio}` : ''}`
                : `Sugerido: ${formatCurrency(info?.preco_sugerido ?? 0)}`
        }
        className={`aspect-square w-full rounded text-[10px] leading-tight ${cor} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="font-semibold">{dia}</div>
        {info?.evento_ativo && <div>🎉</div>}
        {info?.preco_noite != null ? (
          <div className="text-blue-600">{Math.round(info.preco_noite)}</div>
        ) : info ? (
          <div className="text-gray-500">{Math.round(info.preco_sugerido)}</div>
        ) : null}
      </button>

      {editando && !disabled && (
        <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded border border-gray-300 bg-white p-2 shadow-lg">
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded border border-gray-300 px-1 py-0.5 text-xs"
          />
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onClick={salvar}
              disabled={pending}
              className="flex-1 rounded bg-gray-900 px-1 py-0.5 text-[10px] font-semibold text-white"
            >
              {pending ? '...' : 'OK'}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="flex-1 rounded border border-gray-300 px-1 py-0.5 text-[10px]"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Legenda() {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
      <Item cor="bg-white border" label="Disponível" />
      <Item cor="bg-amber-50 border border-amber-200" label="Evento sazonal" />
      <Item cor="bg-green-900" label="Reserva" />
      <Item cor="bg-red-100 border border-red-300" label="Bloqueado" />
      <span className="text-gray-500">·</span>
      <span>
        <span className="text-blue-600">azul</span> = preço definido ·{' '}
        <span className="text-gray-500">cinza</span> = sugestão
      </span>
    </div>
  )
}

function Item({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded ${cor}`} />
      {label}
    </span>
  )
}
