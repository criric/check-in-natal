import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Check-in Natal — Hospitalidade Premium',
  description: 'Gestão de imóveis para aluguel de curta temporada em Natal/RN.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-sand-100 text-ink antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
