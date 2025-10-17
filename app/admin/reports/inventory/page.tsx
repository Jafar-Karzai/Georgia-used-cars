'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Car, 
  Package, 
  TrendingUp, 
  Clock, 
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { VehicleService } from '@/lib/services/vehicles'
import { ExpenseService } from '@/lib/services/expenses'
import { InvoiceService } from '@/lib/services/invoices'

interface InventoryData {
  vehicles: {
    total: number
    byStatus: Array<{ current_status: string; count: number }>
  }
  vehicleList: Array<{
    id: string
    year: number
    make: string
    model: string
    current_status: string
    purchase_price: number
    currency: string
    days_in_inventory: number
    lot_number: string
    vin: string
    engine?: string
    mileage?: number
    color?: string
  }>
  expenses: {
    total: number
    byCategory: Record<string, number>
    byCurrency: Record<string, number>
    count: number
  }
  invoices: {
    total: number
    totalValue: Record<string, number>
    byStatus: {
      counts: Record<string, number>
      totals: Record<string, number>
    }
  }
}

interface VehicleFilters {
  current_status?: string
  make?: string
}

export default function InventoryReportsPage() {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VehicleFilters>({})
  const [statusFilter, setStatusFilter] = useState('')
  const [makeFilter, setMakeFilter] = useState('')

  const fetchInventoryData = async (vehicleFilters: VehicleFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const [vehiclesStatsResult, vehicleListResult, expensesResult, invoicesResult] = await Promise.all([
        VehicleService.getStatistics(),
        VehicleService.getAll(vehicleFilters, 1, 20),
        ExpenseService.getStatistics(),
        InvoiceService.getStatistics()
      ])

      if (!vehiclesStatsResult.success) {
        throw new Error(vehiclesStatsResult.error || 'Failed to fetch vehicle statistics')
      }
      if (!vehicleListResult.success) {
        throw new Error(vehicleListResult.error || 'Failed to fetch vehicle list')
      }
      if (!expensesResult.success) {
        throw new Error(expensesResult.error || 'Failed to fetch expense statistics')
      }
      if (!invoicesResult.success) {
        throw new Error(invoicesResult.error || 'Failed to fetch invoice statistics')
      }

      setInventoryData({
        vehicles: vehiclesStatsResult.data,
        vehicleList: vehicleListResult.data || [],
        expenses: expensesResult.data,
        invoices: invoicesResult.data
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const handleApplyFilters = () => {
    const newFilters: VehicleFilters = {}
    if (statusFilter && statusFilter !== 'all') newFilters.current_status = statusFilter
    if (makeFilter) newFilters.make = makeFilter
    
    setFilters(newFilters)
    fetchInventoryData(newFilters)
  }

  const handleResetFilters = () => {
    setStatusFilter('')
    setMakeFilter('')
    setFilters({})
    fetchInventoryData({})
  }

  const handleRetry = () => {
    fetchInventoryData(filters)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AE').format(num)
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return `${formatNumber(amount)} ${currency}`
  }

  // Calculations
  const getTotalVehicles = () => inventoryData?.vehicles?.total || 0
  
  const getAvailableVehicles = () => {
    const available = inventoryData?.vehicles?.byStatus?.find(s => s.current_status === 'available')?.count || 0
    const readyForSale = inventoryData?.vehicles?.byStatus?.find(s => s.current_status === 'ready_for_sale')?.count || 0
    return available + readyForSale
  }

  const getSoldVehicles = () => {
    return inventoryData?.vehicles?.byStatus?.find(s => s.current_status === 'sold')?.count || 0
  }

  const getInventoryTurnover = () => {
    const total = getTotalVehicles()
    const sold = getSoldVehicles()
    return total > 0 ? Number(((sold / total) * 100).toFixed(1)) : 0
  }

  const getAverageVehicleValue = () => {
    const totalExpenses = inventoryData?.expenses?.total || 0
    const vehicleCount = getTotalVehicles()
    return vehicleCount > 0 ? Math.round(totalExpenses / vehicleCount) : 0
  }

  const getAverageDaysInInventory = () => {
    if (!inventoryData?.vehicleList?.length) return 0
    const totalDays = inventoryData.vehicleList.reduce((sum, vehicle) => sum + (vehicle.days_in_inventory || 0), 0)
    return Math.round(totalDays / inventoryData.vehicleList.length)
  }

  const getAverageTimeToSell = () => {
    const soldVehicles = inventoryData?.vehicleList?.filter(v => v.current_status === 'sold') || []
    if (soldVehicles.length === 0) return 0
    const totalDays = soldVehicles.reduce((sum, vehicle) => sum + (vehicle.days_in_inventory || 0), 0)
    return Math.round(totalDays / soldVehicles.length)
  }

  const getSlowMovingInventory = () => {
    return inventoryData?.vehicleList?.filter(v => (v.days_in_inventory || 0) >= 60).length || 0
  }

  const getTotalInventoryValue = () => {
    return inventoryData?.expenses?.total || 0
  }

  const calculateInventoryROI = () => {
    const revenue = Object.values(inventoryData?.invoices?.totalValue || {}).reduce((sum, amount) => sum + amount, 0)
    const cost = inventoryData?.expenses?.total || 0
    return cost > 0 ? Number(((revenue - cost) / cost * 100).toFixed(1)) : 0
  }

  const calculateInventoryVelocity = () => {
    const sold = getSoldVehicles()
    const total = getTotalVehicles()
    return total > 0 ? Number(((sold / total) * 100).toFixed(1)) : 0
  }

  const getCarryingCostPerDay = () => {
    const totalValue = getTotalInventoryValue()
    const avgDays = getAverageDaysInInventory()
    return avgDays > 0 ? Math.round(totalValue * 0.001) : 0 // Simplified calculation
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
      case 'ready_for_sale':
        return 'default'
      case 'sold':
        return 'secondary'
      case 'reserved':
        return 'outline'
      case 'in_transit':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Loading inventory data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-medium">Error loading inventory data</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive vehicle inventory analysis and management insights
        </p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" aria-label="Status filter" className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="ready_for_sale">Ready for Sale</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make-filter">Make Filter</Label>
              <Input
                id="make-filter"
                type="text"
                placeholder="Enter make"
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                aria-label="Make filter"
                className="w-[180px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getTotalVehicles())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getAvailableVehicles())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Sold</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getSoldVehicles())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Days in Inventory</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getAverageDaysInInventory())}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryData?.vehicles?.byStatus?.map(({ current_status, count }) => (
              <div key={current_status} className="flex justify-between items-center">
                <span className="font-medium">{formatStatus(current_status)} {formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getInventoryTurnover()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Vehicle Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getAverageVehicleValue())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time to Sell</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageTimeToSell()} days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow-Moving Inventory</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSlowMovingInventory()} vehicles</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Inventory Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Lot Number</th>
                  <th className="text-left p-2">Vehicle</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Days in Inventory</th>
                  <th className="text-left p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData?.vehicleList?.map((vehicle, index) => (
                  <tr key={vehicle.id || `vehicle-${index}`} className="border-b">
                    <td className="p-2">{vehicle.lot_number}</td>
                    <td className="p-2">{vehicle.make} {vehicle.model}</td>
                    <td className="p-2">
                      <Badge variant={getStatusBadgeVariant(vehicle.current_status)}>
                        {formatStatus(vehicle.current_status)}
                      </Badge>
                    </td>
                    <td className="p-2">{vehicle.days_in_inventory}</td>
                    <td className="p-2">{formatCurrency(vehicle.purchase_price, vehicle.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly" role="tablist">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Monthly inventory trends chart would be implemented here
                </div>
              </TabsContent>
              <TabsContent value="weekly" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Weekly inventory trends chart would be implemented here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <PieChart className="h-12 w-12 mx-auto mb-4" />
              Status distribution pie chart would be implemented here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-muted-foreground">0-30 days</p>
              <p className="text-2xl font-bold">
                {inventoryData?.vehicleList?.filter(v => (v.days_in_inventory || 0) <= 30).length || 0}
              </p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-muted-foreground">31-60 days</p>
              <p className="text-2xl font-bold">
                {inventoryData?.vehicleList?.filter(v => {
                  const days = v.days_in_inventory || 0
                  return days > 30 && days <= 60
                }).length || 0}
              </p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-muted-foreground">60+ days</p>
              <p className="text-2xl font-bold">
                {inventoryData?.vehicleList?.filter(v => (v.days_in_inventory || 0) > 60).length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalInventoryValue())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateInventoryROI()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateInventoryVelocity()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrying Cost per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getCarryingCostPerDay())}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Inventory Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}