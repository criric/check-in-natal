export type WhatsappFlutuanteProps = {
  numero: string
  mensagem?: string
}

export function WhatsappFlutuante({
  numero,
  mensagem = 'Olá, gostaria de saber mais sobre a gestão do meu imóvel.',
}: WhatsappFlutuanteProps) {
  const limpo = numero.replace(/\D/g, '')
  const href = `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 sm:h-8 sm:w-8"
        fill="currentColor"
        aria-hidden
      >
        <path d="M19.11 17.39c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47l-.52-.01c-.18 0-.48.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.64 1.11 2.82.14.18 1.92 2.93 4.64 4.11.65.28 1.15.45 1.55.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.29.23-.64.23-1.18.16-1.29-.07-.11-.25-.18-.52-.32Zm-4.93 6.69h-.01a9.97 9.97 0 0 1-5.07-1.39l-.36-.21-3.77.99 1.01-3.67-.24-.38a9.93 9.93 0 0 1-1.52-5.31c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.92a9.9 9.9 0 0 1 2.92 7.04c0 5.5-4.47 9.97-9.97 9.97Zm8.48-18.45A11.91 11.91 0 0 0 14.18 2C7.6 2 2.23 7.36 2.22 13.94c0 2.1.55 4.16 1.59 5.97L2.12 26l6.25-1.64a11.93 11.93 0 0 0 5.7 1.45h.01c6.58 0 11.94-5.36 11.95-11.94 0-3.19-1.24-6.19-3.5-8.45Z" />
      </svg>
    </a>
  )
}
