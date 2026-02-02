'use client'

import { useState, useEffect } from 'react'
import { fetchVehicles, fetchVehicleStats } from '@/lib/api/vehicles-client'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth/context'
import { Vehicle, VehicleStatus } from '@/types/database'
import { Plus, Search, Filter, Car, Package, DollarSign, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface VehicleWithPhotos extends Vehicle {
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null)
  
  const { hasPermission, loading: authLoading } = useAuth()
  const canManageVehicles = hasPermission('manage_vehicles')

  useEffect(() => {
    // Don't load data until auth is ready
    if (authLoading) return
    
    loadVehicles()
    loadStatistics()
  }, [page, statusFilter, authLoading])

  const loadStatistics = async () => {
    try {
      const result = await fetchVehicleStats()
      if (result.success) setStatistics(result.data)
    } catch {}
  }

  const loadVehicles = async () => {
    setLoading(true)
    
    try {
      const filters = {
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      }

      const result = await fetchVehicles(
        {
          ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
        },
        page,
        12
      )
      
      if (result.success) {
        setVehicles(result.data || [])
        setTotalPages(result.pagination?.pages || 1)
      } else {
        console.error('Failed to load vehicles:', result.error)
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadVehicles()
  }

  const handleStatusFilter = (status: VehicleStatus | 'all') => {
    setStatusFilter(status)
    setPage(1)
  }

  const statuses: { value: VehicleStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'auction_won', label: 'Auction Won' },
    { value: 'payment_processing', label: 'Payment Processing' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'at_port', label: 'At Port' },
    { value: 'customs_clearance', label: 'Customs Clearance' },
    { value: 'at_yard', label: 'At Yard' },
    { value: 'under_enhancement', label: 'Under Enhancement' },
    { value: 'ready_for_sale', label: 'Ready for Sale' },
    { value: 'sold', label: 'Sold' },
    { value: 'delivered', label: 'Delivered' }
  ]

  if (authLoading || (loading && vehicles.length === 0)) {
    return (
      <div className="container mx-auto p-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-6 w-96" />
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-3 pt-6">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vehicle inventory and track status
          </p>
        </div>
        
        {canManageVehicles && (
          <Button onClick={() => window.location.href = '/admin/vehicles/new'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal">Ready for Sale</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(statistics.byStatus) ? statistics.byStatus.find((s: any) => s.current_status === 'ready_for_sale')?.count || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Available vehicles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal">In Transit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(statistics.byStatus) ? statistics.byStatus.filter((s: any) => 
                  ['in_transit', 'shipped', 'at_port', 'customs_clearance'].includes(s.current_status)
                ).reduce((sum: number, s: any) => sum + s.count, 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Being shipped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal">Recent Additions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.recentAdditions}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by VIN, make, model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={statusFilter} onValueChange={(value) => handleStatusFilter(value as VehicleStatus | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || statusFilter ? 'No vehicles match your filters' : 'No vehicles found'}
          </div>
          {canManageVehicles && !searchTerm && !statusFilter && (
            <Button onClick={() => window.location.href = '/admin/vehicles/new'}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onViewDetails={(vehicle) => {
                  window.location.href = `/admin/vehicles/${vehicle.id}`
                }}
                onEdit={canManageVehicles ? (vehicle) => {
                  window.location.href = `/admin/vehicles/${vehicle.id}/edit`
                } : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
