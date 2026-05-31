import { Skeleton } from '@/components/ui/skeleton'

/**
 * Fallback de carregamento para todas as rotas do grupo admin que não
 * possuem um loading.tsx próprio (o dashboard tem o seu). Reproduz o
 * cabeçalho de página + filtros + uma tabela genérica.
 */
export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-[1400px] p-4 md:p-6"
    >
      <span className="sr-only">Carregando…</span>

      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Tabela / lista */}
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line px-4 py-3.5">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
