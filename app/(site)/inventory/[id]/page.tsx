'use client'
// moved into (site) route group to use site layout

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { fetchVehicleById, fetchVehicles } from '@/lib/api/vehicles-client'
import { Vehicle, VehiclePhoto } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { getPublicStatusLabel, getPublicStatusBadgeStyle } from '@/lib/utils/vehicle-status'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import {
  Car,
  ChevronRight,
  ChevronLeft,
  Home,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Palette,
  MapPin,
  FileText,
  Phone,
  Mail,
  Eye,
  ImageIcon,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Key,
  Settings2,
  Circle
} from 'lucide-react'

// Local interface for page-specific needs, extending the database Vehicle type
interface PageVehicle extends Vehicle {
  // Map legacy field names to database field names for backward compatibility
  status?: string // maps to current_status
  color?: string // maps to exterior_color
  body_type?: string // maps to body_style
  engine_size?: string // maps to engine
  auction_date?: string // maps to sale_date
  location?: string // maps to current_location
  // Additional fields from public API
  engine?: string
  exterior_color?: string
  interior_color?: string
  drivetrain?: string
  title_status?: string
  keys_available?: boolean
  lot_number?: string
  auction_location?: string
  damage_description?: string
  expected_arrival_date?: string
  actual_arrival_date?: string
  // Additional fields not in database
  grade?: string
  condition_report?: string
  inspection_notes?: string
  features?: string[]
}

type PublicVehicle = PageVehicle

