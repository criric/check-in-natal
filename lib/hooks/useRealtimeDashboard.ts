'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventoRealtime } from '@/types'

type DashboardCallbacks = {
  onNovaReserva?: (reserva: Record<string, unknown>) => void
  onAtualizacaoReserva?: (reserva: Record<string, unknown>) => void
  onNovoAlerta?: (alerta: Record<string, unknown>) => void
  onAtualizacaoLimpeza?: (limpeza: Record<string, unknown>) => void
}

export function useRealtimeDashboard(callbacks: DashboardCallbacks) {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dashboard-realtime:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas' },
        (raw: { eventType: string; new: Record<string, unknown> }) => {
          if (raw.eventType === EventoRealtime.Insert) {
            callbacksRef.current.onNovaReserva?.(raw.new)
          } else if (raw.eventType === EventoRealtime.Update) {
            callbacksRef.current.onAtualizacaoReserva?.(raw.new)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas' },
        (raw: { new: Record<string, unknown> }) => {
          callbacksRef.current.onNovoAlerta?.(raw.new)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'limpezas' },
        (raw: { new: Record<string, unknown> }) => {
          callbacksRef.current.onAtualizacaoLimpeza?.(raw.new)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
