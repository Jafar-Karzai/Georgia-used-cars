'use client'

import { useState, useEffect, useMemo } from 'react'
import { InvoiceService, InvoiceWithDetails, InvoiceFilters } from '@/lib/services/invoices'
import { InvoiceForm } from '@/components/invoices/invoice-form'
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
  FileText, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Send,
  CreditCard,
  Car,
  Users,
  Calendar,
  Clock
} from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null)
  
  const { hasPermission } = useAuth()
  const canManageFinances = hasPermission('manage_finances')

  const filtersStringified = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    loadInvoices()
    loadStatistics()
  }, [page, filtersStringified])

  const loadInvoices = async () => {
    setLoading(true)
    
    const searchFilters = {
      ...filters,
      ...(searchTerm && { search: searchTerm })
    }

    const result = await InvoiceService.getAll(searchFilters, page, 20)
    
    if (result.success) {
      setInvoices(result.data || [])
      setTotalPages(result.pagination?.pages || 1)
    } else {
      console.error('Failed to load invoices:', result.error)
    }
    
    setLoading(false)
  }

  const loadStatistics = async () => {
    const result = await InvoiceService.getStatistics(filters)
    if (result.success) {
      setStatistics(result.data)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadInvoices()
  }

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
    setPage(1)
  }

  const handleSendInvoice = async (invoiceId: string) => {
    const result = await InvoiceService.sendInvoice(invoiceId)
    if (result.success) {
      loadInvoices()
      loadStatistics()
    } else {
      alert('Failed to send invoice: ' + result.error)
    }
  }

  const handleAddPayment = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice)
    setShowPaymentForm(true)
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'partially_paid': 'bg-yellow-100 text-yellow-800',
      'fully_paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'draft': <FileText className="h-3 w-3" />,
      'sent': <Send className="h-3 w-3" />,
      'partially_paid': <Clock className="h-3 w-3" />,
      'fully_paid': <CheckCircle className="h-3 w-3" />,
      'overdue': <AlertTriangle className="h-3 w-3" />,
      'cancelled': <FileText className="h-3 w-3" />
    }
    return icons[status] || <FileText className="h-3 w-3" />
  }

  const isOverdue = (invoice: InvoiceWithDetails) => {
    if (!invoice.dueDate) return false
    const today = new Date()
    const dueDate = typeof invoice.dueDate === 'string' ? new Date(invoice.dueDate) : invoice.dueDate
    return dueDate < today && invoice.status !== 'fully_paid' && invoice.status !== 'cancelled'
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track customer invoices and payments
          </p>
        </div>
        
        {canManageFinances && (
          <Button onClick={() => setShowInvoiceForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics.byStatus.counts.sent || 0) + (statistics.byStatus.counts.partially_paid || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.overdue.count}
              </div>
              <p className="text-xs text-muted-foreground">
                Past due date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.byStatus.counts.fully_paid || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Fully paid
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search invoices by number or notes..."
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
          
          <Select onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="fully_paid">Fully Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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

          <Button
            variant="outline"
            onClick={() => handleFilterChange('overdueOnly', 'true')}
            className="whitespace-nowrap"
          >
            Overdue Only
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof InvoiceFilters]) 
              ? 'No invoices match your filters' 
              : 'No invoices found'}
          </div>
          {canManageFinances && !searchTerm && Object.keys(filters).length === 0 && (
            <Button onClick={() => setShowInvoiceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Invoice
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className={`hover:shadow-md transition-shadow ${isOverdue(invoice) ? 'border-red-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{invoice.invoiceNumber}</h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {isOverdue(invoice) && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        {invoice.customer && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {invoice.customer.fullName}
                          </div>
                        )}

                        {invoice.vehicle && (
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(invoice.createdAt)}
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {formatDate(invoice.dueDate)}
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <div className="font-medium">{formatPrice(invoice.totalAmount, invoice.currency)}</div>
                        </div>

                        {invoice.totalPaid !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Paid:</span>
                            <div className="font-medium text-green-600">{formatPrice(invoice.totalPaid, invoice.currency)}</div>
                          </div>
                        )}

                        {invoice.balanceDue !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <div className={`font-medium ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatPrice(invoice.balanceDue, invoice.currency)}
                            </div>
                          </div>
                        )}

                        {invoice.payments && invoice.payments.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Payments:</span>
                            <div className="font-medium">{invoice.payments.length} transactions</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {canManageFinances && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {invoice.balanceDue && invoice.balanceDue > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddPayment(invoice)}
                              >
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            {invoice.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendInvoice(invoice.id)}
                                className="text-xs"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send Invoice
                              </Button>
                            )}
                          </div>
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

      {/* Invoice Form */}
      <InvoiceForm
        isOpen={showInvoiceForm}
        onClose={() => setShowInvoiceForm(false)}
        onSuccess={() => {
          loadInvoices()
          loadStatistics()
        }}
      />

      {/* Payment Form */}
      <PaymentForm
        isOpen={showPaymentForm}
        onClose={() => {
          setShowPaymentForm(false)
          setSelectedInvoice(null)
        }}
        onSuccess={() => {
          loadInvoices()
          loadStatistics()
        }}
        invoiceId={selectedInvoice?.id}
      />
    </div>
  )
}