export default function VehicleDetailPage() {
  const params = useParams()
  const vehicleId = params.id as string

  const [vehicle, setVehicle] = useState<PageVehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedVehicles, setRelatedVehicles] = useState<PageVehicle[]>([])

  // Define functions with useCallback to provide stable dependencies
  const loadVehicleImpl = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchVehicleById(vehicleId)
      if (response.success && response.data) setVehicle(response.data)
      else setError('Vehicle not found')
    } catch (err) {
      console.error('Failed to load vehicle:', err)
      setError('Failed to load vehicle details')
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  const loadRelatedVehiclesImpl = useCallback(async () => {
    try {
      // get a few public vehicles as related
      const response = await fetchVehicles({ is_public: true, status: 'ready_for_sale' }, 1, 4)
      if (response.success && response.data) setRelatedVehicles((response.data || []).filter((v: PublicVehicle) => v.id !== vehicleId).slice(0,3))
    } catch (error) {
      console.error('Failed to load related vehicles:', error)
    }
  }, [vehicleId])

  useEffect(() => {
    if (vehicleId) {
      loadVehicleImpl()
      loadRelatedVehiclesImpl()
    }
  }, [vehicleId, loadVehicleImpl, loadRelatedVehiclesImpl])


  const formatCurrency = (amount: number | null | undefined) => {
    // Only show price if amount exists and is greater than 0
    if (!amount || amount <= 0) return 'Contact for Price'
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const nextImage = () => {
    if (vehicle?.vehicle_photos && vehicle.vehicle_photos.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === (vehicle.vehicle_photos?.length ?? 0) - 1 ? 0 : prev + 1
      )
    }
  }

  const previousImage = () => {
    if (vehicle?.vehicle_photos && vehicle.vehicle_photos.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? (vehicle.vehicle_photos?.length ?? 0) - 1 : prev - 1
      )
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNavbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNavbar />
        
        <div className="container mx-auto px-4 py-16 text-center">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Vehicle Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The vehicle you are looking for does not exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Calculate display price based on sale type and location
  const getDisplayPrice = () => {
    // Only calculate display price if sale_price exists and is > 0
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return null

    const basePrice = vehicle.sale_price
    const saleType = vehicle.sale_type || 'local_and_export'
    const includesVat = vehicle.sale_price_includes_vat ?? false

    if (saleType === 'export_only') {
      return basePrice
    }

    if (saleType === 'local_only') {
      return includesVat ? basePrice : basePrice * 1.05
    }

    // For local_and_export, show with VAT (since we're on UAE site)
    return includesVat ? basePrice : basePrice * 1.05
  }

  const getVatAmount = () => {
    if (!vehicle.sale_price || vehicle.sale_price <= 0 || vehicle.sale_type === 'export_only') return 0
    const includesVat = vehicle.sale_price_includes_vat ?? false
    return includesVat ? 0 : vehicle.sale_price * 0.05
  }

  const getDamageSeverityBadge = (severity: string | undefined) => {
    if (!severity) return null

    const severityMap: Record<string, { label: string; className: string }> = {
      'minor': {
        label: 'Minor Damage',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-colors'
      },
      'moderate': {
        label: 'Moderate Damage',
        className: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-colors'
      },
      'major': {
        label: 'Major Damage',
        className: 'bg-orange-50 text-orange-900 border-orange-300 hover:bg-orange-100 hover:border-orange-400 transition-colors'
      },
      'total_loss': {
        label: 'Total Loss',
        className: 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100 hover:border-red-400 transition-colors'
      }
    }

    return severityMap[severity] || null
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/inventory" className="hover:text-foreground transition-colors">
              Inventory
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
              {vehicle.vehicle_photos && vehicle.vehicle_photos.length > 0 ? (
                <>
                  <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicle.vehicle_photos[currentImageIndex].url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  /></>
                  {vehicle.vehicle_photos.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur"
                        onClick={previousImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur rounded-full px-3 py-1 text-sm">
                        {currentImageIndex + 1} / {vehicle.vehicle_photos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Strip - Tighter Spacing */}
            {vehicle.vehicle_photos && vehicle.vehicle_photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {vehicle.vehicle_photos.map((photo: VehiclePhoto, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details - Sticky on desktop */}
          <div className="space-y-7 lg:sticky lg:top-4 lg:self-start">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-3 leading-tight">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {vehicle.current_status && getPublicStatusLabel(vehicle.current_status as any) && (
                      <Badge className={`${getPublicStatusBadgeStyle(vehicle.current_status as any)} font-semibold`}>
                        {getPublicStatusLabel(vehicle.current_status as any)}
                      </Badge>
                    )}
                    {vehicle.vin && (
                      <span className="text-sm text-muted-foreground">
                        VIN: {vehicle.vin}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {vehicle.sale_price && vehicle.sale_price > 0 && getDisplayPrice() ? formatCurrency(getDisplayPrice()!) : 'Contact for Price'}
                  </div>
                  {vehicle.sale_price && vehicle.sale_price > 0 && getVatAmount() > 0 && (
                    <div className="text-sm text-amber-600 font-medium">
                      Includes 5% VAT
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Important Info Badges - Simplified */}
            {(vehicle.run_and_drive || vehicle.keys_available || vehicle.title_status) && (
              <div className="flex flex-wrap items-center gap-3 pb-5 border-b">
                {vehicle.run_and_drive && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">Run & Drive</span>
                  </div>
                )}
                {vehicle.keys_available && (
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-5 w-5 text-primary" />
                    <span className="font-medium">Keys Available</span>
                  </div>
                )}
                {vehicle.title_status && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{vehicle.title_status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Arrival Countdown */}
            {vehicle.expected_arrival_date && (
              <ArrivalCountdown
                expectedDate={vehicle.expected_arrival_date}
                actualDate={vehicle.actual_arrival_date}
                variant="full"
              />
            )}

            {/* Price Breakdown Card - Simplified */}
            <div className="pt-2"></div>
            {vehicle.sale_price && vehicle.sale_price > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Primary Price Display */}
                    <div className="text-center pb-4 border-b">
                      <p className="text-sm text-muted-foreground mb-2">
                        {vehicle.sale_type === 'export_only' ? 'Export Price' : 'Price'}
                      </p>
                      <p className="text-4xl font-bold">
                        {formatCurrency(vehicle.sale_type === 'export_only' ? vehicle.sale_price : getDisplayPrice())}
                      </p>
                      {vehicle.sale_type !== 'export_only' && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Includes 5% VAT
                        </p>
                      )}
                    </div>

                    {/* Price Details - Subtle */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Base Price</span>
                        <span className="font-medium">{formatCurrency(vehicle.sale_price)}</span>
                      </div>
                      {vehicle.sale_type !== 'export_only' && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">VAT (5%)</span>
                          <span className="font-medium">{formatCurrency((vehicle.sale_price || 0) * 0.05)}</span>
                        </div>
                      )}
                      {vehicle.sale_type === 'local_and_export' && (
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          Export customers: {formatCurrency(vehicle.sale_price)} (VAT-free)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Specifications - Cleaner Layout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicle.mileage && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Mileage</span>
                      <span className="font-medium">{vehicle.mileage.toLocaleString()} miles</span>
                    </div>
                  )}
                  {(vehicle.engine || vehicle.engine_size) && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Engine</span>
                      <span className="font-medium">{vehicle.engine || vehicle.engine_size}</span>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Transmission</span>
                      <span className="font-medium">{vehicle.transmission}</span>
                    </div>
                  )}
                  {vehicle.drivetrain && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Drivetrain</span>
                      <span className="font-medium">{vehicle.drivetrain}</span>
                    </div>
                  )}
                  {vehicle.fuel_type && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Fuel Type</span>
                      <span className="font-medium">{vehicle.fuel_type}</span>
                    </div>
                  )}
                  {(vehicle.body_style || vehicle.body_type) && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Body Type</span>
                      <span className="font-medium">{vehicle.body_style || vehicle.body_type}</span>
                    </div>
                  )}
                  {(vehicle.exterior_color || vehicle.color) && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Exterior Color</span>
                      <span className="font-medium">{vehicle.exterior_color || vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.interior_color && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Interior Color</span>
                      <span className="font-medium">{vehicle.interior_color}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auction Information - Cleaner Layout */}
            {(vehicle.auction_house || vehicle.sale_date || vehicle.auction_location || vehicle.current_location || vehicle.auction_date || vehicle.location || vehicle.lot_number) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auction Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vehicle.auction_house && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Auction House</span>
                        <span className="font-medium">{vehicle.auction_house}</span>
                      </div>
                    )}
                    {(vehicle.sale_date || vehicle.auction_date) && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Auction Date</span>
                        <span className="font-medium">{formatDate((vehicle.sale_date || vehicle.auction_date) as string)}</span>
                      </div>
                    )}
                    {vehicle.auction_location && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Auction Location</span>
                        <span className="font-medium">{vehicle.auction_location}</span>
                      </div>
                    )}
                    {(vehicle.current_location || vehicle.location) && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Current Location</span>
                        <span className="font-medium">{vehicle.current_location || vehicle.location}</span>
                      </div>
                    )}
                    {vehicle.lot_number && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Lot Number</span>
                        <span className="font-medium">{vehicle.lot_number}</span>
                      </div>
                    )}
                    {(vehicle as PageVehicle).grade && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Grade</span>
                        <span className="font-medium">{(vehicle as PageVehicle).grade}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Actions */}
            <Card className="bg-muted/30">
              <CardContent className="p-7">
                <div className="space-y-5">
                  <h3 className="text-xl font-bold">Interested in this vehicle?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Contact us for more information, schedule an inspection, or get a personalized quote.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1">
                      <Link href={`/contact?vehicle=${vehicle.id}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Get Quote
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/contact?vehicle=${vehicle.id}&type=inquiry`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Inquiry
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 space-y-10">
          {/* Condition & Damage Report - Simplified */}
          {(vehicle.damage_severity || vehicle.damage_description || (vehicle as PageVehicle).condition_report || (vehicle as PageVehicle).inspection_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Condition Report</span>
                  {vehicle.damage_severity && getDamageSeverityBadge(vehicle.damage_severity) && (
                    <Badge variant="outline" className="text-sm font-medium">
                      {getDamageSeverityBadge(vehicle.damage_severity)?.label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {vehicle.damage_description && (
                  <div className="pb-5 border-b">
                    <h4 className="font-semibold mb-3">Damage Description</h4>
                    <p className="text-muted-foreground leading-relaxed">{vehicle.damage_description}</p>
                  </div>
                )}
                {(vehicle as PageVehicle).condition_report && (
                  <div className="pb-5 border-b">
                    <h4 className="font-semibold mb-3">Condition Report</h4>
                    <p className="text-muted-foreground leading-relaxed">{(vehicle as PageVehicle).condition_report}</p>
                  </div>
                )}
                {(vehicle as PageVehicle).inspection_notes && (
                  <div>
                    <h4 className="font-semibold mb-3">Inspection Notes</h4>
                    <p className="text-muted-foreground leading-relaxed">{(vehicle as PageVehicle).inspection_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {(vehicle as PageVehicle).features && ((vehicle as PageVehicle).features?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(vehicle as PageVehicle).features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Related Vehicles */}
        {relatedVehicles.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-10">You Might Also Like</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedVehicles.map((relatedVehicle) => (
                <Card key={relatedVehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/inventory/${relatedVehicle.id}`}>
                    <div className="relative h-48 bg-muted">
                      {relatedVehicle.vehicle_photos?.[0] ? (
                        <img
                          src={relatedVehicle.vehicle_photos[0].url}
                          alt={`${relatedVehicle.year} ${relatedVehicle.make} ${relatedVehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {relatedVehicle.current_status && getPublicStatusLabel(relatedVehicle.current_status as any) && (
                        <Badge className={`absolute top-3 right-3 font-semibold ${getPublicStatusBadgeStyle(relatedVehicle.current_status as any)}`}>
                          {getPublicStatusLabel(relatedVehicle.current_status as any)}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        {relatedVehicle.year} {relatedVehicle.make} {relatedVehicle.model}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {relatedVehicle.sale_price && relatedVehicle.sale_price > 0 ? formatCurrency(relatedVehicle.sale_price) : 'Contact for Price'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
