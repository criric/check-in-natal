'use client'

import { useState, type ReactNode } from 'react'
import { Button, ButtonVariant } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

export enum ConfirmVariant {
  Default = 'default',
  Destructive = 'destructive',
}

export type ConfirmDialogProps = {
  trigger: ReactNode
  titulo: string
  descricao?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function ConfirmDialog({
  trigger,
  titulo,
  descricao,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = ConfirmVariant.Default,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao ? <DialogDescription>{descricao}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={ButtonVariant.Ghost}
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={
              variant === ConfirmVariant.Destructive
                ? ButtonVariant.Danger
                : ButtonVariant.Primary
            }
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
