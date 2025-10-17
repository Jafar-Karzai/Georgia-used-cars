'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, RefreshCw, TrendingUp, Users, DollarSign, CreditCard } from 'lucide-react'
import { InvoiceService } from '@/lib/services/invoices'
import { VehicleService } from '@/lib/services/vehicles'
import { PaymentService } from '@/lib/services/payments'

interface SalesData {
  invoices: {
    total: number
    totalValue: Record<string, number>
    byStatus: {
      counts: Record<string, number>
      totals: Record<string, number>
    }
  }
  vehicles: {
    total: number
    byStatus: Array<{ current_status: string; count: number }>
  }
  payments: {
    total: number
    totalValue: Record<string, number>
  }
}

interface DateFilters {
  created_from?: string
  created_to?: string
}

export default function SalesReportsPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilters, setDateFilters] = useState<DateFilters>({})
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchSalesData = async (filters: DateFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const [invoicesResult, vehiclesResult, paymentsResult] = await Promise.all([
        InvoiceService.getStatistics(filters),
        VehicleService.getStatistics(),
        PaymentService.getStatistics(filters)
      ])

      if (!invoicesResult.success) {
        throw new Error(invoicesResult.error || 'Failed to fetch invoice statistics')
      }
      if (!vehiclesResult.success) {
        throw new Error(vehiclesResult.error || 'Failed to fetch vehicle statistics')
      }
      if (!paymentsResult.success) {
        throw new Error(paymentsResult.error || 'Failed to fetch payment statistics')
      }

      setSalesData({
        invoices: invoicesResult.data,
        vehicles: vehiclesResult.data,
        payments: paymentsResult.data
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [])

  const handleApplyFilters = () => {
    const filters: DateFilters = {}
    if (startDate) filters.created_from = startDate
    if (endDate) filters.created_to = endDate
    
    setDateFilters(filters)
    fetchSalesData(filters)
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setDateFilters({})
    fetchSalesData({})
  }

  const handleRetry = () => {
    fetchSalesData(dateFilters)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AE').format(num)
  }

  const calculateConversionRate = () => {
    if (!salesData?.vehicles?.byStatus) return 0
    const soldVehicles = salesData.vehicles.byStatus['sold'] || 0
    const totalVehicles = salesData.vehicles.total
    return totalVehicles > 0 ? Number(((soldVehicles / totalVehicles) * 100).toFixed(2)) : 0
  }

  const calculateAverageInvoiceValue = () => {
    if (!salesData?.invoices?.totalValue || salesData.invoices.total === 0) return { amount: 0, currency: 'AED' }
    
    // Calculate total value in AED (assuming primary currency)
    const totalValue = Object.entries(salesData.invoices.totalValue).reduce((sum, [currency, amount]) => {
      // Convert to AED for calculation (simplified conversion)
      const aedAmount = currency === 'AED' ? amount :
                       currency === 'USD' ? amount * 3.67 :
                       currency === 'CAD' ? amount * 2.70 : amount
      return sum + aedAmount
    }, 0)
    
    return {
      amount: Math.round(totalValue / salesData.invoices.total),
      currency: 'AED'
    }
  }

  const calculateCollectionRate = () => {
    if (!salesData?.invoices?.totalValue || !salesData?.payments?.totalValue) return 0
    
    // Calculate total invoiced amount in AED
    const totalInvoiced = Object.entries(salesData.invoices.totalValue).reduce((sum, [currency, amount]) => {
      const aedAmount = currency === 'AED' ? amount :
                       currency === 'USD' ? amount * 3.67 :
                       currency === 'CAD' ? amount * 2.70 : amount
      return sum + aedAmount
    }, 0)
    
    // Calculate total collected amount in AED
    const totalCollected = Object.entries(salesData.payments.totalValue).reduce((sum, [currency, amount]) => {
      const aedAmount = currency === 'AED' ? amount :
                       currency === 'USD' ? amount * 3.67 :
                       currency === 'CAD' ? amount * 2.70 : amount
      return sum + aedAmount
    }, 0)
    
    return totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(0)) : 0
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Loading sales data...</p>
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
              <p className="text-lg font-medium">Error loading sales data</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive sales performance analytics and insights
        </p>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(salesData?.invoices.total || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(salesData?.vehicles?.byStatus?.['sold'] || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(salesData?.payments.total || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateConversionRate()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown and Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData?.invoices?.totalValue && Object.entries(salesData.invoices.totalValue).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="font-medium">{currency}</span>
                  <span className="text-lg font-bold">{formatNumber(amount)} {currency}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData?.invoices?.byStatus?.counts && Object.entries(salesData.invoices.byStatus.counts).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="font-medium">{status.replace('_', ' ')} {formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" role="tablist">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  Chart visualization would be implemented here
                </div>
              </TabsContent>
              <TabsContent value="detailed" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  Detailed chart view would be implemented here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Pie chart visualization would be implemented here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const avg = calculateAverageInvoiceValue()
                return formatCurrency(avg.amount, avg.currency)
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCollectionRate()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
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
      </div>
    </main>
  )
}