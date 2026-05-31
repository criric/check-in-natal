'use client'

import { GripVertical, ImagePlus, Loader2, X } from 'lucide-react'
import { useCallback, useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button, ButtonSize, ButtonVariant } from './button'
import { Progress, ProgressTone } from './progress'

export type FotoExistente = {
  id: string
  url: string
}

export type UploadFotosProps = {
  fotosExistentes?: FotoExistente[]
  maxFiles?: number
  maxSizeMB?: number
  uploading?: boolean
  uploadProgress?: number
  onUpload: (files: File[]) => void | Promise<void>
  onRemoveExistente?: (id: string) => void | Promise<void>
  /** Quando fornecido, habilita arrastar para reordenar as fotos existentes. Recebe a nova ordem de ids. */
  onReorder?: (ordemIds: string[]) => void | Promise<void>
  /** Quando fornecido, clicar numa foto existente dispara o callback (ex.: abrir lightbox). */
  onPhotoClick?: (index: number) => void
  className?: string
}

export function UploadFotos({
  fotosExistentes = [],
  maxFiles = 20,
  maxSizeMB = 5,
  uploading = false,
  uploadProgress,
  onUpload,
  onRemoveExistente,
  onReorder,
  onPhotoClick,
  className,
}: UploadFotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const handleReorderDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const reordenado = [...fotosExistentes]
    const [moved] = reordenado.splice(dragIndex, 1)
    reordenado.splice(targetIndex, 0, moved)
    setDragIndex(null)
    setOverIndex(null)
    void onReorder?.(reordenado.map((f) => f.id))
  }

  const restante = Math.max(maxFiles - fotosExistentes.length, 0)

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return
      if (list.length > restante) {
        setError(`Limite atingido: máximo ${maxFiles} fotos`)
        return
      }
      const tooBig = list.find((f) => f.size > maxSizeMB * 1024 * 1024)
      if (tooBig) {
        setError(`"${tooBig.name}" excede ${maxSizeMB}MB`)
        return
      }
      const invalid = list.find((f) => !f.type.startsWith('image/'))
      if (invalid) {
        setError(`"${invalid.name}" não é uma imagem`)
        return
      }
      setError(undefined)
      void onUpload(list)
    },
    [maxFiles, maxSizeMB, onUpload, restante],
  )

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
          dragOver
            ? 'border-gold-400 bg-gold-50'
            : 'border-line-strong bg-sand-50',
          uploading && 'opacity-60 pointer-events-none',
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-navy-500" aria-hidden />
        ) : (
          <ImagePlus className="h-8 w-8 text-navy-500" aria-hidden />
        )}
        <p className="text-sm text-ink">
          Arraste fotos ou clique para selecionar
        </p>
        <p className="text-xs text-ink-muted">
          Máx. {maxFiles} fotos · {maxSizeMB}MB por arquivo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Button
          variant={ButtonVariant.Outline}
          size={ButtonSize.Sm}
          onClick={() => inputRef.current?.click()}
          disabled={uploading || restante === 0}
        >
          {restante === 0 ? 'Limite atingido' : 'Selecionar arquivos'}
        </Button>
      </div>

      {uploading && uploadProgress !== undefined ? (
        <div role="status" aria-live="polite">
          <Progress value={uploadProgress} tone={ProgressTone.Brand} />
          <span className="sr-only">Enviando fotos…</span>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-danger-700" role="alert">
          {error}
        </p>
      ) : null}

      {fotosExistentes.length > 0 ? (
        <>
          {onReorder ? (
            <p className="text-xs text-ink-muted">
              Arraste as fotos para reordenar. A primeira é a capa.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {fotosExistentes.map((foto, index) => (
              <div
                key={foto.id}
                draggable={Boolean(onReorder)}
                onDragStart={() => onReorder && setDragIndex(index)}
                onDragOver={(e) => {
                  if (!onReorder) return
                  e.preventDefault()
                  setOverIndex(index)
                }}
                onDragLeave={() => onReorder && setOverIndex(null)}
                onDrop={(e) => {
                  if (!onReorder) return
                  e.preventDefault()
                  handleReorderDrop(index)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-md border border-line',
                  onReorder && 'cursor-grab active:cursor-grabbing',
                  dragIndex === index && 'opacity-40',
                  overIndex === index &&
                    dragIndex !== index &&
                    'ring-2 ring-gold-400',
                )}
              >
                {onPhotoClick ? (
                  <button
                    type="button"
                    onClick={() => onPhotoClick(index)}
                    aria-label="Ampliar foto"
                    className="block h-full w-full cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-navy-700/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Capa
                  </span>
                ) : null}
                {onReorder ? (
                  <span
                    className="absolute bottom-1 left-1 rounded bg-white/90 p-0.5 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                {onRemoveExistente ? (
                  <button
                    type="button"
                    onClick={() => void onRemoveExistente(foto.id)}
                    aria-label="Remover foto"
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-danger-700 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
