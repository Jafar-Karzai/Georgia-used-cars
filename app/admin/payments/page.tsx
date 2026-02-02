'use client'

import { useState, useEffect, useMemo } from 'react'
import { PaymentService, PaymentFilters } from '@/lib/services/payments'
import type { Payment, Invoice, Vehicle } from '@prisma/client'

type PaymentWithDetails = Payment & {
  invoices?: {
    invoiceNumber: string
    customers?: { fullName: string }
    vehicles?: { year: number; make: string; model: string }
  }
}
import { PaymentForm } from '@/components/payments/payment-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth/context'
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Banknote,
  Eye,
  Edit,
  Receipt,
  Calendar,
  Building
} from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null)
  
  const { hasPermission } = useAuth()
  const canManageFinances = hasPermission('manage_finances')

  const filtersStringified = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    loadPayments()
    loadStatistics()
  }, [page, filtersStringified])

  const loadPayments = async () => {
    setLoading(true)
    
    const searchFilters = {
      ...filters,
      ...(searchTerm && { search: searchTerm })
    }

    const result = await PaymentService.getAll(searchFilters, page, 20)
    
    if (result.success) {
      setPayments(result.data || [])
      setTotalPages(result.pagination?.pages || 1)
    } else {
      console.error('Failed to load payments:', result.error)
    }
    
    setLoading(false)
  }

  const loadStatistics = async () => {
    const result = await PaymentService.getStatistics(filters)
    if (result.success) {
      setStatistics(result.data)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadPayments()
  }

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
    setPage(1)
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }

  const formatPrice = (amount: number | { toString: () => string }, currency: string) => {
    const numAmount = typeof amount === 'number' ? amount : Number(amount.toString())
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED'
    }).format(numAmount)
  }

  const getPaymentMethodIcon = (method: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'cash': <Banknote className="h-3 w-3" />,
      'bank_transfer': <CreditCard className="h-3 w-3" />,
      'check': <Receipt className="h-3 w-3" />,
      'credit_card': <CreditCard className="h-3 w-3" />,
      'other': <DollarSign className="h-3 w-3" />
    }
    return icons[method] || <DollarSign className="h-3 w-3" />
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'credit_card': 'Credit Card',
      'other': 'Other'
    }
    return labels[method] || method
  }

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'cash': 'bg-green-100 text-green-800',
      'bank_transfer': 'bg-blue-100 text-blue-800',
      'check': 'bg-purple-100 text-purple-800',
      'credit_card': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    }
    return colors[method] || 'bg-gray-100 text-gray-800'
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Track and manage all customer payments
          </p>
        </div>
        
        {canManageFinances && (
          <Button onClick={() => setShowPaymentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All payment records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value (AED)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(statistics.totalValue?.AED || 0, 'AED')}
              </div>
              <p className="text-xs text-muted-foreground">
                AED payments received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Transfers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byMethod?.counts?.bank_transfer || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Electronic payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by transaction ID or notes..."
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
          
          <Select onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('currency', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From date"
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-40"
          />

          <Input
            type="date"
            placeholder="To date"
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof PaymentFilters]) 
              ? 'No payments match your filters' 
              : 'No payments found'}
          </div>
          {canManageFinances && !searchTerm && Object.keys(filters).length === 0 && (
            <Button onClick={() => setShowPaymentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Your First Payment
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold">
                          {formatPrice(payment.amount, payment.currency)}
                        </div>
                        <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        {payment.invoices && (
                          <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Invoice: {payment.invoices.invoiceNumber}
                          </div>
                        )}

                        {payment.invoices?.customers && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {payment.invoices.customers.fullName}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payment.paymentDate)}
                        </div>

                        {payment.transactionId && (
                          <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Ref: {payment.transactionId}
                          </div>
                        )}
                      </div>

                      {payment.invoices?.vehicles && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Vehicle: {payment.invoices.vehicles.year} {payment.invoices.vehicles.make} {payment.invoices.vehicles.model}
                        </div>
                      )}
                      
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground">{payment.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {canManageFinances && (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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

      {/* Payment Form */}
      <PaymentForm
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        onSuccess={() => {
          loadPayments()
          loadStatistics()
        }}
      />
    </div>
  )
}