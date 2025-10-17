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
  Users, 
  UserCheck, 
  Building, 
  MapPin, 
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Activity,
  Target,
  Percent,
  Calendar
} from 'lucide-react'
import { CustomerService } from '@/lib/services/customers'
import { InvoiceService } from '@/lib/services/invoices'
import { PaymentService } from '@/lib/services/payments'

interface CustomerData {
  customers: {
    total: number
    byType: Array<{ customer_type: string; count: number }>
    byRegion: Array<{ region: string; count: number }>
    activeCount: number
    topCustomers?: Array<{
      id: string
      name: string
      customer_type: string
      region: string
      total_spent: number
      currency: string
      transaction_count: number
      last_purchase: string
    }>
  }
  invoices: {
    total: number
    totalValue: Record<string, number>
    byStatus: {
      counts: Record<string, number>
      totals: Record<string, number>
    }
  }
  payments: {
    total: number
    totalValue: Record<string, number>
  }
}

interface CustomerFilters {
  customer_type?: string
  region?: string
}

export default function CustomersReportsPage() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CustomerFilters>({})
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  // Currency conversion rates (simplified - in production would use real-time rates)
  const USD_TO_AED = 3.67
  const CAD_TO_AED = 2.70

  const convertToAED = (amount: number, currency: string): number => {
    switch (currency) {
      case 'USD': return amount * USD_TO_AED
      case 'CAD': return amount * CAD_TO_AED
      case 'AED': 
      default: return amount
    }
  }

  const fetchCustomerData = async (customerFilters: CustomerFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const [customersResult, invoicesResult, paymentsResult] = await Promise.all([
        CustomerService.getStatistics(customerFilters),
        InvoiceService.getStatistics({}),
        PaymentService.getStatistics({})
      ])

      if (!customersResult.success) {
        throw new Error(customersResult.error || 'Failed to fetch customer statistics')
      }
      if (!invoicesResult.success) {
        throw new Error(invoicesResult.error || 'Failed to fetch invoice statistics')
      }
      if (!paymentsResult.success) {
        throw new Error(paymentsResult.error || 'Failed to fetch payment statistics')
      }

      setCustomerData({
        customers: customersResult.data,
        invoices: invoicesResult.data,
        payments: paymentsResult.data
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerData()
  }, [])

  const handleApplyFilters = () => {
    const newFilters: CustomerFilters = {}
    if (typeFilter && typeFilter !== 'all') newFilters.customer_type = typeFilter
    if (regionFilter && regionFilter !== 'all') newFilters.region = regionFilter
    
    setFilters(newFilters)
    fetchCustomerData(newFilters)
  }

  const handleResetFilters = () => {
    setTypeFilter('')
    setRegionFilter('')
    setFilters({})
    fetchCustomerData({})
  }

  const handleRetry = () => {
    fetchCustomerData(filters)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AE').format(num)
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return `${formatNumber(amount)} ${currency}`
  }

  // Calculations
  const getTotalCustomers = () => customerData?.customers?.total || 0
  const getActiveCustomers = () => customerData?.customers?.activeCount || 0
  
  const getIndividualCustomers = () => {
    return customerData?.customers?.byType?.find(t => t.customer_type === 'individual')?.count || 0
  }

  const getBusinessCustomers = () => {
    return customerData?.customers?.byType?.find(t => t.customer_type === 'business')?.count || 0
  }

  const getCustomerActivityRate = () => {
    const total = getTotalCustomers()
    const active = getActiveCustomers()
    return total > 0 ? Number(((active / total) * 100).toFixed(1)) : 0
  }

  const calculateTotalRevenue = () => {
    if (!customerData?.invoices?.totalValue) return 0
    return Object.entries(customerData.invoices.totalValue).reduce((sum, [currency, amount]) => {
      return sum + convertToAED(amount, currency)
    }, 0)
  }

  const getAverageRevenuePerCustomer = () => {
    const revenue = calculateTotalRevenue()
    const customers = getTotalCustomers()
    return customers > 0 ? Math.round(revenue / customers) : 0
  }

  const calculateTotalPayments = () => {
    if (!customerData?.payments?.totalValue) return 0
    return Object.entries(customerData.payments.totalValue).reduce((sum, [currency, amount]) => {
      return sum + convertToAED(amount, currency)
    }, 0)
  }

  const getPaymentCollectionRate = () => {
    const revenue = calculateTotalRevenue()
    const payments = calculateTotalPayments()
    return revenue > 0 ? Number(((payments / revenue) * 100).toFixed(1)) : 0
  }

  const getOutstandingReceivables = () => {
    if (!customerData?.invoices?.byStatus?.totals) return 0
    const { sent = 0, overdue = 0 } = customerData.invoices.byStatus.totals
    return sent + overdue
  }

  const getAverageTransactionsPerCustomer = () => {
    const invoices = customerData?.invoices?.total || 0
    const customers = getTotalCustomers()
    return customers > 0 ? Number((invoices / customers).toFixed(2)) : 0
  }

  const calculateAverageCustomerLifetimeValue = () => {
    const revenue = calculateTotalRevenue()
    const activeCustomers = getActiveCustomers()
    return activeCustomers > 0 ? Math.round(revenue / activeCustomers) : 0
  }

  const getRepeatCustomerRate = () => {
    // Simplified calculation - in real world would analyze customer transaction history
    const avgTransactions = getAverageTransactionsPerCustomer()
    return avgTransactions > 1 ? Number(((avgTransactions - 1) * 25).toFixed(1)) : 0
  }

  const getCustomerRetentionRate = () => {
    const activityRate = getCustomerActivityRate()
    // Simplified retention rate calculation
    return Number((activityRate * 0.9).toFixed(1))
  }

  const getCustomerChurnRate = () => {
    const total = getTotalCustomers()
    const active = getActiveCustomers()
    return total > 0 ? Number(((total - active) / total * 100).toFixed(1)) : 0
  }

  const getCustomerAcquisitionCost = () => {
    // Simplified calculation - would typically involve marketing spend data
    const revenue = calculateTotalRevenue()
    const customers = getTotalCustomers()
    return customers > 0 ? Math.round(revenue * 0.05 / customers) : 0 // Assume 5% of revenue spent on acquisition
  }

  const formatCustomerType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'individual':
        return 'default'
      case 'business':
        return 'secondary'
      case 'dealer':
        return 'outline'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Loading customer data...</p>
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
              <p className="text-lg font-medium">Error loading customer data</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Customers Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive customer analytics and relationship insights
        </p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="type-filter">Customer Type Filter</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" aria-label="Customer type filter" className="w-[180px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-filter">Region Filter</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger id="region-filter" aria-label="Region filter" className="w-[180px]">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getTotalCustomers())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getActiveCustomers())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individual Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getIndividualCustomers())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Customers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(getBusinessCustomers())}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData?.customers?.byType?.map(({ customer_type, count }) => (
              <div key={customer_type} className="flex justify-between items-center">
                <span className="font-medium">{formatCustomerType(customer_type)} {formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData?.customers?.byRegion?.map(({ region, count }) => (
              <div key={region} className="flex justify-between items-center">
                <span className="font-medium">{region} {formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue per Customer</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getAverageRevenuePerCustomer())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Collection Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPaymentCollectionRate()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getOutstandingReceivables())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Activity Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCustomerActivityRate()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transactions per Customer</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageTransactionsPerCustomer()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Customer Lifetime Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateAverageCustomerLifetimeValue())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customer Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRepeatCustomerRate()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCustomerRetentionRate()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Analysis */}
      {customerData?.customers?.topCustomers && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Region</th>
                    <th className="text-left p-2">Total Spent</th>
                    <th className="text-left p-2">Transactions</th>
                    <th className="text-left p-2">Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {customerData.customers.topCustomers.map((customer, index) => (
                    <tr key={customer.id || `customer-${index}`} className="border-b">
                      <td className="p-2 font-medium">{customer.name}</td>
                      <td className="p-2">
                        <Badge variant={getTypeBadgeVariant(customer.customer_type)}>
                          {formatCustomerType(customer.customer_type)}
                        </Badge>
                      </td>
                      <td className="p-2">{customer.region}</td>
                      <td className="p-2">{formatCurrency(customer.total_spent, customer.currency)}</td>
                      <td className="p-2">{customer.transaction_count}</td>
                      <td className="p-2">{customer.last_purchase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly" role="tablist">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Customer acquisition trends chart would be implemented here
                </div>
              </TabsContent>
              <TabsContent value="quarterly" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Quarterly customer growth view would be implemented here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Customer Type Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <PieChart className="h-12 w-12 mx-auto mb-4" />
              Customer type distribution pie chart would be implemented here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            Regional distribution map would be implemented here
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Customer Segment */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Customer Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            Revenue by segment chart would be implemented here
          </div>
        </CardContent>
      </Card>

      {/* Advanced Customer Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getCustomerAcquisitionCost())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCustomerChurnRate()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerData?.customers?.byRegion?.slice(0, 2).map(({ region, count }) => (
                <div key={region} className="text-sm">
                  <span className="font-medium">{region}</span>
                  <span className="ml-2">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segment Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerData?.customers?.byType?.slice(0, 2).map(({ customer_type, count }) => (
                <div key={customer_type} className="text-sm">
                  <span className="font-medium">{formatCustomerType(customer_type)}</span>
                  <span className="ml-2">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Customer Reports</CardTitle>
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