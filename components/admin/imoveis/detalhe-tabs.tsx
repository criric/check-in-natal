'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardEyebrow, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabCalendario, type BloqueioCal, type ReservaCal } from './tab-calendario'
import { TabFinanceiro, type RepasseRow } from './tab-financeiro'
import { TabLimpezas, type LimpezaRow } from './tab-limpezas'
import { TabManutencoes, type ManutencaoRow } from './tab-manutencoes'
import { TabReservas, type ReservaRow } from './tab-reservas'
import { TabVisaoGeral, type ImovelVisaoGeral } from './tab-visao-geral'

export type DetalheTabsProps = {
  imovel: ImovelVisaoGeral
  reservas: ReservaRow[]
  reservasCalendario: ReservaCal[]
  bloqueios: BloqueioCal[]
  receitaPorMes: Array<{ mes: string; receita_bruta: number }>
  kpisFinanceiros: { revpar: number; adr: number; taxa_ocupacao: number }
  repasses: RepasseRow[]
  limpezas: LimpezaRow[]
  manutencoes: ManutencaoRow[]
}

export function DetalheTabs(props: DetalheTabsProps) {
  return (
    <Tabs defaultValue="visao" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="visao">Visão geral</TabsTrigger>
        <TabsTrigger value="calendario">Calendário</TabsTrigger>
        <TabsTrigger value="reservas">Reservas</TabsTrigger>
        <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        <TabsTrigger value="limpezas">Limpezas</TabsTrigger>
        <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
        <TabsTrigger value="precificacao">Precificação</TabsTrigger>
      </TabsList>

      <TabsContent value="visao">
        <TabVisaoGeral imovel={props.imovel} />
      </TabsContent>

      <TabsContent value="calendario">
        <TabCalendario
          reservas={props.reservasCalendario}
          bloqueios={props.bloqueios}
        />
      </TabsContent>

      <TabsContent value="reservas">
        <TabReservas reservas={props.reservas} />
      </TabsContent>

      <TabsContent value="financeiro">
        <TabFinanceiro
          receitaPorMes={props.receitaPorMes}
          kpis={props.kpisFinanceiros}
          repasses={props.repasses}
        />
      </TabsContent>

      <TabsContent value="limpezas">
        <TabLimpezas limpezas={props.limpezas} />
      </TabsContent>

      <TabsContent value="manutencoes">
        <TabManutencoes manutencoes={props.manutencoes} />
      </TabsContent>

      <TabsContent value="precificacao">
        <Card>
          <CardEyebrow>Precificação dinâmica</CardEyebrow>
          <CardTitle className="mt-1 text-base">
            Calendário de preços e eventos sazonais
          </CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            A precificação dinâmica deste imóvel é gerenciada em uma página
            dedicada com calendário mensal, sugestões automáticas e ajustes
            por evento.
          </p>
          <Link
            href={`/imoveis/${props.imovel.id}/precos`}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            Abrir precificação
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
