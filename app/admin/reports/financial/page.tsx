'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  PiggyBank, 
  CreditCard,
  Receipt,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { InvoiceService } from '@/lib/services/invoices'
import { ExpenseService } from '@/lib/services/expenses'
import { PaymentService } from '@/lib/services/payments'

interface FinancialData {
  invoices: {
    total: number
    totalValue: Record<string, number>
    byStatus: {
      counts: Record<string, number>
      totals: Record<string, number>
    }
  }
  expenses: {
    total: number
    byCurrency: Record<string, number>
    byCategory: Record<string, number>
    count: number
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

interface ExpenseFilters {
  date_from?: string
  date_to?: string
}

interface PaymentFilters {
  date_from?: string
  date_to?: string
}

export default function FinancialReportsPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilters, setDateFilters] = useState<DateFilters>({})
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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

  const fetchFinancialData = async (filters: DateFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const invoiceFilters = filters
      const expenseFilters: ExpenseFilters = {}
      const paymentFilters: PaymentFilters = {}

      if (filters.created_from) {
        expenseFilters.date_from = filters.created_from
        paymentFilters.date_from = filters.created_from
      }
      if (filters.created_to) {
        expenseFilters.date_to = filters.created_to
        paymentFilters.date_to = filters.created_to
      }

      const [invoicesResult, expensesResult, paymentsResult] = await Promise.all([
        InvoiceService.getStatistics(invoiceFilters),
        ExpenseService.getStatistics(expenseFilters),
        PaymentService.getStatistics(paymentFilters)
      ])

      if (!invoicesResult.success) {
        throw new Error(invoicesResult.error || 'Failed to fetch invoice statistics')
      }
      if (!expensesResult.success) {
        throw new Error(expensesResult.error || 'Failed to fetch expense statistics')
      }
      if (!paymentsResult.success) {
        throw new Error(paymentsResult.error || 'Failed to fetch payment statistics')
      }

      setFinancialData({
        invoices: invoicesResult.data,
        expenses: expensesResult.data,
        payments: paymentsResult.data
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const handleApplyFilters = () => {
    const filters: DateFilters = {}
    if (startDate) filters.created_from = startDate
    if (endDate) filters.created_to = endDate
    
    setDateFilters(filters)
    fetchFinancialData(filters)
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setDateFilters({})
    fetchFinancialData({})
  }

  const handleRetry = () => {
    fetchFinancialData(dateFilters)
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
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

  // Financial calculations
  const calculateTotalRevenue = () => {
    if (!financialData?.invoices?.totalValue) return 0
    return Object.entries(financialData.invoices.totalValue).reduce((sum, [currency, amount]) => {
      return sum + convertToAED(amount, currency)
    }, 0)
  }

  const calculateTotalExpenses = () => {
    if (!financialData?.expenses?.byCurrency) return 0
    return Object.entries(financialData.expenses.byCurrency).reduce((sum, [currency, amount]) => {
      return sum + convertToAED(amount, currency)
    }, 0)
  }

  const calculateNetProfit = () => {
    const revenue = calculateTotalRevenue()
    const expenses = calculateTotalExpenses()
    return revenue - expenses
  }

  const calculateProfitMargin = () => {
    const revenue = calculateTotalRevenue()
    const profit = calculateNetProfit()
    return revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0
  }

  const calculateCashInflow = () => {
    if (!financialData?.payments?.totalValue) return 0
    return Object.entries(financialData.payments.totalValue).reduce((sum, [currency, amount]) => {
      return sum + convertToAED(amount, currency)
    }, 0)
  }

  const calculateOutstandingReceivables = () => {
    if (!financialData?.invoices?.byStatus?.totals) return 0
    const { sent = 0, overdue = 0 } = financialData.invoices.byStatus.totals
    return sent + overdue
  }

  const calculateCollectionEfficiency = () => {
    const totalInvoiced = calculateTotalRevenue()
    const cashReceived = calculateCashInflow()
    return totalInvoiced > 0 ? Number(((cashReceived / totalInvoiced) * 100).toFixed(1)) : 0
  }

  const calculateAverageTransactionValue = () => {
    const revenue = calculateTotalRevenue()
    const invoiceCount = financialData?.invoices?.total || 0
    return invoiceCount > 0 ? Math.round(revenue / invoiceCount) : 0
  }

  const calculateExpenseRatio = () => {
    const revenue = calculateTotalRevenue()
    const expenses = calculateTotalExpenses()
    return revenue > 0 ? Number(((expenses / revenue) * 100).toFixed(1)) : 0
  }

  const calculateWorkingCapital = () => {
    const cashReceived = calculateCashInflow()
    const expenses = calculateTotalExpenses()
    return cashReceived - expenses
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Loading financial data...</p>
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
              <p className="text-lg font-medium">Error loading financial data</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive financial overview and cash flow analysis
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

      {/* Financial Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalRevenue())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalExpenses())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateNetProfit())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateProfitMargin()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Inflow</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateCashInflow())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Outflow</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalExpenses())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateOutstandingReceivables())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCollectionEfficiency()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData?.expenses?.byCategory && Object.entries(financialData.expenses.byCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="font-medium capitalize">{category} {formatNumber(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense by Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData?.expenses?.byCurrency && Object.entries(financialData.expenses.byCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="font-medium">{currency}</span>
                  <span className="text-lg font-bold">{formatNumber(amount)} {currency}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Trends</CardTitle>
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
                  P&L chart visualization would be implemented here
                </div>
              </TabsContent>
              <TabsContent value="quarterly" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  Quarterly P&L view would be implemented here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Cash Flow Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              Cash flow chart visualization would be implemented here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <PieChart className="h-12 w-12 mx-auto mb-4" />
            Expense distribution pie chart would be implemented here
          </div>
        </CardContent>
      </Card>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Transaction Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateAverageTransactionValue())} AED</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateExpenseRatio()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateWorkingCapital())} AED</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Financial Reports</CardTitle>
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