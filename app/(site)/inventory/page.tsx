'use client'
// moved into (site) route group to use site layout

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Car,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Grid3X3,
  List,
  Home,
  X
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { type StatusGroup, getStatusesForGroup } from '@/lib/utils/vehicle-status'
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
  primary_damage?: string
  lot_number?: string
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
  runAndDrive?: boolean
  engineStarts?: boolean
}

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Hyundai', 'Porsche', 'Tesla']
const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Convertible', 'Wagon']
const DAMAGE_TYPES = ['Front End', 'Rear End', 'Side Impact', 'Water / Flood', 'Hail Damage', 'Mechanical', 'Vandalism']

function InventoryContent() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [isUAE, setIsUAE] = useState<boolean | null>(null)
  const [currency, setCurrency] = useState<'AED' | 'USD'>('AED')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [statusCounts, setStatusCounts] = useState<{ all: number; arrived: number; arriving_soon: number }>({
    all: 0,
    arrived: 0,
    arriving_soon: 0
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const itemsPerPage = 12

  // Get current status group from URL
  const currentStatusGroup: StatusGroup = (searchParams?.get('statusGroup') as StatusGroup) || 'all'

  // Check authentication status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mockAuth = localStorage.getItem('mockAuth')
      setIsAuthenticated(mockAuth === 'true')
    }
  }, [])

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

  const loadVehicles = useCallback(async () => {
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
  }, [currentPage, searchQuery, filters, currentStatusGroup])

  const loadVehicleCounts = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadVehicles()
    loadVehicleCounts()
  }, [loadVehicles, loadVehicleCounts])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadVehicles()
  }

  const handleFilterChange = (key: keyof Filters, value: string | number | boolean | undefined) => {
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

  const formatPrice = (amount: number | string, curr: 'AED' | 'USD' = currency): { currency: string; amount: string; isContactPrice: boolean } => {
    if (typeof amount === 'string') {
      return { currency: '', amount: amount, isContactPrice: true }
    }
    // Convert to USD if needed (approximate rate)
    const displayAmount = curr === 'USD' ? Math.round(amount / 3.67) : amount
    const formatted = new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(displayAmount)
    return { currency: curr, amount: formatted, isContactPrice: false }
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

  // Handle status group change via URL
  const handleStatusGroupChange = (group: StatusGroup) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (group === 'all') {
      params.delete('statusGroup')
    } else {
      params.set('statusGroup', group)
    }
    params.delete('page')
    const queryString = params.toString()
    window.history.pushState({}, '', queryString ? `/inventory?${queryString}` : '/inventory')
    setCurrentPage(1)
    // Trigger re-render by updating a dependency
    loadVehicles()
    loadVehicleCounts()
  }

  // Get status display info for vehicles
  const getStatusInfo = (vehicle: PublicVehicle) => {
    const arrivedStatuses = getStatusesForGroup('arrived')
    const isArrived = arrivedStatuses.includes(vehicle.current_status as VehicleStatus)

    return {
      isArrived,
      label: isArrived ? 'In Yard' : 'In Transit',
      bgClass: isArrived ? 'bg-success' : 'bg-precision-500',
    }
  }

  // Get run status info
  const getRunStatus = (vehicle: PublicVehicle) => {
    if (vehicle.run_and_drive === true) {
      return { label: 'Run & Drive', colorClass: 'text-success', dotClass: 'bg-success' }
    }
    if (vehicle.run_and_drive === false) {
      return { label: 'Does Not Start', colorClass: 'text-action-600', dotClass: 'bg-action-600' }
    }
    return null
  }

  // Calculate ETA status
  const getEtaStatus = (expectedDate: string | undefined) => {
    if (!expectedDate) return { type: 'pending' as const, days: null }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expected = new Date(expectedDate)
    expected.setHours(0, 0, 0, 0)
    const days = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { type: 'overdue' as const, days }
    if (days === 0) return { type: 'today' as const, days: 0 }
    return { type: 'future' as const, days }
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length

  // Filter Sidebar Component
  const FiltersSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`frosted-panel rounded-2xl ${isMobile ? '' : 'sticky top-28'}`}>
      <div className="p-5 border-b border-border flex justify-between items-center">
        <h3 className="font-extrabold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-2xs font-bold text-action-600 hover:text-action-700 uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Make */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">Make / Brand</label>
          <Select value={filters.make || ''} onValueChange={(value) => handleFilterChange('make', value)}>
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {MAKES.map(make => (
                <SelectItem key={make} value={make}>{make}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">Year Range</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="From"
              value={filters.minYear || ''}
              onChange={(e) => handleFilterChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
            <Input
              type="number"
              placeholder="To"
              value={filters.maxYear || ''}
              onChange={(e) => handleFilterChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">Price Range ({currency})</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
          </div>
        </div>

        {/* Body Type */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">Body Type</label>
          <Select value={filters.bodyType || ''} onValueChange={(value) => handleFilterChange('bodyType', value)}>
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {BODY_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engine Status */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-3">Engine Status</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.runAndDrive === true}
                onChange={(e) => handleFilterChange('runAndDrive', e.target.checked ? true : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                Run & Drive
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.engineStarts === true}
                onChange={(e) => handleFilterChange('engineStarts', e.target.checked ? true : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-warning rounded-full"></span>
                Starts
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.runAndDrive === false}
                onChange={(e) => handleFilterChange('runAndDrive', e.target.checked ? false : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-action-600 rounded-full"></span>
                Does Not Start
              </span>
            </label>
          </div>
        </div>

        {/* Damage Type */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">Damage Type</label>
          <Select value={filters.fuelType || ''} onValueChange={(value) => handleFilterChange('fuelType', value)}>
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Damage Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Damage Types</SelectItem>
              {DAMAGE_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => { loadVehicles(); if (isMobile) setMobileFiltersOpen(false); }}
          className="w-full bg-precision-900 hover:bg-precision-800 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest btn-precision"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background bg-pattern">
      <SiteNavbar />

      {/* Page Header */}
      <header className="frosted-panel border-b">
        <div className="max-w-content mx-auto px-4 md:px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-2xs mono text-muted-foreground mb-3">
            <Link href="/" className="hover:text-precision-900 transition-colors">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <span>/</span>
            <span className="text-foreground">Inventory</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Vehicle Inventory</h1>
              <p className="text-muted-foreground">Browse our curated selection of salvage vehicles from USA & Canada</p>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-full border border-border">
              <span className={`text-2xs font-bold ml-3 ${currency === 'AED' ? 'text-foreground' : 'text-muted-foreground'}`}>AED</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={currency === 'USD'}
                  onChange={(e) => setCurrency(e.target.checked ? 'USD' : 'AED')}
                />
                <div className="w-12 h-5 bg-muted-foreground/30 rounded-full peer-checked:bg-precision-500 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 peer-checked:translate-x-7"></div>
              </label>
              <span className={`text-2xs font-bold mr-3 ${currency === 'USD' ? 'text-foreground' : 'text-muted-foreground'}`}>USD</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-content mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <FiltersSidebar />
          </aside>

          {/* Mobile Filters Overlay */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-background overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-bold">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FiltersSidebar isMobile />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              {/* Status Tabs */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleStatusGroupChange('all')}
                  className={`filter-chip px-5 py-2 rounded-full border border-border text-2xs font-bold uppercase tracking-wider transition-all ${currentStatusGroup === 'all' ? 'active bg-precision-900 text-white border-precision-900' : 'text-muted-foreground hover:border-precision-900 hover:text-precision-900'}`}
                >
                  All Vehicles
                  <span className="ml-1.5 opacity-70">({statusCounts.all})</span>
                </button>
                <button
                  onClick={() => handleStatusGroupChange('arrived')}
                  className={`filter-chip px-5 py-2 rounded-full border border-border text-2xs font-bold uppercase tracking-wider transition-all ${currentStatusGroup === 'arrived' ? 'active bg-precision-900 text-white border-precision-900' : 'text-muted-foreground hover:border-precision-900 hover:text-precision-900'}`}
                >
                  In Stock
                  <span className="ml-1.5 opacity-70">({statusCounts.arrived})</span>
                </button>
                <button
                  onClick={() => handleStatusGroupChange('arriving_soon')}
                  className={`filter-chip px-5 py-2 rounded-full border border-border text-2xs font-bold uppercase tracking-wider transition-all ${currentStatusGroup === 'arriving_soon' ? 'active bg-precision-900 text-white border-precision-900' : 'text-muted-foreground hover:border-precision-900 hover:text-precision-900'}`}
                >
                  Arriving Soon
                  <span className="ml-1.5 opacity-70">({statusCounts.arriving_soon})</span>
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobile Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-precision-900 text-white text-2xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-card border-border rounded-xl pl-10 pr-4 py-2 text-sm font-medium w-56"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </form>

                {/* View Toggle */}
                <div className="flex border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-precision-900 text-white' : 'bg-card text-muted-foreground hover:text-foreground'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-precision-900 text-white' : 'bg-card text-muted-foreground hover:text-foreground'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-card border-border rounded-xl px-4 py-2 text-sm font-medium w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="mileage_low">Mileage: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-2xs mono text-muted-foreground mb-6 uppercase">
              Showing <span className="text-foreground font-bold">1-{Math.min(itemsPerPage, totalVehicles)}</span> of <span className="text-foreground font-bold">{totalVehicles}</span> vehicles
            </p>

            {/* Vehicle Grid */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {vehicles.map((vehicle, index) => {
                  const priceFormatted = formatPrice(getDisplayPrice(vehicle))
                  const hasPrice = !priceFormatted.isContactPrice
                  const statusInfo = getStatusInfo(vehicle)
                  const runStatus = getRunStatus(vehicle)
                  const etaStatus = getEtaStatus(vehicle.expected_arrival_date)

                  // Mask VIN for non-authenticated users (show last 6 digits only)
                  const displayVin = vehicle.vin
                    ? isAuthenticated
                      ? vehicle.vin
                      : `${'*'.repeat(11)}${vehicle.vin.slice(-6)}`
                    : null

                  return (
                    <Link
                      key={vehicle.id}
                      href={`/inventory/${vehicle.id}`}
                      className={`alumina-surface rounded-2xl border border-border overflow-hidden card-hover animate-reveal block`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Image Container */}
                      <div className="relative h-48 overflow-hidden">
                        {vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url ? (
                          <Image
                            src={vehicle.vehicle_photos?.find(p => p.is_primary)?.url || vehicle.vehicle_photos?.[0]?.url || ''}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Car className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* Status Tag (top left, angled) */}
                        <div className={`absolute top-3 left-3 ${statusInfo.bgClass} text-white status-tag`}>
                          {statusInfo.label}
                        </div>

                        {/* Run Status Badge (top right, frosted) */}
                        {runStatus && (
                          <div className="absolute top-3 right-3 frosted-panel px-2 py-1 rounded-lg text-3xs font-bold uppercase flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 ${runStatus.dotClass} rounded-full`}></span>
                            <span className={runStatus.colorClass}>{runStatus.label}</span>
                          </div>
                        )}

                        {/* ETA Badge - Bottom Left (In-Transit Only) */}
                        {!statusInfo.isArrived && (
                          <div className="absolute bottom-3 left-3 frosted-panel px-2 py-1 rounded-lg text-3xs font-bold uppercase mono">
                            {etaStatus.type === 'pending' ? (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                                ETA Pending
                              </span>
                            ) : etaStatus.type === 'overdue' ? (
                              <span className="text-warning flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                                Delayed
                              </span>
                            ) : etaStatus.type === 'today' ? (
                              <span className="text-precision-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-precision-500 rounded-full animate-pulse"></span>
                                Arriving Today
                              </span>
                            ) : (
                              <span className="text-precision-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-precision-500 rounded-full animate-pulse"></span>
                                ETA: {etaStatus.days} Day{etaStatus.days !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-5 relative z-10">
                        <h3 className="text-base font-extrabold leading-tight mb-1">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        {/* VIN & LOT# */}
                        {(displayVin || vehicle.lot_number) && (
                          <div className="mb-4">
                            {displayVin && (
                              <p className="text-2xs mono text-muted-foreground">
                                VIN: {displayVin}
                              </p>
                            )}
                            {vehicle.lot_number && (
                              <p className="text-2xs mono text-muted-foreground">
                                LOT #{vehicle.lot_number}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Specs */}
                        <div className="space-y-1.5 mb-4">
                          {vehicle.primary_damage && (
                            <div className="flex justify-between text-xs spec-line pb-1.5">
                              <span className="text-muted-foreground">Damage</span>
                              <span className="font-bold text-action-600">{vehicle.primary_damage}</span>
                            </div>
                          )}
                          {vehicle.mileage && (
                            <div className="flex justify-between text-xs spec-line pb-1.5">
                              <span className="text-muted-foreground">Mileage</span>
                              <span className="font-bold">{vehicle.mileage.toLocaleString()} Mi</span>
                            </div>
                          )}
                          {vehicle.transmission && (
                            <div className="flex justify-between text-xs spec-line pb-1.5">
                              <span className="text-muted-foreground">Trans</span>
                              <span className="font-bold">{vehicle.transmission}</span>
                            </div>
                          )}
                        </div>

                        {/* Price and CTA */}
                        <div className="flex justify-between items-center pt-3 border-t border-border/50">
                          <div>
                            <p className="text-3xs font-bold text-muted-foreground uppercase">Price</p>
                            {hasPrice ? (
                              <p className="text-xl font-black text-precision-900 mono">
                                {priceFormatted.amount} <span className="text-xs">{priceFormatted.currency}</span>
                              </p>
                            ) : (
                              <p className="text-sm font-semibold text-foreground">Contact for Price</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className={`${hasPrice && statusInfo.isArrived ? 'bg-action-600 hover:bg-action-700' : 'bg-precision-900 hover:bg-precision-800'} text-white px-4 py-2.5 rounded-xl text-2xs font-bold uppercase tracking-wider btn-precision`}
                          >
                            {hasPrice && statusInfo.isArrived ? 'Details' : 'Reserve'}
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 alumina-surface rounded-2xl border border-border">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-extrabold mb-2">No vehicles found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-border text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:border-precision-900 hover:text-precision-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

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
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === pageNum
                          ? 'bg-precision-900 text-white'
                          : 'border border-border hover:border-precision-900 hover:text-precision-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-10 h-10 rounded-xl border border-border font-bold text-sm hover:border-precision-900 hover:text-precision-900 transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-border text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:border-precision-900 hover:text-precision-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background bg-pattern">
        <SiteNavbar />
        <header className="frosted-panel border-b">
          <div className="max-w-content mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center gap-2 text-2xs mono text-muted-foreground mb-3">
              <Link href="/" className="hover:text-precision-900 transition-colors">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <span>/</span>
              <span className="text-foreground">Inventory</span>
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Vehicle Inventory</h1>
              <p className="text-muted-foreground">Browse our curated selection of salvage vehicles from USA & Canada</p>
            </div>
          </div>
        </header>
        <main className="max-w-content mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="hidden lg:block lg:col-span-1">
              <div className="frosted-panel rounded-2xl sticky top-28">
                <div className="p-5 border-b border-border">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="p-5 space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
            <div className="lg:col-span-3">
              <div className="flex flex-wrap gap-2 mb-6">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40 mb-6" />
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="alumina-surface rounded-2xl border border-border overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  )
}
