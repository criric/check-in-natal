import Link from 'next/link'
import { Logo, LogoVariant } from '@/components/ui/logo'

export type FooterProps = {
  whatsapp: string
  email: string
  instagram: string
  cnpj: string
}

export function Footer({ whatsapp, email, instagram, cnpj }: FooterProps) {
  const ano = new Date().getFullYear()

  return (
    <footer className="bg-navy-900 py-16 text-sand-100/80">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo
              variant={LogoVariant.Wordmark}
              className="h-10 w-auto"
              navyColor="#FAF6EE"
            />
            <p className="mt-4 max-w-sm text-sm text-sand-100/70">
              Hospitalidade premium em Natal/RN. Gerimos seu imóvel como se
              fosse nosso — para quem está perto e para quem está longe.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base text-sand-50">Navegação</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#como-funciona" className="hover:text-gold-300">Como funciona</a>
              </li>
              <li>
                <a href="#numeros" className="hover:text-gold-300">Resultados</a>
              </li>
              <li>
                <a href="#simulador" className="hover:text-gold-300">Simulador</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-gold-300">FAQ</a>
              </li>
              <li>
                <Link href="/login" className="hover:text-gold-300">
                  Área do proprietário
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-sand-50">Contato</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  className="hover:text-gold-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp · {whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="hover:text-gold-300">
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                  className="hover:text-gold-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram · {instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-navy-700 pt-6 text-xs text-sand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {ano} Check-in Natal · CNPJ {cnpj}</span>
          <span>Natal, RN · Brasil</span>
        </div>
      </div>
    </footer>
  )
}
