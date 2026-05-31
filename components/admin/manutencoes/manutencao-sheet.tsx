'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardClock,
  Phone,
  PlayCircle,
  User,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import {
  ConfirmDialog,
  ConfirmVariant,
} from '@/components/ui/confirm-dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSide,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { UploadFotos } from '@/components/ui/upload-fotos'
import { Lightbox } from '@/components/ui/lightbox'
import {
  updateManutencao,
  uploadFotoManutencao,
} from '@/lib/actions/manutencoes'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { StatusManutencao } from '@/types'
import type { ManutencaoItem } from './manutencoes-client'

const RESOLVIDA_REQUER_CUSTO = true

export type ManutencaoSheetProps = {
  manutencao?: ManutencaoItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}

export function ManutencaoSheet({
  manutencao,
  open,
  onOpenChange,
  onChanged,
}: ManutencaoSheetProps) {
  const [pending, startTransition] = useTransition()
  const [fotosAntes, setFotosAntes] = useState<string[]>([])
  const [fotosDepois, setFotosDepois] = useState<string[]>([])
  const [uploadingAntes, setUploadingAntes] = useState(false)
  const [uploadingDepois, setUploadingDepois] = useState(false)
  const [resolvendo, setResolvendo] = useState(false)
  const [custoRealDraft, setCustoRealDraft] = useState(0)
  const [prestadorNome, setPrestadorNome] = useState('')
  const [prestadorContato, setPrestadorContato] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [lightbox, setLightbox] = useState<{
    fotos: string[]
    index: number
  } | null>(null)

  useEffect(() => {
    if (manutencao) {
      setFotosAntes(manutencao.fotos_antes ?? [])
      setFotosDepois(manutencao.fotos_depois ?? [])
      setCustoRealDraft(manutencao.custo_real ?? 0)
      setPrestadorNome(manutencao.prestador_nome ?? '')
      setPrestadorContato(manutencao.prestador_contato ?? '')
      setObservacoes(manutencao.observacoes ?? '')
      setResolvendo(false)
    }
  }, [manutencao?.id, manutencao])

  const dadosPrestadorMudaram = useMemo(() => {
    if (!manutencao) return false
    return (
      prestadorNome !== (manutencao.prestador_nome ?? '') ||
      prestadorContato !== (manutencao.prestador_contato ?? '') ||
      observacoes !== (manutencao.observacoes ?? '')
    )
  }, [manutencao, prestadorNome, prestadorContato, observacoes])

  if (!manutencao) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={SheetSide.Right}
          className="w-full max-w-md overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Manutenção</SheetTitle>
            <SheetDescription>Selecione um chamado</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const transicionar = (
    novo: StatusManutencao,
    extra?: { custo_real?: number },
  ) => {
    startTransition(async () => {
      const res = await updateManutencao(manutencao.id, {
        status: novo,
        ...(extra ?? {}),
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Status atualizado')
      onChanged?.()
    })
  }

  const salvarPrestador = () => {
    startTransition(async () => {
      const res = await updateManutencao(manutencao.id, {
        prestador_nome: prestadorNome || undefined,
        prestador_contato: prestadorContato || undefined,
        observacoes: observacoes || undefined,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Dados atualizados')
      onChanged?.()
    })
  }

  const confirmarResolucao = () => {
    if (RESOLVIDA_REQUER_CUSTO && custoRealDraft <= 0) {
      toast.error('Informe o custo real para concluir a resolução')
      return
    }
    transicionar(StatusManutencao.Resolvida, { custo_real: custoRealDraft })
  }

  const handleUpload = async (
    files: File[],
    tipo: 'antes' | 'depois',
  ) => {
    const setUploading = tipo === 'antes' ? setUploadingAntes : setUploadingDepois
    const setFotos = tipo === 'antes' ? setFotosAntes : setFotosDepois
    setUploading(true)
    try {
      for (const f of files) {
        const res = await uploadFotoManutencao(manutencao.id, f, tipo)
        if (res.error) {
          toast.error(res.error)
        } else if (res.data?.url) {
          setFotos((prev) => [...prev, res.data!.url])
        }
      }
      toast.success('Fotos enviadas')
      onChanged?.()
    } finally {
      setUploading(false)
    }
  }

  const podeIniciar =
    manutencao.status === StatusManutencao.Aberta ||
    manutencao.status === StatusManutencao.Aprovada
  const podeResolver =
    manutencao.status === StatusManutencao.EmAndamento ||
    manutencao.status === StatusManutencao.Aprovada ||
    manutencao.status === StatusManutencao.Aberta
  const podeCancelar =
    manutencao.status !== StatusManutencao.Resolvida &&
    manutencao.status !== StatusManutencao.Cancelada
  const habilitarFotosDepois =
    manutencao.status === StatusManutencao.Resolvida ||
    manutencao.status === StatusManutencao.EmAndamento ||
    manutencao.status === StatusManutencao.Aprovada
  const aguardando =
    manutencao.status === StatusManutencao.AguardandoAprovacao

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={SheetSide.Right}
        className="w-full max-w-md overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>{manutencao.imovel.nome_interno}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3" aria-hidden />
            {manutencao.imovel.proprietario.nome}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus
              variant={BadgeStatusVariant.Urgencia}
              status={manutencao.urgencia}
            />
            <BadgeStatus
              variant={BadgeStatusVariant.Manutencao}
              status={manutencao.status}
            />
            {manutencao.tipo ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-sand-100 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-gold-700">
                <Wrench className="h-3 w-3" aria-hidden />
                {manutencao.tipo}
              </span>
            ) : null}
          </div>

          {aguardando ? (
            <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Aguardando aprovação do proprietário ({manutencao.imovel.proprietario.email}).
              </span>
            </div>
          ) : null}

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Descrição
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">
              {manutencao.descricao}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-sand-50 p-3 text-xs">
            <div>
              <dt className="text-ink-muted">Aberta em</dt>
              <dd className="font-medium text-navy-800">
                {formatDate(manutencao.data_abertura)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Resolvida em</dt>
              <dd className="font-medium text-navy-800">
                {manutencao.data_resolucao
                  ? formatDate(manutencao.data_resolucao)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Custo estimado</dt>
              <dd className="font-medium text-navy-800">
                {manutencao.custo_estimado != null
                  ? formatCurrency(manutencao.custo_estimado)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Custo real</dt>
              <dd className="font-medium text-navy-800">
                {manutencao.custo_real != null
                  ? formatCurrency(manutencao.custo_real)
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {podeIniciar ? (
              <Button
                variant={ButtonVariant.Outline}
                size={ButtonSize.Sm}
                leadingIcon={<PlayCircle className="h-3.5 w-3.5" />}
                onClick={() => transicionar(StatusManutencao.EmAndamento)}
                loading={pending}
              >
                Iniciar
              </Button>
            ) : null}
            {podeResolver ? (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Sm}
                leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => setResolvendo(true)}
                disabled={pending}
              >
                Marcar como resolvida
              </Button>
            ) : null}
            {podeCancelar ? (
              <ConfirmDialog
                titulo="Cancelar manutenção?"
                descricao="O chamado ficará marcado como cancelado e não será concluído."
                confirmLabel="Cancelar manutenção"
                cancelLabel="Voltar"
                variant={ConfirmVariant.Destructive}
                onConfirm={() => transicionar(StatusManutencao.Cancelada)}
                trigger={
                  <Button
                    variant={ButtonVariant.Outline}
                    size={ButtonSize.Sm}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                }
              />
            ) : null}
          </div>

          {resolvendo ? (
            <div className="rounded-md border border-success-100 bg-success-50 p-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-success-700">
                Concluir resolução
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Field label="Custo real" required>
                  {({ id, describedBy }) => (
                    <CurrencyInput
                      id={id}
                      aria-describedby={describedBy}
                      value={custoRealDraft}
                      onValueChange={setCustoRealDraft}
                    />
                  )}
                </Field>
                <div className="flex items-end gap-2">
                  <Button
                    variant={ButtonVariant.Ghost}
                    size={ButtonSize.Sm}
                    onClick={() => setResolvendo(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Sm}
                    onClick={confirmarResolucao}
                    loading={pending}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-2xs text-ink-muted">
                Anexe fotos do antes/depois para registrar a conclusão.
              </p>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Prestador
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    value={prestadorNome}
                    onChange={(e) => setPrestadorNome(e.target.value)}
                    placeholder="Nome do profissional"
                  />
                )}
              </Field>
              <Field label="Contato">
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    value={prestadorContato}
                    onChange={(e) => setPrestadorContato(e.target.value)}
                    placeholder="(84) 99999-9999"
                  />
                )}
              </Field>
            </div>
            {manutencao.prestador_nome ? (
              <p className="flex items-center gap-2 text-xs text-ink-muted">
                <User className="h-3 w-3" aria-hidden /> {manutencao.prestador_nome}
                {manutencao.prestador_contato ? (
                  <>
                    <Phone className="ml-1 h-3 w-3" aria-hidden />
                    {manutencao.prestador_contato}
                  </>
                ) : null}
              </p>
            ) : null}

            <Field label="Observações internas">
              {({ id, describedBy }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              )}
            </Field>
            {dadosPrestadorMudaram ? (
              <div className="flex justify-end">
                <Button
                  variant={ButtonVariant.Outline}
                  size={ButtonSize.Sm}
                  onClick={salvarPrestador}
                  loading={pending}
                >
                  Salvar alterações
                </Button>
              </div>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Fotos — antes
            </p>
            <UploadFotos
              maxFiles={20}
              maxSizeMB={5}
              uploading={uploadingAntes}
              fotosExistentes={fotosAntes.map((url) => ({ id: url, url }))}
              onUpload={(f) => handleUpload(f, 'antes')}
              onPhotoClick={(index) => setLightbox({ fotos: fotosAntes, index })}
            />
          </div>

          <div className="space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
              Fotos — depois
            </p>
            {habilitarFotosDepois ? (
              <UploadFotos
                maxFiles={20}
                maxSizeMB={5}
                uploading={uploadingDepois}
                fotosExistentes={fotosDepois.map((url) => ({ id: url, url }))}
                onUpload={(f) => handleUpload(f, 'depois')}
                onPhotoClick={(index) =>
                  setLightbox({ fotos: fotosDepois, index })
                }
              />
            ) : (
              <p className="rounded-md border border-dashed border-line-strong bg-sand-50 px-3 py-4 text-center text-xs text-ink-muted">
                As fotos do depois ficam disponíveis quando o chamado entra em
                andamento.
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5 rounded-md border border-line bg-sand-50 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-navy-700">
              <ClipboardClock className="h-3.5 w-3.5 text-gold-600" aria-hidden /> Linha do tempo
            </p>
            <p>
              <span className="text-ink-muted">Aberta em</span>{' '}
              <span className="font-medium text-navy-800">
                {format(parseISO(manutencao.data_abertura), "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </p>
            {manutencao.aprovacao_proprietario !== undefined ? (
              <p>
                <span className="text-ink-muted">Resposta proprietário:</span>{' '}
                <span
                  className={`font-medium ${
                    manutencao.aprovacao_proprietario
                      ? 'text-success-700'
                      : 'text-danger-700'
                  }`}
                >
                  {manutencao.aprovacao_proprietario ? 'Aprovada' : 'Recusada'}
                </span>
                {manutencao.observacao_proprietario
                  ? ` — “${manutencao.observacao_proprietario}”`
                  : ''}
              </p>
            ) : null}
            {manutencao.data_resolucao ? (
              <p>
                <span className="text-ink-muted">Resolvida em</span>{' '}
                <span className="font-medium text-navy-800">
                  {format(parseISO(manutencao.data_resolucao), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
    <Lightbox
      fotos={lightbox?.fotos ?? []}
      index={lightbox?.index ?? null}
      onClose={() => setLightbox(null)}
      onNavigate={(index) =>
        setLightbox((prev) => (prev ? { ...prev, index } : prev))
      }
    />
    </>
  )
}
