'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { VehicleService } from '@/lib/services/vehicles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  Share2,
  Heart,
  Eye,
  ImageIcon,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  vin?: string
  price: number
  mileage?: number
  engine_size?: string
  fuel_type?: string
  transmission?: string
  body_type?: string
  color?: string
  status: string
  photos: string[]
  location?: string
  auction_date?: string
  auction_house?: string
  lot_number?: string
  grade?: string
  keys?: boolean
  title_status?: string
  damage_description?: string
  condition_report?: string
  inspection_notes?: string
  features?: string[]
  created_at: string
  updated_at: string
}

export default function VehicleDetailPage() {
  const params = useParams()
  const vehicleId = params.id as string

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedVehicles, setRelatedVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    if (vehicleId) {
      loadVehicle()
      loadRelatedVehicles()
    }
  }, [vehicleId])

  const loadVehicle = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await VehicleService.getById(vehicleId)
      if (response.success && response.data) {
        setVehicle(response.data)
      } else {
        setError('Vehicle not found')
      }
    } catch (err) {
      console.error('Failed to load vehicle:', err)
      setError('Failed to load vehicle details')
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedVehicles = async () => {
    try {
      const response = await VehicleService.getAll({ 
        page: 1, 
        limit: 4,
        filters: { status: 'available' }
      })
      
      if (response.success && response.data) {
        // Filter out current vehicle and take first 3
        const filtered = response.data.vehicles
          .filter(v => v.id !== vehicleId)
          .slice(0, 3)
        setRelatedVehicles(filtered)
      }
    } catch (error) {
      console.error('Failed to load related vehicles:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const nextImage = () => {
    if (vehicle?.photos && vehicle.photos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.photos.length - 1 ? 0 : prev + 1
      )
    }
  }

  const previousImage = () => {
    if (vehicle?.photos && vehicle.photos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.photos.length - 1 : prev - 1
      )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-emerald-500 hover:bg-emerald-600'
      case 'sold':
        return 'bg-red-500 hover:bg-red-600'
      case 'reserved':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'in_transit':
        return 'bg-blue-500 hover:bg-blue-600'
      default:
        return 'bg-muted'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation Skeleton */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </nav>
        
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
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Georgia Used Cars</span>
            </Link>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-16 text-center">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Vehicle Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The vehicle you're looking for doesn't exist or has been removed.
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Georgia Used Cars</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/inventory" className="text-foreground font-medium">Inventory</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/contact">Get Quote</Link>
            </Button>
          </div>
        </div>
      </nav>

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

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
              {vehicle.photos && vehicle.photos.length > 0 ? (
                <>
                  <img 
                    src={vehicle.photos[currentImageIndex]} 
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {vehicle.photos.length > 1 && (
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
                        {currentImageIndex + 1} / {vehicle.photos.length}
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

            {/* Thumbnail Strip */}
            {vehicle.photos && vehicle.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {vehicle.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img 
                      src={photo} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status.replace('_', ' ')}
                    </Badge>
                    {vehicle.vin && (
                      <span className="text-sm text-muted-foreground">
                        VIN: {vehicle.vin}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(vehicle.price)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {vehicle.mileage && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Mileage:</strong> {vehicle.mileage.toLocaleString()} miles
                      </span>
                    </div>
                  )}
                  {vehicle.fuel_type && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Fuel:</strong> {vehicle.fuel_type}
                      </span>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div className="flex items-center gap-2">
                      <Cog className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Transmission:</strong> {vehicle.transmission}
                      </span>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Color:</strong> {vehicle.color}
                      </span>
                    </div>
                  )}
                  {vehicle.body_type && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Body Type:</strong> {vehicle.body_type}
                      </span>
                    </div>
                  )}
                  {vehicle.engine_size && (
                    <div className="flex items-center gap-2">
                      <Cog className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Engine:</strong> {vehicle.engine_size}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auction Information */}
            {(vehicle.auction_house || vehicle.auction_date || vehicle.location) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auction Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vehicle.auction_house && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Auction House:</strong> {vehicle.auction_house}
                        </span>
                      </div>
                    )}
                    {vehicle.auction_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Auction Date:</strong> {formatDate(vehicle.auction_date)}
                        </span>
                      </div>
                    )}
                    {vehicle.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Location:</strong> {vehicle.location}
                        </span>
                      </div>
                    )}
                    {vehicle.lot_number && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Lot Number:</strong> {vehicle.lot_number}
                        </span>
                      </div>
                    )}
                    {vehicle.grade && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Grade:</strong> {vehicle.grade}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Interested in this vehicle?</h3>
                  <p className="text-muted-foreground">
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
        <div className="mt-12 space-y-8">
          {/* Condition & Damage Report */}
          {(vehicle.damage_description || vehicle.condition_report || vehicle.inspection_notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Condition Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle.damage_description && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Damage Description
                    </h4>
                    <p className="text-muted-foreground">{vehicle.damage_description}</p>
                  </div>
                )}
                {vehicle.condition_report && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      Condition Report
                    </h4>
                    <p className="text-muted-foreground">{vehicle.condition_report}</p>
                  </div>
                )}
                {vehicle.inspection_notes && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      Inspection Notes
                    </h4>
                    <p className="text-muted-foreground">{vehicle.inspection_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {vehicle.features.map((feature, index) => (
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
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedVehicles.map((relatedVehicle) => (
                <Card key={relatedVehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/inventory/${relatedVehicle.id}`}>
                    <div className="relative h-48 bg-muted">
                      {relatedVehicle.photos?.[0] ? (
                        <img 
                          src={relatedVehicle.photos[0]} 
                          alt={`${relatedVehicle.year} ${relatedVehicle.make} ${relatedVehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-600">
                        {relatedVehicle.status}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        {relatedVehicle.year} {relatedVehicle.make} {relatedVehicle.model}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(relatedVehicle.price)}
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