'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'

export type LightboxProps = {
  /** URLs das imagens */
  fotos: string[]
  /** Índice ativo. Quando null, o lightbox fica fechado. */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ fotos, index, onClose, onNavigate }: LightboxProps) {
  const aberto = index !== null && index >= 0 && index < fotos.length

  const irPara = useCallback(
    (delta: number) => {
      if (index === null) return
      const next = (index + delta + fotos.length) % fotos.length
      onNavigate(next)
    },
    [index, fotos.length, onNavigate],
  )

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') irPara(1)
      if (e.key === 'ArrowLeft') irPara(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, onClose, irPara])

  if (!aberto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualização ampliada da foto"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {fotos.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              irPara(-1)
            }}
            aria-label="Foto anterior"
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              irPara(1)
            }}
            aria-label="Próxima foto"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotos[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />

      {fotos.length > 1 ? (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
          {index + 1} / {fotos.length}
        </span>
      ) : null}
    </div>
  )
}
