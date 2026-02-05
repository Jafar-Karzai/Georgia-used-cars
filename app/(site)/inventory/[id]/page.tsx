'use client'
// moved into (site) route group to use site layout

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { fetchVehicleById, fetchVehicles } from '@/lib/api/vehicles-client'
import { Vehicle, VehiclePhoto } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { getPublicStatusLabel, getPublicStatusBadgeStyle } from '@/lib/utils/vehicle-status'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import { ReservationModal } from '@/components/reservations/ReservationModal'
import {
  Car,
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageCircle,
  ImageIcon,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings,
  Gavel,
  ClipboardCheck,
  ListChecks,
  Check,
  ArrowRight,
  CalendarCheck
} from 'lucide-react'

// Local interface for page-specific needs, extending the database Vehicle type
interface PageVehicle extends Omit<Vehicle, 'keys_available'> {
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
  keys_available?: boolean // Made optional for page-specific handling
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
  const searchParams = useSearchParams()
  const vehicleId = params.id as string

  const [vehicle, setVehicle] = useState<PageVehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedVehicles, setRelatedVehicles] = useState<PageVehicle[]>([])
  const [reservationModalOpen, setReservationModalOpen] = useState(false)
  // Check localStorage for mock authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mockAuth = localStorage.getItem('mockAuth')
      setIsAuthenticated(mockAuth === 'true')
    }
  }, [])

  // Auto-open reservation modal if ?reserve=true is in URL
  useEffect(() => {
    if (searchParams.get('reserve') === 'true' && vehicle && !loading) {
      setReservationModalOpen(true)
    }
  }, [searchParams, vehicle, loading])

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
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Loading State with Frosted Design
  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-pattern">
        <SiteNavbar />

        {/* Breadcrumb Skeleton */}
        <div className="frosted-panel border-b">
          <div className="max-w-content mx-auto px-4 md:px-6 py-4">
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <main className="max-w-content mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gallery Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-[450px] w-full rounded-2xl" />
              <div className="flex gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-24 h-20 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error State
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background bg-pattern">
        <SiteNavbar />

        <div className="max-w-content mx-auto px-4 md:px-6 py-16 text-center">
          <div className="alumina-surface rounded-2xl p-12 max-w-md mx-auto">
            <Car className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Vehicle Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The vehicle you are looking for does not exist or has been removed.
            </p>
            <Button asChild className="btn-precision">
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Link>
            </Button>
          </div>
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

  // Get status badge info for the gallery
  const getStatusBadgeInfo = () => {
    const status = vehicle.current_status
    if (!status) return null

    // Check if vehicle is in yard (arrived statuses)
    const arrivedStatuses = ['at_yard', 'under_enhancement', 'ready_for_sale']
    const inTransitStatuses = ['auction_won', 'payment_processing', 'pickup_scheduled', 'in_transit_to_port', 'at_port', 'shipped', 'in_transit', 'at_uae_port', 'customs_clearance', 'released_from_customs', 'in_transit_to_yard']

    if (arrivedStatuses.includes(status)) {
      return { label: 'In Yard', className: 'bg-emerald-500 text-white' }
    }
    if (inTransitStatuses.includes(status)) {
      return { label: 'In Transit', className: 'bg-precision-600 text-white' }
    }
    if (status === 'reserved') {
      return { label: 'Reserved', className: 'bg-amber-500 text-white' }
    }
    return null
  }

  // Mask VIN for non-authenticated users (show last 6 digits only)
  const displayVin = vehicle.vin
    ? isAuthenticated
      ? vehicle.vin
      : `${'*'.repeat(11)}${vehicle.vin.slice(-6)}`
    : null

  const statusBadge = getStatusBadgeInfo()
  const totalPhotos = vehicle.vehicle_photos?.length || 0
  const visibleThumbnails = 5
  const extraPhotos = totalPhotos > visibleThumbnails ? totalPhotos - visibleThumbnails : 0

  return (
    <div className="min-h-screen bg-background bg-pattern">
      <SiteNavbar />

      {/* Breadcrumb - Frosted Panel */}
      <div className="frosted-panel border-b">
        <div className="max-w-content mx-auto px-4 md:px-6 py-4 flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/inventory" className="hover:text-primary transition-colors">
            Inventory
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
        </div>
      </div>

      <main className="max-w-content mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Gallery Section - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-4 animate-reveal">
            {/* Main Image */}
            <div className="alumina-surface rounded-2xl overflow-hidden relative">
              {vehicle.vehicle_photos && vehicle.vehicle_photos.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicle.vehicle_photos[currentImageIndex].url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                    className="w-full h-[450px] object-cover"
                  />

                  {/* Status Badges - Top Left */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {statusBadge && (
                      <span className={`status-tag ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    )}
                    {vehicle.run_and_drive && (
                      <span className="frosted-panel px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Run & Drive
                      </span>
                    )}
                  </div>

                  {/* Damage Badge - Top Right */}
                  {vehicle.damage_description && (
                    <div className="absolute top-4 right-4">
                      <span className="frosted-panel px-4 py-2 rounded-xl text-xs font-bold text-foreground/70 uppercase">
                        {vehicle.damage_description}
                      </span>
                    </div>
                  )}

                  {/* Image Counter - Bottom Right */}
                  {totalPhotos > 1 && (
                    <div className="absolute bottom-4 right-4 frosted-panel px-4 py-2 rounded-xl text-xs font-bold font-mono">
                      {currentImageIndex + 1} / {totalPhotos}
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {totalPhotos > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 frosted-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 frosted-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-[450px] flex items-center justify-center bg-muted">
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnails Strip */}
            {vehicle.vehicle_photos && vehicle.vehicle_photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {vehicle.vehicle_photos.slice(0, visibleThumbnails).map((photo: VehiclePhoto, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`thumbnail w-24 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${
                      index === currentImageIndex
                        ? 'active border-primary'
                        : 'border-transparent'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {extraPhotos > 0 && vehicle.vehicle_photos[visibleThumbnails] && (
                  <button
                    onClick={() => setCurrentImageIndex(visibleThumbnails)}
                    className="thumbnail w-24 h-20 rounded-xl overflow-hidden border-2 border-transparent flex-shrink-0 relative"
                    aria-label={`View ${extraPhotos} more images`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vehicle.vehicle_photos[visibleThumbnails].url}
                      alt={`Thumbnail ${visibleThumbnails + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                      +{extraPhotos}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info Sidebar - 1/3 width on desktop */}
          <div className="lg:col-span-1 space-y-6 animate-reveal" style={{ animationDelay: '0.2s' }}>

            {/* Title Card */}
            <div className="alumina-surface rounded-2xl p-6 relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-2 h-12 bg-action-600 rounded-full flex-shrink-0"></span>
                <div>
                  <h1 className="text-2xl font-black leading-tight">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {vehicle.lot_number && <>LOT: #{vehicle.lot_number} &bull; </>}
                    {displayVin && <>VIN: {displayVin}</>}
                  </p>
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2">
                {vehicle.auction_house && (
                  <span className="px-3 py-1 bg-precision-100 text-precision-900 text-2xs font-bold uppercase rounded-full">
                    {vehicle.auction_house}{vehicle.auction_location && ` - ${vehicle.auction_location}`}
                  </span>
                )}
                {vehicle.title_status && (
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-2xs font-bold uppercase rounded-full">
                    {vehicle.title_status}
                  </span>
                )}
                {vehicle.run_and_drive && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-2xs font-bold uppercase rounded-full">
                    Run & Drive
                  </span>
                )}
              </div>
            </div>

            {/* Arrival Countdown */}
            {vehicle.expected_arrival_date && (
              <ArrivalCountdown
                expectedDate={vehicle.expected_arrival_date}
                actualDate={vehicle.actual_arrival_date}
                variant="full"
              />
            )}

            {/* Price Card */}
            {vehicle.sale_price && vehicle.sale_price > 0 && (
              <div className="alumina-surface rounded-2xl overflow-hidden relative z-10">
                <div className="p-5 border-b border-border flex items-center gap-2">
                  <span className="w-2 h-2 bg-action-600 rounded-full"></span>
                  <h3 className="font-bold text-sm uppercase tracking-wider">Price Breakdown</h3>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Total Price</p>
                      <p className="text-4xl font-black text-primary font-mono">
                        {formatCurrency(vehicle.sale_type === 'export_only' ? vehicle.sale_price : getDisplayPrice())}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-muted-foreground">AED</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between spec-line pb-3">
                      <span className="text-muted-foreground">Vehicle Price</span>
                      <span className="font-bold font-mono">{formatCurrency(vehicle.sale_price)} AED</span>
                    </div>
                    {vehicle.sale_type !== 'export_only' && (
                      <div className="flex justify-between spec-line pb-3">
                        <span className="text-muted-foreground">VAT (5%)</span>
                        <span className="font-bold font-mono">{formatCurrency(getVatAmount())} AED</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="font-bold">Total</span>
                      <span className="font-black text-primary font-mono">
                        {formatCurrency(vehicle.sale_type === 'export_only' ? vehicle.sale_price : getDisplayPrice())} AED
                      </span>
                    </div>
                    {vehicle.sale_type === 'local_and_export' && (
                      <p className="pt-3 border-t text-xs text-muted-foreground">
                        Export customers: {formatCurrency(vehicle.sale_price)} AED (VAT-free)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Card */}
            <div className="alumina-surface rounded-2xl p-6 space-y-4 relative z-10">
              {/* Reserve Button - Only show if vehicle is public and has a price */}
              {vehicle.sale_price && vehicle.sale_price > 0 && vehicle.is_public && (
                <button
                  onClick={() => setReservationModalOpen(true)}
                  className="w-full bg-action-600 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-action-700 transition-all btn-precision flex items-center justify-center gap-3"
                >
                  <CalendarCheck className="w-5 h-5" />
                  Reserve This Vehicle
                </button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full border-2 border-border text-foreground py-6 rounded-xl font-bold text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
              >
                <Link href={`/contact?vehicle=${vehicle.id}`}>
                  <Phone className="w-5 h-5 mr-3" />
                  Contact Sales
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full border-2 border-emerald-200 text-emerald-700 py-6 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-50 transition-all"
              >
                <a
                  href={`https://wa.me/971655512344?text=Hi, I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  WhatsApp Inquiry
                </a>
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Or call directly: <a href="tel:+971655512344" className="text-primary font-bold">+971 6 555 1234</a>
              </p>
            </div>
          </div>
        </div>

        {/* Details Section - 2 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

          {/* Specifications Card */}
          <div className="alumina-surface rounded-2xl overflow-hidden animate-reveal" style={{ animationDelay: '0.3s' }}>
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Specifications</h3>
            </div>
            <div className="grid grid-cols-2 relative z-10">
              {vehicle.mileage && (
                <>
                  <div className="p-4 border-b border-r border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Mileage</p>
                    <p className="font-bold">{vehicle.mileage.toLocaleString()} Mi</p>
                  </div>
                </>
              )}
              {vehicle.transmission && (
                <div className={`p-4 border-b border-border/50 ${!vehicle.mileage ? 'border-r' : ''}`}>
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Transmission</p>
                  <p className="font-bold">{vehicle.transmission}</p>
                </div>
              )}
              {(vehicle.engine || vehicle.engine_size) && (
                <div className="p-4 border-b border-r border-border/50">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Engine</p>
                  <p className="font-bold">{vehicle.engine || vehicle.engine_size}</p>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="p-4 border-b border-border/50">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Fuel Type</p>
                  <p className="font-bold">{vehicle.fuel_type}</p>
                </div>
              )}
              {vehicle.drivetrain && (
                <div className="p-4 border-b border-r border-border/50">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Drive Type</p>
                  <p className="font-bold">{vehicle.drivetrain}</p>
                </div>
              )}
              {(vehicle.body_style || vehicle.body_type) && (
                <div className="p-4 border-b border-border/50">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Body Style</p>
                  <p className="font-bold">{vehicle.body_style || vehicle.body_type}</p>
                </div>
              )}
              {(vehicle.exterior_color || vehicle.color) && (
                <div className="p-4 border-r border-border/50">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Exterior Color</p>
                  <p className="font-bold">{vehicle.exterior_color || vehicle.color}</p>
                </div>
              )}
              {vehicle.interior_color && (
                <div className="p-4">
                  <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Interior Color</p>
                  <p className="font-bold">{vehicle.interior_color}</p>
                </div>
              )}
            </div>
          </div>

          {/* Auction Information Card */}
          {(vehicle.auction_house || vehicle.sale_date || vehicle.auction_location || vehicle.current_location || vehicle.auction_date || vehicle.location || vehicle.lot_number || vehicle.title_status || vehicle.damage_description || vehicle.keys_available !== undefined) && (
            <div className="alumina-surface rounded-2xl overflow-hidden animate-reveal" style={{ animationDelay: '0.4s' }}>
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Auction Information</h3>
              </div>
              <div className="grid grid-cols-2 relative z-10">
                {vehicle.auction_house && (
                  <div className="p-4 border-b border-r border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Auction House</p>
                    <p className="font-bold">{vehicle.auction_house}</p>
                  </div>
                )}
                {(vehicle.auction_location || vehicle.current_location || vehicle.location) && (
                  <div className="p-4 border-b border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Location</p>
                    <p className="font-bold">{vehicle.auction_location || vehicle.current_location || vehicle.location}</p>
                  </div>
                )}
                {vehicle.lot_number && (
                  <div className="p-4 border-b border-r border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Lot Number</p>
                    <p className="font-bold font-mono">#{vehicle.lot_number}</p>
                  </div>
                )}
                {(vehicle.sale_date || vehicle.auction_date) && (
                  <div className="p-4 border-b border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Sale Date</p>
                    <p className="font-bold">{formatDate((vehicle.sale_date || vehicle.auction_date) as string)}</p>
                  </div>
                )}
                {vehicle.title_status && (
                  <div className="p-4 border-b border-r border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Title Type</p>
                    <p className="font-bold">{vehicle.title_status}</p>
                  </div>
                )}
                {vehicle.damage_description && (
                  <div className="p-4 border-b border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Primary Damage</p>
                    <p className="font-bold text-action-600">{vehicle.damage_description}</p>
                  </div>
                )}
                {(vehicle as PageVehicle).grade && (
                  <div className="p-4 border-r border-border/50">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Grade</p>
                    <p className="font-bold">{(vehicle as PageVehicle).grade}</p>
                  </div>
                )}
                {vehicle.keys_available !== undefined && (
                  <div className="p-4">
                    <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Keys</p>
                    <p className={`font-bold ${vehicle.keys_available ? 'text-emerald-600' : 'text-action-600'}`}>
                      {vehicle.keys_available ? 'Present' : 'Not Available'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condition Report Card */}
          {(vehicle.damage_severity || vehicle.damage_description || (vehicle as PageVehicle).condition_report || (vehicle as PageVehicle).inspection_notes || vehicle.run_and_drive !== undefined || vehicle.keys_available !== undefined) && (
            <div className="alumina-surface rounded-2xl overflow-hidden animate-reveal" style={{ animationDelay: '0.5s' }}>
              <div className="p-5 border-b border-border flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Condition Report</h3>
              </div>
              <div className="p-5 space-y-2 relative z-10">
                {/* Engine/Run Status */}
                {vehicle.run_and_drive !== undefined && (
                  <div className="condition-item flex justify-between items-center p-3 rounded-xl">
                    <span className="text-sm font-medium">Engine Status</span>
                    <span className={`text-sm font-bold flex items-center gap-2 ${vehicle.run_and_drive ? 'text-emerald-600' : 'text-action-600'}`}>
                      {vehicle.run_and_drive ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Runs & Drives
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Not Running
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Keys */}
                {vehicle.keys_available !== undefined && (
                  <div className="condition-item flex justify-between items-center p-3 rounded-xl">
                    <span className="text-sm font-medium">Keys</span>
                    <span className={`text-sm font-bold flex items-center gap-2 ${vehicle.keys_available ? 'text-emerald-600' : 'text-action-600'}`}>
                      {vehicle.keys_available ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Not Available
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Damage Severity */}
                {vehicle.damage_severity && (
                  <div className="condition-item flex justify-between items-center p-3 rounded-xl">
                    <span className="text-sm font-medium">Damage Level</span>
                    <span className={`text-sm font-bold flex items-center gap-2 ${
                      vehicle.damage_severity === 'minor' ? 'text-emerald-600' :
                      vehicle.damage_severity === 'moderate' ? 'text-amber-600' :
                      'text-action-600'
                    }`}>
                      {vehicle.damage_severity === 'minor' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Minor
                        </>
                      ) : vehicle.damage_severity === 'moderate' ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Moderate
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          {vehicle.damage_severity === 'total_loss' ? 'Total Loss' : 'Major'}
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Damage Description */}
                {vehicle.damage_description && (
                  <div className="condition-item flex justify-between items-center p-3 rounded-xl">
                    <span className="text-sm font-medium">Primary Damage</span>
                    <span className="text-sm font-bold text-action-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {vehicle.damage_description}
                    </span>
                  </div>
                )}

                {/* Condition Report Notes */}
                {(vehicle as PageVehicle).condition_report && (
                  <div className="pt-4 mt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Condition Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{(vehicle as PageVehicle).condition_report}</p>
                  </div>
                )}

                {/* Inspection Notes */}
                {(vehicle as PageVehicle).inspection_notes && (
                  <div className="pt-4 mt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Inspection Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{(vehicle as PageVehicle).inspection_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features & Equipment Card */}
          {(vehicle as PageVehicle).features && ((vehicle as PageVehicle).features?.length ?? 0) > 0 && (
            <div className="alumina-surface rounded-2xl overflow-hidden animate-reveal" style={{ animationDelay: '0.6s' }}>
              <div className="p-5 border-b border-border flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Features & Equipment</h3>
              </div>
              <div className="p-5 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  {(vehicle as PageVehicle).features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Vehicles Section */}
        {relatedVehicles.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-2xs uppercase font-bold text-action-600 tracking-widest mb-2">You May Also Like</p>
                <h2 className="text-2xl font-extrabold tracking-tight">Similar Vehicles</h2>
              </div>
              <Link
                href="/inventory"
                className="text-sm font-bold text-primary hover:text-action-600 transition-colors uppercase tracking-wider flex items-center gap-2"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedVehicles.map((relatedVehicle) => (
                <Link
                  key={relatedVehicle.id}
                  href={`/inventory/${relatedVehicle.id}`}
                  className="alumina-surface rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-card-hover transition-all card-hover group"
                >
                  <div className="h-52 overflow-hidden relative">
                    {relatedVehicle.vehicle_photos?.[0] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={relatedVehicle.vehicle_photos[0].url}
                          alt={`${relatedVehicle.year} ${relatedVehicle.make} ${relatedVehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Car className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {relatedVehicle.current_status && getPublicStatusLabel(relatedVehicle.current_status as any) && (
                      <Badge className={`absolute top-3 right-3 font-semibold text-2xs ${getPublicStatusBadgeStyle(relatedVehicle.current_status as any)}`}>
                        {getPublicStatusLabel(relatedVehicle.current_status as any)}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 relative z-10">
                    <h3 className="font-bold text-sm mb-1">
                      {relatedVehicle.year} {relatedVehicle.make} {relatedVehicle.model}
                    </h3>
                    <p className="text-lg font-black text-primary font-mono">
                      {relatedVehicle.sale_price && relatedVehicle.sale_price > 0 ? (
                        <>
                          {formatCurrency(relatedVehicle.sale_price)} <span className="text-xs font-normal text-muted-foreground">AED</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">Contact for Price</span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      <ReservationModal
        open={reservationModalOpen}
        onOpenChange={setReservationModalOpen}
        vehicle={{
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim || undefined,
          salePrice: vehicle.sale_price || 0,
          saleCurrency: vehicle.sale_currency || 'AED',
          vehiclePhotos: vehicle.vehicle_photos,
        }}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}
