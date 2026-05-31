'use client'

import { useEffect, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button, ButtonVariant } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { marcarRepassePago } from '@/lib/actions/repasses'
import { formatCurrency, formatMesAno } from '@/lib/utils/formatters'
import type { RepasseItem } from './repasses-client'

export type MarcarPagoDialogProps = {
  repasse?: RepasseItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MarcarPagoDialog({
  repasse,
  open,
  onOpenChange,
  onSuccess,
}: MarcarPagoDialogProps) {
  const [pending, startTransition] = useTransition()
  const [dataRepasse, setDataRepasse] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  )
  const [erro, setErro] = useState<string | undefined>()

  useEffect(() => {
    if (open) {
      setDataRepasse(format(new Date(), 'yyyy-MM-dd'))
      setErro(undefined)
    }
  }, [open, repasse?.id])

  const submit = () => {
    if (!repasse) return
    setErro(undefined)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRepasse)) {
      setErro('Informe uma data válida')
      return
    }
    startTransition(async () => {
      const res = await marcarRepassePago(repasse.id, dataRepasse)
      if (res.error) {
        setErro(res.error)
        toast.error(res.error)
        return
      }
      toast.success('Repasse marcado como pago')
      onSuccess()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar repasse como pago</DialogTitle>
          {repasse ? (
            <DialogDescription>
              {repasse.proprietario.nome} · {repasse.imovel.nome_interno} ·{' '}
              {formatMesAno(repasse.competencia_mes, repasse.competencia_ano)}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {repasse ? (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-sand-50 px-3 py-2 text-sm">
              <p className="text-xs text-ink-muted">Valor a repassar</p>
              <p className="font-display text-xl font-semibold text-navy-800">
                {formatCurrency(repasse.valor_repassado)}
              </p>
            </div>

            <Field label="Data do repasse" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="date"
                  value={dataRepasse}
                  onChange={(e) => setDataRepasse(e.target.value)}
                />
              )}
            </Field>

            {erro ? (
              <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                {erro}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant={ButtonVariant.Ghost}
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={ButtonVariant.Primary}
            onClick={submit}
            loading={pending}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
