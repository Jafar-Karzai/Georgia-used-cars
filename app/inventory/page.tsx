'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Home
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'

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
  purchase_price: number
  purchase_currency: string
  current_location?: string
  sale_date?: string
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
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const itemsPerPage = 12

  useEffect(() => {
    loadVehicles()
  }, [currentPage, filters, searchQuery])

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
        setVehicles(data.data)
        setTotalPages(data.pagination?.pages || 1)
        setTotalVehicles(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
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
      month: 'short',
      day: 'numeric'
    })
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
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(itemsPerPage)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href={`/inventory/${vehicle.id}`}>
                  <div className={`relative bg-muted ${viewMode === 'grid' ? 'h-48' : 'h-32 md:h-48'}`}>
                    {vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url ? (
                      <img 
                        src={vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url || ''} 
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-600">
                      {vehicle.current_status}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {vehicle.mileage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gauge className="h-4 w-4" />
                          {vehicle.mileage.toLocaleString()} miles
                        </div>
                      )}
                      {vehicle.fuel_type && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Fuel className="h-4 w-4" />
                          {vehicle.fuel_type}
                        </div>
                      )}
                      {vehicle.current_location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {vehicle.current_location}
                        </div>
                      )}
                      {vehicle.sale_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Auction: {formatDate(vehicle.sale_date)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(vehicle.purchase_price)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
