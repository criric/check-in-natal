'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventoRealtime, type RealtimePayload } from '@/types'

type Callback<T> = (payload: RealtimePayload<T>) => void

export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  onInsert?: Callback<T>,
  onUpdate?: Callback<T>,
  onDelete?: Callback<T>,
) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`realtime:${table}:${Date.now()}`)
      .on(
        // @ts-expect-error — tipo do Supabase aceita 'postgres_changes' em runtime
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (raw: {
          eventType: string
          new: T
          old: Partial<T>
        }) => {
          const payload: RealtimePayload<T> = {
            eventType: raw.eventType as EventoRealtime,
            new: raw.new,
            old: raw.old,
            table,
          }
          if (payload.eventType === EventoRealtime.Insert) onInsert?.(payload)
          else if (payload.eventType === EventoRealtime.Update) onUpdate?.(payload)
          else if (payload.eventType === EventoRealtime.Delete) onDelete?.(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onInsert, onUpdate, onDelete])
}
