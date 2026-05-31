import { createAdminClient } from '@/lib/supabase/admin'
import { StatusImovel, StatusReserva } from '@/types'
import { ComoFunciona } from '@/components/landing/como-funciona'
import { Comparativo } from '@/components/landing/comparativo'
import { ContatoSection } from '@/components/landing/contato-section'
import { Depoimentos } from '@/components/landing/depoimentos'
import { Faq } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Numeros } from '@/components/landing/numeros'
import {
  NumeroFormato,
  type NumeroDestaque,
} from '@/components/landing/numeros-tipos'
import { Simulador } from '@/components/landing/simulador'
import { WhatsappFlutuante } from '@/components/landing/whatsapp-flutuante'

export const revalidate = 300

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '5584999999999'
const EMAIL_CONTATO = process.env.ADMIN_EMAIL ?? 'contato@checkinnatal.com.br'
const INSTAGRAM = '@checkinnatal'
const CNPJ = '00.000.000/0001-00'

async function carregarDestaques(): Promise<NumeroDestaque[]> {
  const fallback: NumeroDestaque[] = [
    { label: 'Imóveis sob gestão', valor: 0, formato: NumeroFormato.Inteiro },
    { label: 'Repassado aos proprietários', valor: 0, formato: NumeroFormato.Moeda },
    { label: 'Avaliação média', valor: 0, formato: NumeroFormato.Decimal, sufixo: '★' },
    { label: 'Cidades atendidas', valor: 0, formato: NumeroFormato.Inteiro },
  ]

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return fallback
  }

  try {
    const admin = createAdminClient()

    const [imoveisRes, reservasRes, cidadesRes] = await Promise.all([
      admin
        .from('imoveis')
        .select('id', { count: 'exact', head: true })
        .eq('status', StatusImovel.Ativo),
      admin
        .from('reservas')
        .select('valor_liquido_proprietario, nota_hospede, status')
        .in('status', [
          StatusReserva.CheckinRealizado,
          StatusReserva.CheckoutRealizado,
        ]),
      admin.from('imoveis').select('cidade'),
    ])

    const totalImoveis = imoveisRes.count ?? 0

    const reservas = reservasRes.data ?? []
    const receitaTotal = reservas.reduce(
      (acc, r) => acc + (r.valor_liquido_proprietario ?? 0),
      0,
    )
    const notas = reservas
      .map((r) => r.nota_hospede)
      .filter((n): n is number => typeof n === 'number')
    const notaMedia =
      notas.length > 0
        ? notas.reduce((a, b) => a + b, 0) / notas.length
        : 0

    const cidades = new Set<string>()
    for (const row of cidadesRes.data ?? []) {
      if (row.cidade) cidades.add(row.cidade)
    }
    if (cidades.size === 0) cidades.add('Natal')

    return [
      {
        label: 'Imóveis sob gestão',
        valor: totalImoveis,
        formato: NumeroFormato.Inteiro,
      },
      {
        label: 'Repassado aos proprietários',
        valor: receitaTotal,
        formato: NumeroFormato.Moeda,
      },
      {
        label: 'Avaliação média',
        valor: notaMedia,
        formato: NumeroFormato.Decimal,
        sufixo: '★',
      },
      {
        label: 'Cidades atendidas',
        valor: cidades.size,
        formato: NumeroFormato.Inteiro,
      },
    ]
  } catch {
    return fallback
  }
}

export default async function HomePage() {
  const destaques = await carregarDestaques()

  return (
    <>
      <Hero />
      <ComoFunciona />
      <Numeros destaques={destaques} />
      <Simulador />
      <Comparativo />
      <Depoimentos />
      <Faq />
      <ContatoSection />
      <Footer
        whatsapp={WHATSAPP}
        email={EMAIL_CONTATO}
        instagram={INSTAGRAM}
        cnpj={CNPJ}
      />
      <WhatsappFlutuante numero={WHATSAPP} />
    </>
  )
}
