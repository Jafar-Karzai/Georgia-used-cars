'use client'
// moved into (site) route group to use site layout

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { fetchVehicles } from '@/lib/api/vehicles-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Car, Shield, Phone, Mail, MapPin, ChevronRight, Award, CheckCircle } from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { Hero03 } from '@/components/marketing/hero-03'
import { getPublicStatusLabel, getPublicStatusBadgeStyle } from '@/lib/utils/vehicle-status'
import type { VehicleStatus } from '@/types/database'

interface FeaturedVehicle {
  id: string
  year: number
  make: string
  model: string
  purchase_price: number
  sale_price?: number
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
  current_status: string
  mileage?: number
  run_and_drive: boolean
}

export default function HomePage() {
  const [featuredVehicles, setFeaturedVehicles] = useState<FeaturedVehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedVehicles()
  }, [])

  const loadFeaturedVehicles = async () => {
    try {
      const response = await fetchVehicles({ is_public: true }, 1, 3)
      if (response.success && response.data) setFeaturedVehicles(response.data.slice(0, 3))
    } catch (error) {
      console.error('Failed to load featured vehicles:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      <Hero03 />

      {/* Featured Vehicles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Vehicles</h2>
            <p className="text-xl text-muted-foreground">Handpicked selections from our current inventory</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-60 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : featuredVehicles.length > 0 ? (
              featuredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/inventory/${vehicle.id}`}>
                    <div className="relative h-60 bg-muted overflow-hidden">
                      {vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url ? (
                        <Image
                          src={vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url || ''}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {getPublicStatusLabel(vehicle.current_status as VehicleStatus) && (
                        <Badge className={`absolute top-3 right-3 border font-semibold shadow-sm ${getPublicStatusBadgeStyle(vehicle.current_status as VehicleStatus)}`}>
                          {getPublicStatusLabel(vehicle.current_status as VehicleStatus)}
                        </Badge>
                      )}
                      {(vehicle.sale_price && vehicle.sale_price < 50000) && (
                        <Badge className="absolute top-3 left-3 bg-brand-red-500 text-white">
                          Great Deal
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        {vehicle.mileage && (
                          <p className="text-muted-foreground text-sm">
                            {vehicle.mileage.toLocaleString()} miles
                          </p>
                        )}
                        {vehicle.run_and_drive && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium">
                            Run & Drive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {vehicle.sale_price ? formatCurrency(vehicle.sale_price) : 'Contact for Price'}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No vehicles available at the moment</p>
                <p className="text-muted-foreground">Check back soon for new arrivals</p>
              </div>
            )}
          </div>

          {featuredVehicles.length > 0 && (
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg">
                <Link href="/inventory">
                  View All Vehicles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Georgia Used Cars?</h2>
            <p className="text-xl text-muted-foreground">Your trusted partner in quality vehicle imports</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every vehicle is carefully inspected and selected from reputable auction houses. We provide complete transparency about vehicle history and condition.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle>Expert Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Years of experience in salvage vehicle imports with deep knowledge of US and Canada auction markets. We handle all import procedures.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle>Complete Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  From initial inquiry to final delivery, we provide comprehensive support throughout your vehicle purchase journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-muted-foreground">Ready to find your next vehicle? Contact us today</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-muted-foreground">+971 55 546 7220</p>
            </Card>

            <Card className="text-center p-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-muted-foreground">info@georgiacars.com</p>
            </Card>

            <Card className="text-center p-6">
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

      {/* Footer now rendered globally in RootLayout via <SiteFooter /> */}
    </div>
  )
}
