import { Skeleton } from '@/components/ui/skeleton'

/**
 * Fallback de carregamento para todas as rotas do portal do proprietário.
 * Reproduz o cabeçalho de página + um bloco de cards e listas.
 */
export default function PortalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-7xl space-y-6 p-4 md:p-6"
    >
      <span className="sr-only">Carregando…</span>

      {/* PageHeader */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Cards de destaque */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>

      {/* Conteúdo */}
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line px-4 py-3.5">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
