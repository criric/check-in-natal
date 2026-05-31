import { notFound } from 'next/navigation'
import { ImovelForm, type ProprietarioOption } from '@/components/admin/imoveis/imovel-form'
import { PageHeader } from '@/components/ui/page-header'
import { getImovelById } from '@/lib/actions/imoveis'
import { getProprietarios } from '@/lib/actions/proprietarios'
import type { ImovelInput } from '@/lib/validations'
import { Plataforma, StatusImovel, TipoImovel } from '@/types'

export const dynamic = 'force-dynamic'

type ImovelFull = {
  id: string
  proprietario_id: string
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
  status: StatusImovel
  comissao_percentual: number
  plataformas?: string[] | null
  instrucoes_checkin?: string | null
  codigo_acesso?: string | null
  wifi_nome?: string | null
  wifi_senha?: string | null
  fotos: Array<{ id: string; url: string }>
}

function nullToUndef<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

export default async function EditarImovelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [imovelRes, propsRes] = await Promise.all([
    getImovelById(id),
    getProprietarios(),
  ])

  if (imovelRes.error || !imovelRes.data) {
    notFound()
  }

  const imovel = imovelRes.data as ImovelFull
  const proprietarios: ProprietarioOption[] = (propsRes.data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
  }))

  const defaultValues: Partial<ImovelInput> = {
    proprietario_id: imovel.proprietario_id,
    nome_interno: imovel.nome_interno,
    endereco_completo: imovel.endereco_completo,
    bairro: imovel.bairro,
    cep: nullToUndef(imovel.cep),
    latitude: nullToUndef(imovel.latitude) as number | undefined,
    longitude: nullToUndef(imovel.longitude) as number | undefined,
    tipo: imovel.tipo,
    capacidade_hospedes: imovel.capacidade_hospedes,
    numero_quartos: nullToUndef(imovel.numero_quartos) as number | undefined,
    numero_banheiros: nullToUndef(imovel.numero_banheiros) as number | undefined,
    andar: nullToUndef(imovel.andar) as number | undefined,
    nome_condominio: nullToUndef(imovel.nome_condominio),
    status: imovel.status,
    comissao_percentual: Number(imovel.comissao_percentual),
    plataformas: (imovel.plataformas ?? undefined) as Plataforma[] | undefined,
    instrucoes_checkin: nullToUndef(imovel.instrucoes_checkin),
    codigo_acesso: nullToUndef(imovel.codigo_acesso),
    wifi_nome: nullToUndef(imovel.wifi_nome),
    wifi_senha: nullToUndef(imovel.wifi_senha),
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <PageHeader
        titulo={`Editar — ${imovel.nome_interno}`}
        descricao={imovel.bairro}
      />
      <ImovelForm
        modo="editar"
        imovelId={id}
        defaultValues={defaultValues}
        proprietarios={proprietarios}
        fotosExistentes={imovel.fotos ?? []}
      />
    </div>
  )
}
