'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'rounded-md border border-line shadow-md font-sans text-sm bg-white text-navy-800',
          title: 'font-medium',
          description: 'text-ink-muted',
        },
      }}
    />
  )
}
