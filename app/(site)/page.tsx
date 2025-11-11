'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { fetchVehicles } from '@/lib/api/vehicles-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Car,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
  Truck,
  Gem,
  Zap,
  Search,
  Eye,
  ShoppingCart,
  Wrench,
  Factory,
  Users,
  AlertTriangle,
  BadgeDollarSign,
  Network,
  Globe2,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { Hero03 } from '@/components/marketing/hero-03'
import { PublicVehicleCard } from '@/components/vehicles/public-vehicle-card'
import { FeaturedVehicleCarousel } from '@/components/vehicles/featured-vehicle-carousel'
import { CategoryCard } from '@/components/vehicles/category-card'

interface FeaturedVehicle {
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
  const [featuredVehicles, setFeaturedVehicles] = useState<FeaturedVehicle[]>([])
  const [arrivedVehicles, setArrivedVehicles] = useState<FeaturedVehicle[]>([])
  const [arrivingSoonVehicles, setArrivingSoonVehicles] = useState<FeaturedVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isUAE, setIsUAE] = useState<boolean | null>(null)

  useEffect(() => {
    loadAllVehicles()
    detectLocation()
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
      // Load featured vehicles
      const featured = await fetchVehicles({ is_public: true }, 1, 3)
      if (featured.success && featured.data) {
        setFeaturedVehicles(featured.data.slice(0, 3))
      }

      // Load arrived vehicles (have actual_arrival_date)
      const arrived = await fetchVehicles({ is_public: true }, 1, 6)
      if (arrived.success && arrived.data) {
        const arrivedFiltered = arrived.data.filter(v => v.actual_arrival_date).slice(0, 6)
        setArrivedVehicles(arrivedFiltered)
      }

      // Load arriving soon vehicles (have expected_arrival_date but no actual)
      const arriving = await fetchVehicles({ is_public: true }, 1, 6)
      if (arriving.success && arriving.data) {
        const arrivingFiltered = arriving.data.filter(
          v => v.expected_arrival_date && !v.actual_arrival_date
        ).slice(0, 6)
        setArrivingSoonVehicles(arrivingFiltered)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      <Hero03 />

      {/* Salvage Vehicle Disclaimer Badge */}
      <div className="bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Badge className="
              backdrop-blur-md
              bg-amber-500/90
              text-white
              border border-white/20
              px-5 py-2.5
              text-sm md:text-base
              font-semibold
              inline-flex items-center gap-2.5
              shadow-lg
              transition-all duration-300
              hover:bg-amber-500/95 hover:scale-105
            ">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Salvage Vehicles • Sold AS-IS • Cash Only • No Warranties</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Featured Vehicle Carousel */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full backdrop-blur-md bg-primary/90 text-white border border-white/20 shadow-lg transition-all duration-300 hover:bg-primary/95 hover:scale-105">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Featured Vehicles</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Handpicked Premium Selections</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our top picks from US and Canada auctions
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 md:px-8">
            <div className="relative w-full h-[500px] md:h-[600px] bg-muted rounded-xl animate-pulse" />
          </div>
        ) : featuredVehicles.length > 0 ? (
          <FeaturedVehicleCarousel vehicles={featuredVehicles} isUAE={isUAE} />
        ) : (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No vehicles available at the moment</p>
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-xl text-muted-foreground">Find the perfect vehicle for your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <CategoryCard
              name="SUVs"
              slug="suv"
              exampleModels={['Range Rover Sport', 'Mercedes GLE', 'Tesla Model X']}
              icon={<Car className="h-6 w-6 md:h-7 md:w-7" />}
            />
            <CategoryCard
              name="Sedans"
              slug="sedan"
              exampleModels={['BMW 5 Series', 'Audi A6', 'Toyota Camry']}
              icon={<Car className="h-6 w-6 md:h-7 md:w-7" />}
            />
            <CategoryCard
              name="Trucks"
              slug="truck"
              exampleModels={['Ford F-150', 'Chevrolet Silverado', 'RAM 1500']}
              icon={<Truck className="h-6 w-6 md:h-7 md:w-7" />}
            />
            <CategoryCard
              name="Luxury"
              slug="luxury"
              exampleModels={['Bentley Flying Spur', 'Mercedes S-Class', 'Lexus LS']}
              icon={<Gem className="h-6 w-6 md:h-7 md:w-7" />}
            />
            <CategoryCard
              name="Sports Cars"
              slug="sports"
              exampleModels={['Porsche 911', 'Audi R8', 'BMW M4']}
              icon={<Zap className="h-6 w-6 md:h-7 md:w-7" />}
            />
            <CategoryCard
              name="Electric"
              slug="electric"
              exampleModels={['Tesla Model S', 'Lucid Air', 'BMW i7']}
              icon={<Zap className="h-6 w-6 md:h-7 md:w-7" />}
            />
          </div>
        </div>
      </section>

      {/* How It Works - Benefits-Focused (Option B) */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent process from discovery to ownership
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20">
                  <Search className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <div className="mb-4">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Step 1</span>
                  <h3 className="text-2xl font-bold mt-2 mb-3">Find Your Project</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Browse imported salvage vehicles at unbeatable prices. Perfect for repairs, rebuilds, or parts.
                  Detailed photos and damage reports available.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20">
                  <Eye className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <div className="mb-4">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Step 2</span>
                  <h3 className="text-2xl font-bold mt-2 mb-3">See It Yourself</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Inspect the vehicle at our Sharjah showroom. Assess repair costs and feasibility.
                  Get honest guidance from our experienced team.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20">
                  <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <div className="mb-4">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Step 3</span>
                  <h3 className="text-2xl font-bold mt-2 mb-3">Complete Your Purchase</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Secure your vehicle with a deposit (cash purchases only).
                  Access our network of trusted repair shops and parts suppliers. We guide you through the restoration journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Arrived in Stock Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full backdrop-blur-md bg-green-500/90 text-white border border-white/20 shadow-lg transition-all duration-300 hover:bg-green-500/95 hover:scale-105">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Ready for Inspection</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Arrived in Stock</h2>
            <p className="text-xl text-muted-foreground">
              These vehicles are here now and ready to view in our Sharjah showroom
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-80 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-1/2" />
                  </div>
                </Card>
              ))
            ) : arrivedVehicles.length > 0 ? (
              arrivedVehicles.map((vehicle, index) => (
                <PublicVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isUAE={isUAE}
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

          {arrivedVehicles.length > 0 && (
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/inventory?status=arrived">
                  View All Available Vehicles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Arriving Soon Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full backdrop-blur-md bg-red-500/90 text-white border border-white/20 shadow-lg transition-all duration-300 hover:bg-red-500/95 hover:scale-105">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold">Pre-Order Opportunity</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Arriving Soon</h2>
            <p className="text-xl text-muted-foreground">
              Reserve these vehicles before they arrive at our showroom
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-80 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-1/2" />
                  </div>
                </Card>
              ))
            ) : arrivingSoonVehicles.length > 0 ? (
              arrivingSoonVehicles.map((vehicle, index) => (
                <PublicVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isUAE={isUAE}
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

          {arrivingSoonVehicles.length > 0 && (
            <div className="text-center mt-12">
              <Button asChild size="lg" variant="outline">
                <Link href="/inventory?status=arriving">
                  View All Arriving Vehicles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Value Propositions - Salvage-Specific */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Georgia Used Cars?</h2>
            <p className="text-xl text-muted-foreground">Your trusted partner in salvage vehicle imports</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                <BadgeDollarSign className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Unbeatable Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Access premium salvage vehicles from US and Canada auctions at fraction of retail cost.
                  Perfect for budget-conscious buyers and repair businesses.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Trusted Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We connect you with reliable repair shops and quality parts suppliers.
                  Benefit from our established relationships in the automotive industry.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-transform duration-300 hover:scale-110">
                <Globe2 className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Import Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Years of experience importing from US and Canada. We handle all paperwork,
                  shipping, and customs procedures for you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Buys From Us */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Buys From Us?</h2>
            <p className="text-xl text-muted-foreground">We serve diverse customers across the automotive industry</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">DIY Enthusiasts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Car enthusiasts looking for project vehicles to restore, customize, or rebuild from the ground up.
              </p>
            </Card>

            <Card className="text-center p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Factory className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Parts Dealers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automotive parts businesses sourcing quality components from salvage vehicles for resale.
              </p>
            </Card>

            <Card className="text-center p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Repair Shops</h3>
              <p className="text-muted-foreground leading-relaxed">
                Professional auto body shops and mechanics acquiring vehicles for repair and resale.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-muted-foreground">Ready to find your next project vehicle? Contact us today</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6 border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
              <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-muted-foreground">+971 55 546 7220</p>
            </Card>

            <Card className="text-center p-6 border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-muted-foreground">info@georgiacars.com</p>
            </Card>

            <Card className="text-center p-6 border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <p className="text-muted-foreground">Sharjah, UAE</p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/contact">
                Contact Us Today
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
