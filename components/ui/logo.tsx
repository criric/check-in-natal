import type { SVGProps } from 'react'
import { cn } from '@/lib/utils/cn'

export enum LogoVariant {
  Full = 'full',
  Mark = 'mark',
  Wordmark = 'wordmark',
}

export type LogoProps = {
  variant?: LogoVariant
  className?: string
  navyColor?: string
  goldColor?: string
  title?: string
}

export function Logo({
  variant = LogoVariant.Full,
  className,
  navyColor = '#1F3A57',
  goldColor = '#C8A668',
  title = 'Check-in Natal',
}: LogoProps) {
  if (variant === LogoVariant.Mark) {
    return (
      <BrandMark
        className={className}
        navyColor={navyColor}
        goldColor={goldColor}
        title={title}
      />
    )
  }

  if (variant === LogoVariant.Wordmark) {
    return (
      <BrandWordmark
        className={className}
        navyColor={navyColor}
        goldColor={goldColor}
        title={title}
      />
    )
  }

  return (
    <span
      className={cn('inline-flex flex-col items-center gap-3', className)}
      role="img"
      aria-label={title}
    >
      <BrandMark
        className="h-16 w-auto"
        navyColor={navyColor}
        goldColor={goldColor}
        title={title}
      />
      <BrandWordmark
        className="h-auto w-44"
        navyColor={navyColor}
        goldColor={goldColor}
        title={title}
      />
    </span>
  )
}

type MarkProps = Pick<SVGProps<SVGSVGElement>, 'className'> & {
  navyColor: string
  goldColor: string
  title: string
}

function BrandMark({ className, navyColor, goldColor, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        d="M70 50 A30 30 0 0 1 130 50"
        stroke={goldColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="118" cy="48" r="8" fill={goldColor} />
      <path
        d="M10 80 C 40 60, 70 100, 100 80 S 160 60, 190 80"
        stroke={navyColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M10 102 C 40 82, 70 122, 100 102 S 160 82, 190 102"
        stroke={goldColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M10 122 C 40 102, 70 142, 100 122 S 160 102, 190 122"
        stroke={navyColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BrandWordmark({ className, navyColor, goldColor, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 320 80"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text
        x="0"
        y="44"
        fill={navyColor}
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="40"
        fontWeight="700"
      >
        Check-in
      </text>
      <text
        x="178"
        y="44"
        fill={navyColor}
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="40"
        fontWeight="400"
      >
        Natal
      </text>
      <text
        x="0"
        y="68"
        fill={goldColor}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="2.4"
      >
        HOSPITALIDADE PREMIUM · NATAL, RN
      </text>
    </svg>
  )
}
