import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <div className="mb-6">
        <Skeleton className="mb-2 h-9 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-line bg-white p-5"
          >
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-9 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-[400px] w-full" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Skeleton className="h-96 lg:col-span-3" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )
}
