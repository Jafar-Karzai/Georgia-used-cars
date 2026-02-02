'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { fetchVehicles } from '@/lib/api/vehicles-client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Car,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Truck,
  Gem,
  Zap,
  Search,
  Eye,
  ShoppingCart,
  Wrench,
  Factory,
  Users,
  BadgeDollarSign,
  Network,
  Globe2,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { Hero03 } from '@/components/marketing/hero-03'
import { PublicVehicleCard } from '@/components/vehicles/public-vehicle-card'
import { CategoryCard } from '@/components/vehicles/category-card'
import { getStatusesForGroup } from '@/lib/utils/vehicle-status'
import type { VehicleStatus } from '@/types/database'

interface VehicleData {
  id: string
  year: number
  make: string
  model: string
  sale_price?: number
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
  current_status: string
  mileage?: number
  run_and_drive: boolean
  expected_arrival_date?: string
  actual_arrival_date?: string
  sale_currency?: string
  sale_type?: string
  sale_price_includes_vat?: boolean
  fuel_type?: string
  transmission?: string
  body_style?: string
}

export default function NewHomePage() {
  const [arrivedVehicles, setArrivedVehicles] = useState<VehicleData[]>([])
  const [arrivingSoonVehicles, setArrivingSoonVehicles] = useState<VehicleData[]>([])
  const [loading, setLoading] = useState(true)
  const [isUAE, setIsUAE] = useState<boolean | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    loadAllVehicles()
    detectLocation()
    // Check authentication status from localStorage
    if (typeof window !== 'undefined') {
      const mockAuth = localStorage.getItem('mockAuth')
      setIsAuthenticated(mockAuth === 'true')
    }
  }, [])

  const detectLocation = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`API returned ${response.status}`)

      const data = await response.json()
      setIsUAE(data.country_code === 'AE')
    } catch (error) {
      console.warn('Location detection failed, defaulting to non-UAE:', error)
      setIsUAE(false)
    }
  }

  const loadAllVehicles = async () => {
    try {
      // Make a single optimized API call to fetch enough vehicles for all sections
      // Requesting 20 vehicles to ensure we have enough for filtering into both sections
      const response = await fetchVehicles({ is_public: true }, 1, 20)

      if (response.success && response.data) {
        const allVehicles = response.data

        // Get status groups - matches inventory page logic exactly
        const arrivedStatuses = getStatusesForGroup('arrived')
        const arrivingSoonStatuses = getStatusesForGroup('arriving_soon')

        // Split vehicles into sections based on current_status (not dates)
        const arrived = allVehicles.filter((v: VehicleData) =>
          arrivedStatuses.includes(v.current_status as VehicleStatus)
        ).slice(0, 6)

        const arriving = allVehicles.filter((v: VehicleData) =>
          arrivingSoonStatuses.includes(v.current_status as VehicleStatus)
        ).slice(0, 6)

        setArrivedVehicles(arrived)
        setArrivingSoonVehicles(arriving)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-pattern">
      <SiteNavbar />

      <Hero03 />

      {/* Stats Strip */}
      <section className="frosted-panel border-y">
        <div className="max-w-content mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="p-6 border-r border-border">
              <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Hub Location</p>
              <p className="text-lg font-extrabold text-foreground">Sharjah, UAE</p>
            </div>
            <div className="p-6 border-r border-border">
              <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Vehicle Type</p>
              <p className="text-lg font-extrabold text-foreground">Salvage / AS-IS</p>
            </div>
            <div className="p-6 border-r border-border">
              <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Payment</p>
              <p className="text-lg font-extrabold text-foreground">Cash Only</p>
            </div>
            <div className="p-6">
              <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Auction Partners</p>
              <p className="text-lg font-extrabold text-foreground">Copart / IAAI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Arrived in Stock Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-2">Ready for Inspection</p>
              <h2 className="text-3xl font-extrabold tracking-tight">Arrived in Stock</h2>
            </div>
            {arrivedVehicles.length > 0 && (
              <Link
                href="/inventory?status=arrived"
                className="text-sm font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-2"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-1/2" />
                  </div>
                </div>
              ))
            ) : arrivedVehicles.length > 0 ? (
              arrivedVehicles.map((vehicle, index) => (
                <PublicVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isUAE={isUAE}
                  isAuthenticated={isAuthenticated}
                  priority={index === 0}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No vehicles in stock at the moment</p>
                <p className="text-muted-foreground">Check back soon for new arrivals</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Arriving Soon Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] uppercase font-bold text-precision-500 tracking-widest mb-2">Currently In Transit</p>
              <h2 className="text-3xl font-extrabold tracking-tight">Arriving Soon</h2>
            </div>
            {arrivingSoonVehicles.length > 0 && (
              <Link
                href="/inventory?status=arriving"
                className="text-sm font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-2"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-1/2" />
                  </div>
                </div>
              ))
            ) : arrivingSoonVehicles.length > 0 ? (
              arrivingSoonVehicles.map((vehicle) => (
                <PublicVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isUAE={isUAE}
                  isAuthenticated={isAuthenticated}
                  priority={false}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No vehicles arriving soon</p>
                <p className="text-muted-foreground">Check our current inventory</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-2">Browse By</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Vehicle Categories</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <CategoryCard
              name="SUVs"
              slug="suv"
              exampleModels={['Range Rover Sport', 'Mercedes GLE', 'Tesla Model X']}
              icon={<Car className="h-6 w-6" />}
            />
            <CategoryCard
              name="Sedans"
              slug="sedan"
              exampleModels={['BMW 5 Series', 'Audi A6', 'Toyota Camry']}
              icon={<Car className="h-6 w-6" />}
            />
            <CategoryCard
              name="Trucks"
              slug="truck"
              exampleModels={['Ford F-150', 'Chevrolet Silverado', 'RAM 1500']}
              icon={<Truck className="h-6 w-6" />}
            />
            <CategoryCard
              name="Luxury"
              slug="luxury"
              exampleModels={['Bentley Flying Spur', 'Mercedes S-Class', 'Lexus LS']}
              icon={<Gem className="h-6 w-6" />}
            />
            <CategoryCard
              name="Sports"
              slug="sports"
              exampleModels={['Porsche 911', 'Audi R8', 'BMW M4']}
              icon={<Zap className="h-6 w-6" />}
            />
            <CategoryCard
              name="Electric"
              slug="electric"
              exampleModels={['Tesla Model S', 'Lucid Air', 'BMW i7']}
              icon={<Zap className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-precision-900 text-white">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase font-bold text-precision-400 tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-precision-600 flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-5xl font-black text-precision-800 mb-3 font-mono">01</p>
              <h3 className="font-bold text-lg mb-2">Browse & Select</h3>
              <p className="text-sm text-precision-300">Explore our curated inventory with detailed damage reports and photos.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-precision-600 flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <p className="text-5xl font-black text-precision-800 mb-3 font-mono">02</p>
              <h3 className="font-bold text-lg mb-2">Inspect in Person</h3>
              <p className="text-sm text-precision-300">Visit our Sharjah yard to inspect in-stock units before you buy.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-precision-600 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-5xl font-black text-precision-800 mb-3 font-mono">03</p>
              <h3 className="font-bold text-lg mb-2">Complete Purchase</h3>
              <p className="text-sm text-precision-300">Finalize payment (cash only). We handle all documentation.</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-action-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-5xl font-black text-precision-800 mb-3 font-mono">04</p>
              <h3 className="font-bold text-lg mb-2">Take Delivery</h3>
              <p className="text-sm text-precision-300">Collect from our yard or arrange delivery anywhere in UAE.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 md:py-20">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-3xl font-extrabold tracking-tight">The Georgia Advantage</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="alumina-surface rounded-2xl border border-border p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-precision-100 text-precision-900 flex items-center justify-center mb-6">
                <BadgeDollarSign className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl mb-3">Unbeatable Prices</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access premium salvage vehicles from US and Canada auctions at a fraction of retail cost. Perfect for budget-conscious buyers.
              </p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-action-100 text-action-600 flex items-center justify-center mb-6">
                <Network className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl mb-3">Trusted Network</h3>
              <p className="text-muted-foreground leading-relaxed">
                We connect you with reliable repair shops and quality parts suppliers. Benefit from our established industry relationships.
              </p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-6">
                <Globe2 className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl mb-3">Import Expertise</h3>
              <p className="text-muted-foreground leading-relaxed">
                Years of experience importing from US and Canada. We handle all paperwork, shipping, and customs procedures for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Buys From Us */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-2">Our Customers</p>
            <h2 className="text-3xl font-extrabold tracking-tight">Who Buys From Us?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="alumina-surface rounded-2xl border border-border p-8 text-center card-hover">
              <div className="icon-circle bg-precision-100 text-precision-900 mx-auto mb-4">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">DIY Enthusiasts</h3>
              <p className="text-sm text-muted-foreground">
                Car enthusiasts looking for project vehicles to restore, customize, or rebuild.
              </p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-8 text-center card-hover">
              <div className="icon-circle bg-precision-100 text-precision-900 mx-auto mb-4">
                <Factory className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Parts Dealers</h3>
              <p className="text-sm text-muted-foreground">
                Automotive parts businesses sourcing quality components from salvage vehicles.
              </p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-8 text-center card-hover">
              <div className="icon-circle bg-precision-100 text-precision-900 mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Repair Shops</h3>
              <p className="text-sm text-muted-foreground">
                Professional auto body shops acquiring vehicles for repair and resale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-content mx-auto hero-gradient rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Ready to Find Your Next Vehicle?</h2>
              <p className="text-precision-200 text-sm uppercase tracking-widest font-bold">
                Direct Auction Access • Customs Clearance • UAE-Wide Delivery
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-action-600 hover:bg-action-700 text-white btn-precision">
                <Link href="/inventory">
                  Browse Inventory
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-white/30 hover:border-white/60 text-white bg-transparent hover:bg-white/10">
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Strip */}
      <section className="py-12 md:py-16">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="alumina-surface rounded-2xl border border-border p-6 text-center card-hover">
              <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Phone</h3>
              <p className="text-muted-foreground">+971 55 546 7220</p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-6 text-center card-hover">
              <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Email</h3>
              <p className="text-muted-foreground">info@georgiacars.com</p>
            </div>

            <div className="alumina-surface rounded-2xl border border-border p-6 text-center card-hover">
              <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Location</h3>
              <p className="text-muted-foreground">Sharjah Industrial Area</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
