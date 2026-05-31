import Link from 'next/link'
import { CalendarCheck, ShieldCheck, Wallet } from 'lucide-react'
import { LoginForm } from './login-form'
import { Logo, LogoVariant } from '@/components/ui/logo'

export const dynamic = 'force-dynamic'

const beneficios = [
  {
    icone: CalendarCheck,
    titulo: 'Operação completa',
    descricao: 'Reservas, limpezas e manutenções coordenadas em um só lugar.',
  },
  {
    icone: Wallet,
    titulo: 'Repasses transparentes',
    descricao: 'Extratos mensais detalhados, do bruto ao líquido.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Acesso seguro',
    descricao: 'Login por senha para a equipe e link mágico para proprietários.',
  },
]

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Branding — oculto em mobile */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-gradient p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grain opacity-30" aria-hidden />

        <div className="relative">
          <Logo
            variant={LogoVariant.Wordmark}
            className="h-auto w-52"
            navyColor="#FFFFFF"
            goldColor="#C8A668"
          />
        </div>

        <div className="relative max-w-md">
          <span className="text-eyebrow text-gold-400">
            Hospitalidade Premium
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-white">
            Gestão inteligente de imóveis em Natal
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {beneficios.map(({ icone: Icone, titulo, descricao }) => (
              <li key={titulo} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold-400">
                  <Icone className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-white">{titulo}</p>
                  <p className="mt-0.5 text-sm text-white/70">{descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          Check-in Natal · Natal, RN
        </p>
      </aside>

      {/* Formulário */}
      <div className="relative flex w-full flex-col items-center justify-center bg-sand-gradient px-4 py-12 lg:w-1/2">
        <div className="absolute inset-0 bg-grain opacity-60 lg:hidden" aria-hidden />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo className="mb-2" />
          </div>

          <div className="mb-6">
            <span className="text-eyebrow">Acesso restrito</span>
            <h1 className="mt-2 font-display text-3xl text-navy-700">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Escolha seu perfil para acessar a plataforma.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-ink-subtle">
            Quer conhecer a gestão?{' '}
            <Link
              href="/"
              className="font-medium text-gold-700 transition-colors hover:text-gold-800"
            >
              Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
