'use client'
// moved into (site) route group to use site layout

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Car,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Grid3X3,
  List,
  Gauge,
  Fuel,
  Cog,
  Home
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { getPublicStatusLabel, getPublicStatusBadgeStyle, type StatusGroup, getStatusesForGroup } from '@/lib/utils/vehicle-status'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import { StatusFilterTabs } from '@/components/vehicles/status-filter-tabs'
import type { VehicleStatus } from '@/types/database'

interface PublicVehicle {
  id: string
  year: number
  make: string
  model: string
  vin?: string
  mileage?: number
  fuel_type?: string
  transmission?: string
  body_style?: string
  exterior_color?: string
  current_status: string
  // purchase_price and purchase_currency removed - dealer private information
  sale_price?: number
  sale_currency?: string
  sale_type?: string
  sale_price_includes_vat?: boolean
  current_location?: string
  sale_date?: string
  expected_arrival_date?: string
  actual_arrival_date?: string
  run_and_drive?: boolean
  created_at: string
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface Filters {
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  bodyType?: string
  fuelType?: string
  transmission?: string
  status?: string
}

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Hyundai']
const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Convertible', 'Wagon']
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric']
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT']

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isUAE, setIsUAE] = useState<boolean | null>(null)
  const [statusCounts, setStatusCounts] = useState<{ all: number; arrived: number; arriving_soon: number }>({
    all: 0,
    arrived: 0,
    arriving_soon: 0
  })

  const itemsPerPage = 12

  // Get current status group from URL
  const currentStatusGroup: StatusGroup = (searchParams?.get('statusGroup') as StatusGroup) || 'all'

  // Detect if user is in UAE
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use a reliable geolocation API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }
        
        const data = await response.json()
        setIsUAE(data.country_code === 'AE')
      } catch (error) {
        console.warn('Location detection failed, defaulting to non-UAE:', error)
        // Default to non-UAE if detection fails
        setIsUAE(false)
      }
    }
    detectLocation()
  }, [])

  useEffect(() => {
    loadVehicles()
    loadVehicleCounts()
  }, [currentPage, filters, searchQuery, currentStatusGroup])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.set('is_public', 'true')
      params.set('page', currentPage.toString())
      params.set('limit', itemsPerPage.toString())

      if (searchQuery) params.set('search', searchQuery)
      if (filters.make) params.set('make', filters.make)
      if (filters.model) params.set('model', filters.model)
      if (filters.minYear) params.set('year_min', filters.minYear.toString())
      if (filters.maxYear) params.set('year_max', filters.maxYear.toString())
      if (filters.minPrice) params.set('price_min', filters.minPrice.toString())
      if (filters.maxPrice) params.set('price_max', filters.maxPrice.toString())
      if (filters.bodyType) params.set('body_style', filters.bodyType)
      if (filters.fuelType) params.set('fuel_type', filters.fuelType)
      if (filters.transmission) params.set('transmission', filters.transmission)

      const response = await fetch(`/api/vehicles?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.data) {
        // Filter vehicles by status group on client side
        let filteredVehicles = data.data
        if (currentStatusGroup !== 'all') {
          const statusesForGroup = getStatusesForGroup(currentStatusGroup)
          filteredVehicles = data.data.filter((v: PublicVehicle) =>
            statusesForGroup.includes(v.current_status as VehicleStatus)
          )
        }

        setVehicles(filteredVehicles)
        setTotalPages(data.pagination?.pages || 1)
        setTotalVehicles(filteredVehicles.length)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleCounts = async () => {
    try {
      // Fetch all public vehicles to count them by status group
      const params = new URLSearchParams()
      params.set('is_public', 'true')
      params.set('limit', '1000') // Get all vehicles for counting

      const response = await fetch(`/api/vehicles?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.data) {
        const allVehicles = data.data
        const arrivedStatuses = getStatusesForGroup('arrived')
        const arrivingSoonStatuses = getStatusesForGroup('arriving_soon')

        const counts = {
          all: allVehicles.length,
          arrived: allVehicles.filter((v: PublicVehicle) =>
            arrivedStatuses.includes(v.current_status as VehicleStatus)
          ).length,
          arriving_soon: allVehicles.filter((v: PublicVehicle) =>
            arrivingSoonStatuses.includes(v.current_status as VehicleStatus)
          ).length
        }

        setStatusCounts(counts)
      }
    } catch (error) {
      console.error('Failed to load vehicle counts:', error)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadVehicles()
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === 'string') return amount
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate display price based on vehicle's sale type and user location
  const getDisplayPrice = (vehicle: PublicVehicle): number | string => {
    // Only show price if sale_price exists and is greater than 0
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return 'Contact for Price'

    const basePrice = vehicle.sale_price
    const saleType = vehicle.sale_type || 'local_and_export'
    const includesVat = vehicle.sale_price_includes_vat ?? false

    // For export-only vehicles, no VAT applies
    if (saleType === 'export_only') {
      return basePrice
    }

    // For local-only vehicles, always show with VAT
    if (saleType === 'local_only') {
      return includesVat ? basePrice : basePrice * 1.05
    }

    // For local_and_export (both markets), show appropriate price based on location
    if (isUAE) {
      // UAE customers see price with VAT
      return includesVat ? basePrice : basePrice * 1.05
    } else {
      // Export customers see price without VAT
      return basePrice
    }
  }

  // Get VAT note for display
  const getVatNote = (vehicle: PublicVehicle) => {
    // Only show VAT note if sale_price exists and is greater than 0
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return null

    const saleType = vehicle.sale_type || 'local_and_export'

    if (saleType === 'export_only') {
      return 'VAT free'
    }

    if (saleType === 'local_only') {
      return 'Includes 5% VAT'
    }

    // For local_and_export
    if (isUAE) {
      return 'Includes 5% VAT (UAE)'
    } else {
      return 'VAT free (Export)'
    }
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
            <span className="text-foreground font-medium">Vehicle Inventory</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vehicle Inventory</h1>
          <p className="text-muted-foreground">
            Browse our collection of premium salvage vehicles imported from US and Canada auctions
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <StatusFilterTabs
            counts={statusCounts}
            currentGroup={currentStatusGroup}
          />
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by make, model, year, or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {Object.values(filters).some(v => v !== undefined) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                        {Object.values(filters).filter(v => v !== undefined).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filter Vehicles</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Make */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Make</label>
                      <Select value={filters.make || ''} onValueChange={(value) => handleFilterChange('make', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Make" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Make</SelectItem>
                          {MAKES.map(make => (
                            <SelectItem key={make} value={make}>{make}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Year Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min Year"
                          value={filters.minYear || ''}
                          onChange={(e) => handleFilterChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <Input
                          type="number"
                          placeholder="Max Year"
                          value={filters.maxYear || ''}
                          onChange={(e) => handleFilterChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price Range (AED)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min Price"
                          value={filters.minPrice || ''}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <Input
                          type="number"
                          placeholder="Max Price"
                          value={filters.maxPrice || ''}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>

                    {/* Body Style */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Body Style</label>
                      <Select value={filters.bodyType || ''} onValueChange={(value) => handleFilterChange('bodyType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Style</SelectItem>
                          {BODY_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fuel Type</label>
                      <Select value={filters.fuelType || ''} onValueChange={(value) => handleFilterChange('fuelType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Fuel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Fuel</SelectItem>
                          {FUEL_TYPES.map(fuel => (
                            <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Transmission</label>
                      <Select value={filters.transmission || ''} onValueChange={(value) => handleFilterChange('transmission', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Transmission</SelectItem>
                          {TRANSMISSIONS.map(trans => (
                            <SelectItem key={trans} value={trans}>{trans}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4">
                      <Button onClick={clearFilters} variant="outline" className="w-full">
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={!Object.values(filters).some(v => v !== undefined) && !searchQuery}
              >
                Clear All
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalVehicles} vehicle{totalVehicles !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Grid/List */}
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(itemsPerPage)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-60 w-full" />
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-20 w-full mb-3" />
                  <Skeleton className="h-10 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-border/50 flex flex-col">
                <Link href={`/inventory/${vehicle.id}`} className="flex flex-col h-full">
                  {/* Fixed Height Image Container */}
                  <div className="relative bg-muted h-60 flex-shrink-0">
                    {vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url ? (
                      <img
                        src={vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url || ''}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Car className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 left-3 flex flex-wrap gap-2 justify-end">
                      {getPublicStatusLabel(vehicle.current_status as VehicleStatus) && (
                        <Badge className={`border font-semibold shadow-sm ${getPublicStatusBadgeStyle(vehicle.current_status as VehicleStatus)}`}>
                          {getPublicStatusLabel(vehicle.current_status as VehicleStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Content with proper spacing */}
                  <CardContent className="p-5 flex flex-col flex-grow">
                    {/* Vehicle Title */}
                    <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>

                    {/* Badges Section - Arrival & Run & Drive */}
                    {(vehicle.expected_arrival_date || vehicle.run_and_drive) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {vehicle.expected_arrival_date && (
                          <ArrivalCountdown
                            expectedDate={vehicle.expected_arrival_date}
                            actualDate={vehicle.actual_arrival_date}
                            variant="badge"
                          />
                        )}
                        {vehicle.run_and_drive && (
                          <Badge className="bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-colors text-xs font-semibold">
                            Run & Drive
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Specs Section */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 mb-3 border-y border-border/40">
                      {vehicle.mileage && (
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {vehicle.mileage.toLocaleString()} mi
                          </span>
                        </div>
                      )}
                      {vehicle.transmission && (
                        <div className="flex items-center gap-1.5">
                          <Cog className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {vehicle.transmission}
                          </span>
                        </div>
                      )}
                      {vehicle.fuel_type && (
                        <div className="flex items-center gap-1.5">
                          <Fuel className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {vehicle.fuel_type}
                          </span>
                        </div>
                      )}
                      {vehicle.body_style && (
                        <div className="flex items-center gap-1.5">
                          <Car className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {vehicle.body_style}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price Section */}
                    <div className="flex items-end justify-between pt-3 mt-auto border-t border-border/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {vehicle.sale_price && vehicle.sale_price > 0 ? 'Sale Price' : 'Price'}
                        </p>
                        <p className="text-2xl font-bold text-primary truncate">
                          {formatCurrency(getDisplayPrice(vehicle))}
                        </p>
                        {getVatNote(vehicle) && (
                          <p className="text-xs text-amber-600 font-medium mt-1">
                            {getVatNote(vehicle)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
