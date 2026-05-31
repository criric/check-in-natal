'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, MapPin, User } from 'lucide-react'
import { BadgeStatus, BadgeStatusVariant } from '@/components/ui/badge-status'
import { Card, CardEyebrow, CardTitle } from '@/components/ui/card'
import { PlataformaBadge } from '@/components/ui/plataforma-badge'
import { Plataforma, StatusImovel, TipoImovel } from '@/types'

const MapaMiniInner = dynamic(() => import('./mapa-mini-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-48 animate-pulse rounded-md bg-sand-100" aria-hidden />
  ),
})

const TIPO_LABEL: Record<TipoImovel, string> = {
  [TipoImovel.Apartamento]: 'Apartamento',
  [TipoImovel.Casa]: 'Casa',
  [TipoImovel.Quarto]: 'Quarto',
  [TipoImovel.Studio]: 'Studio',
  [TipoImovel.Cobertura]: 'Cobertura',
}

export type ImovelVisaoGeral = {
  id: string
  nome_interno: string
  endereco_completo: string
  bairro: string
  cep?: string | null
  latitude?: number | null
  longitude?: number | null
  tipo: TipoImovel
  capacidade_hospedes: number
  numero_quartos?: number | null
  numero_banheiros?: number | null
  andar?: number | null
  nome_condominio?: string | null
  comissao_percentual: number
  plataformas?: string[] | null
  instrucoes_checkin?: string | null
  codigo_acesso?: string | null
  wifi_nome?: string | null
  wifi_senha?: string | null
  fotos: Array<{ id: string; url: string }>
  proprietario: { id: string; nome: string; email: string; telefone?: string | null }
}

function CarrosselFotos({ fotos }: { fotos: ImovelVisaoGeral['fotos'] }) {
  const [idx, setIdx] = useState(0)

  if (fotos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-line bg-sand-50">
        <p className="text-sm text-ink-muted">Nenhuma foto cadastrada</p>
      </div>
    )
  }

  const atual = fotos[Math.min(idx, fotos.length - 1)]
  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-sand-50">
        <Image
          src={atual.url}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {fotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === idx ? 'border-gold-500' : 'border-line'
              }`}
              aria-label={`Foto ${i + 1}`}
            >
              <Image src={f.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CampoAcesso({
  label,
  valor,
}: {
  label: string
  valor?: string | null
}) {
  const [revelado, setRevelado] = useState(false)
  if (!valor) {
    return (
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm text-ink-subtle">—</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="flex items-center gap-2">
        <p className="font-mono text-sm text-navy-800">
          {revelado ? valor : '••••••••'}
        </p>
        <button
          type="button"
          onClick={() => setRevelado((r) => !r)}
          aria-label={revelado ? 'Ocultar' : 'Revelar'}
          className="rounded p-1 text-ink-muted hover:text-navy-700"
        >
          {revelado ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

function DataItem({
  label,
  valor,
}: {
  label: string
  valor: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-sm font-medium text-navy-800">{valor}</p>
    </div>
  )
}

export function TabVisaoGeral({ imovel }: { imovel: ImovelVisaoGeral }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <CarrosselFotos fotos={imovel.fotos} />
        {imovel.latitude != null && imovel.longitude != null ? (
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-line p-3">
              <CardEyebrow>Localização</CardEyebrow>
              <p className="mt-1 flex items-start gap-2 text-sm text-ink">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                {imovel.endereco_completo}
              </p>
            </div>
            <MapaMiniInner
              latitude={Number(imovel.latitude)}
              longitude={Number(imovel.longitude)}
              titulo={imovel.nome_interno}
            />
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <Card>
          <CardEyebrow>Dados cadastrais</CardEyebrow>
          <CardTitle className="mb-4 mt-1 text-base">
            Informações do imóvel
          </CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <DataItem label="Tipo" valor={TIPO_LABEL[imovel.tipo]} />
            <DataItem
              label="Capacidade"
              valor={`${imovel.capacidade_hospedes} hóspedes`}
            />
            <DataItem
              label="Quartos"
              valor={imovel.numero_quartos ?? '—'}
            />
            <DataItem
              label="Banheiros"
              valor={imovel.numero_banheiros ?? '—'}
            />
            <DataItem label="Andar" valor={imovel.andar ?? '—'} />
            <DataItem
              label="Condomínio"
              valor={imovel.nome_condominio ?? '—'}
            />
            <DataItem
              label="Comissão"
              valor={`${Number(imovel.comissao_percentual).toFixed(1)}%`}
            />
            <DataItem
              label="Bairro"
              valor={imovel.bairro}
            />
          </div>
          {imovel.plataformas && imovel.plataformas.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-ink-muted">Plataformas</p>
              <div className="flex flex-wrap gap-2">
                {imovel.plataformas.map((p) => (
                  <PlataformaBadge
                    key={p}
                    plataforma={p as Plataforma}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardEyebrow>Acesso</CardEyebrow>
          <CardTitle className="mb-4 mt-1 text-base">
            Informações sensíveis
          </CardTitle>
          <div className="space-y-3">
            <CampoAcesso label="Código de acesso" valor={imovel.codigo_acesso} />
            <CampoAcesso label="Wi-Fi (nome)" valor={imovel.wifi_nome} />
            <CampoAcesso label="Wi-Fi (senha)" valor={imovel.wifi_senha} />
          </div>
          {imovel.instrucoes_checkin ? (
            <div className="mt-4 rounded-md bg-sand-50 p-3">
              <p className="text-xs text-ink-muted">Instruções de check-in</p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">
                {imovel.instrucoes_checkin}
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardEyebrow>Proprietário</CardEyebrow>
          <div className="mt-2 flex items-start gap-3">
            <div className="rounded-full bg-sand-100 p-2 text-navy-600">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/proprietarios/${imovel.proprietario.id}`}
                className="font-medium text-navy-800 hover:underline"
              >
                {imovel.proprietario.nome}
              </Link>
              <p className="truncate text-xs text-ink-muted">
                {imovel.proprietario.email}
              </p>
              {imovel.proprietario.telefone ? (
                <p className="text-xs text-ink-muted">
                  {imovel.proprietario.telefone}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
