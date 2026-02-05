import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronRight } from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { Hero03 } from '@/components/marketing/hero-03'
import { VehicleGridClient, VehicleGridSkeleton } from '@/components/vehicles/vehicle-grid-client'
import { fetchHomepageVehicles } from '@/lib/api/vehicles-server'
import {
  StatsStrip,
  CategoriesSection,
  HowItWorksSection,
  ValuePropositionsSection,
  WhoBuysFromUsSection,
  CTABanner,
} from '@/components/marketing'

// Revalidate the page every 60 seconds for fresh vehicle data
export const revalidate = 60

/**
 * Homepage Server Component
 * Fetches vehicle data at build/request time for SEO and fast LCP
 */
export default async function HomePage() {
  // Fetch vehicles on the server - this data will be in the HTML response
  const { arrivedVehicles, arrivingSoonVehicles } = await fetchHomepageVehicles()

  return (
    <div className="min-h-screen bg-background bg-pattern">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <SiteNavbar />

      <main id="main-content" role="main">
        <Hero03 />

        {/* Stats Strip - Server rendered static content */}
        <StatsStrip />

        {/* Arrived in Stock Section */}
        <section className="py-16 md:py-20" aria-labelledby="arrived-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="flex justify-between items-end mb-10">
              <div>
                <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">Ready for Inspection</p>
                <h2 id="arrived-heading" className="text-3xl font-extrabold tracking-tight">Arrived in Stock</h2>
              </div>
              {arrivedVehicles.length > 0 && (
                <Link
                  href="/inventory?status=arrived"
                  className="text-sm font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-2"
                  aria-label="View all arrived vehicles"
                >
                  View All <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>

            <Suspense fallback={<VehicleGridSkeleton count={6} />}>
              <VehicleGridClient
                vehicles={arrivedVehicles}
                sectionType="arrived"
              />
            </Suspense>
          </div>
        </section>

        {/* Arriving Soon Section */}
        <section className="py-16 md:py-20 bg-secondary/30" aria-labelledby="arriving-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="flex justify-between items-end mb-10">
              <div>
                <p className="text-2xs uppercase font-bold text-precision-500 tracking-widest mb-2">Currently In Transit</p>
                <h2 id="arriving-heading" className="text-3xl font-extrabold tracking-tight">Arriving Soon</h2>
              </div>
              {arrivingSoonVehicles.length > 0 && (
                <Link
                  href="/inventory?status=arriving"
                  className="text-sm font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-2"
                  aria-label="View all arriving vehicles"
                >
                  View All <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>

            <Suspense fallback={<VehicleGridSkeleton count={6} />}>
              <VehicleGridClient
                vehicles={arrivingSoonVehicles}
                sectionType="arriving"
              />
            </Suspense>
          </div>
        </section>

        {/* Categories Section - Server rendered static content */}
        <CategoriesSection />

        {/* How It Works - Server rendered static content */}
        <HowItWorksSection />

        {/* Value Propositions - Server rendered static content */}
        <ValuePropositionsSection />

        {/* Who Buys From Us - Server rendered static content */}
        <WhoBuysFromUsSection />

        {/* CTA Banner - Server rendered static content */}
        <CTABanner />
      </main>
    </div>
  )
}
