import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading state for the homepage
 * Shown while the Server Component fetches vehicle data
 */
export default function HomePageLoading() {
  return (
    <div className="min-h-screen bg-background bg-pattern">
      {/* Navbar skeleton */}
      <div className="frosted-panel border-b sticky top-0 z-50">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="hidden md:flex items-center gap-8">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="hero-gradient relative overflow-hidden py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-full max-w-md" />
              <Skeleton className="h-16 w-full max-w-sm" />
              <Skeleton className="h-6 w-full max-w-lg" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-14 w-40 rounded-xl" />
                <Skeleton className="h-14 w-40 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Stats strip skeleton */}
      <section className="frosted-panel border-y">
        <div className="max-w-content mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 border-r border-border last:border-r-0">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arrived in Stock skeleton */}
      <section className="py-16 md:py-20">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arriving Soon skeleton */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
