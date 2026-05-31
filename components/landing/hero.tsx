import Link from 'next/link'
import { Button, ButtonSize, ButtonVariant } from '@/components/ui/button'
import { Logo, LogoVariant } from '@/components/ui/logo'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-navy-gradient"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=70')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/60 to-navy-900/85"
      />

      <header className="container-page relative z-10 flex items-center justify-between pt-8">
        <Logo variant={LogoVariant.Wordmark} className="h-10 w-auto" navyColor="#FAF6EE" />
        <nav className="hidden items-center gap-6 text-sm text-sand-50 md:flex">
          <a href="#como-funciona" className="hover:text-gold-300">Como funciona</a>
          <a href="#numeros" className="hover:text-gold-300">Resultados</a>
          <a href="#simulador" className="hover:text-gold-300">Simulador</a>
          <a href="#faq" className="hover:text-gold-300">FAQ</a>
          <Link
            href="/login"
            className="rounded-md border border-gold-400/60 px-3 py-1.5 text-sand-50 hover:bg-gold-500 hover:text-navy-900"
          >
            Já sou proprietário
          </Link>
        </nav>
      </header>

      <div className="container-page relative z-10 flex min-h-[78vh] flex-col justify-center py-24 text-sand-50">
        <span className="text-eyebrow text-gold-300">
          Gestão completa · Natal, RN
        </span>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-sand-50 sm:text-5xl md:text-6xl">
          Seu imóvel em Natal gerando renda com{' '}
          <span className="text-gold-300">zero preocupação</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-sand-100/90">
          Cuidamos de tudo — anúncios, hóspedes, limpeza, manutenção e repasses
          mensais. Você só acompanha pelo portal e recebe o depósito.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#contato">
            <Button size={ButtonSize.Lg} variant={ButtonVariant.Secondary}>
              Quero saber mais
            </Button>
          </a>
          <Link href="/login">
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Outline}
              className="border-sand-50/40 bg-transparent text-sand-50 hover:bg-sand-50/10 hover:text-sand-50"
            >
              Já sou proprietário
            </Button>
          </Link>
        </div>

        <div className="mt-14 hidden items-center gap-6 text-xs uppercase tracking-[0.25em] text-sand-100/70 sm:flex">
          <span>Airbnb</span>
          <span aria-hidden>·</span>
          <span>Booking</span>
          <span aria-hidden>·</span>
          <span>Reserva direta</span>
          <span aria-hidden>·</span>
          <span>VRBO</span>
        </div>
      </div>
    </section>
  )
}
