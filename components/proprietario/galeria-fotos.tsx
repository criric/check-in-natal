'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

type Foto = { url: string; legenda?: string }

export function GaleriaFotos({ fotos }: { fotos: Foto[] }) {
  const [idx, setIdx] = useState(0)

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-sand-100 text-sand-300">
        <Building2 className="h-20 w-20" aria-hidden />
      </div>
    )
  }

  const atual = fotos[idx]

  function prev() {
    setIdx((i) => (i === 0 ? fotos.length - 1 : i - 1))
  }
  function next() {
    setIdx((i) => (i === fotos.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative aspect-[4/3] w-full bg-sand-100">
        <Image
          src={atual.url}
          alt={atual.legenda ?? `Foto ${idx + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        {fotos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-navy-800 shadow-sm hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-navy-800 shadow-sm hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 right-2 rounded-full bg-navy-900/70 px-2 py-0.5 text-2xs font-medium text-white">
              {idx + 1} / {fotos.length}
            </div>
          </>
        ) : null}
      </div>
      {fotos.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto bg-sand-50 p-2">
          {fotos.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={
                i === idx
                  ? 'relative h-12 w-16 shrink-0 overflow-hidden rounded ring-2 ring-gold-500'
                  : 'relative h-12 w-16 shrink-0 overflow-hidden rounded opacity-70 transition-opacity hover:opacity-100'
              }
            >
              <Image
                src={f.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
