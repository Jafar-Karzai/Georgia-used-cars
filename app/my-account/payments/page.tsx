'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Download,
  Search,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  Wallet,
  Filter,
  FileText,
} from 'lucide-react'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock payment history data
  const payments = [
    {
      id: 'PAY-001234',
      reservationId: '2021-Camry-XLE-id',
      vehicle: {
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        trim: 'XLE',
      },
      type: 'deposit', // deposit or balance
      amount: 2500,
      currency: 'AED',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: 'TXN-2024-001234',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: 'Reservation Deposit (5%)',
    },
    {
      id: 'PAY-001235',
      reservationId: 'mock-reservation-id-2',
      vehicle: {
        year: 2022,
        make: 'Honda',
        model: 'Accord',
        trim: 'Sport',
      },
      type: 'deposit',
      amount: 3000,
      currency: 'AED',
      paymentMethod: 'Debit Card',
      status: 'completed',
      transactionId: 'TXN-2024-001235',
      paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Reservation Deposit (5%)',
    },
    {
      id: 'PAY-001236',
      reservationId: '2020-Mustang-id-3',
      vehicle: {
        year: 2020,
        make: 'Ford',
        model: 'Mustang',
        trim: 'GT',
      },
      type: 'balance',
      amount: 76000,
      currency: 'AED',
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      transactionId: 'TXN-2024-001236',
      paidAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      description: 'Remaining Balance (95%)',
      receiptUrl: '/receipts/PAY-001236.pdf',
    },
    {
      id: 'PAY-001237',
      reservationId: '2021-Camry-XLE-id',
      vehicle: {
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        trim: 'XLE',
      },
      type: 'balance',
      amount: 47500,
      currency: 'AED',
      paymentMethod: 'Bank Transfer',
      status: 'pending',
      transactionId: 'TXN-2024-001237',
      paidAt: null,
      description: 'Remaining Balance (95%)',
      receiptUploaded: true,
      receiptStatus: 'under_review',
    },
    {
      id: 'PAY-001238',
      reservationId: 'mock-reservation-id-4',
      vehicle: {
        year: 2019,
        make: 'BMW',
        model: 'X5',
        trim: 'xDrive40i',
      },
      type: 'deposit',
      amount: 5000,
      currency: 'AED',
      paymentMethod: 'Credit Card',
      status: 'failed',
      transactionId: 'TXN-2024-001238',
      paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      description: 'Reservation Deposit (5%) - Refunded',
      failureReason: 'Reservation expired',
    },
  ]

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ElementType }
    > = {
      completed: {
        label: 'Completed',
        className: 'bg-emerald-100 text-emerald-800',
        icon: CheckCircle,
      },
      pending: {
        label: 'Pending Verification',
        className: 'bg-amber-100 text-amber-800',
        icon: Clock,
      },
      failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-800',
        icon: Clock,
      },
    }
    return (
      statusMap[status] || {
        label: 'Unknown',
        className: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
      }
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes('Card')) return CreditCard
    if (method.includes('Bank')) return Building2
    if (method.includes('Cash')) return Wallet
    return CreditCard
  }

  const getTypebadge = (type: string) => {
    return type === 'deposit'
      ? { label: 'Deposit', className: 'bg-blue-100 text-blue-800' }
      : { label: 'Balance', className: 'bg-purple-100 text-purple-800' }
  }

  const filterPayments = (status: string) => {
    let filtered = payments
    if (status === 'completed') filtered = payments.filter((p) => p.status === 'completed')
    if (status === 'pending')
      filtered = payments.filter((p) => ['pending', 'processing'].includes(p.status))
    if (status === 'failed') filtered = payments.filter((p) => p.status === 'failed')

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${p.vehicle.year} ${p.vehicle.make} ${p.vehicle.model}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredPayments = filterPayments(activeTab)

  // Calculate stats
  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter((p) => ['pending', 'processing'].includes(p.status))
    .length
  const completedPayments = payments.filter((p) => p.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-muted-foreground">
          View and manage all your payment transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {completedPayments} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verification
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by payment ID, transaction ID, or vehicle..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {payments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">
              {payments.filter((p) => p.status === 'completed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">
              {payments.filter((p) => ['pending', 'processing'].includes(p.status)).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            <Badge variant="secondary" className="ml-2">
              {payments.filter((p) => p.status === 'failed').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Payments Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchQuery
                    ? 'No payments match your search criteria.'
                    : `You don't have any ${activeTab !== 'all' ? activeTab : ''} payments yet.`}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => {
                const statusBadge = getStatusBadge(payment.status)
                const StatusIcon = statusBadge.icon
                const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod)
                const typeBadge = getTypebadge(payment.type)

                return (
                  <Card key={payment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Section - Payment Info */}
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {payment.vehicle.year} {payment.vehicle.make}{' '}
                                  {payment.vehicle.model}
                                </h3>
                                <Badge variant="outline" className={typeBadge.className}>
                                  {typeBadge.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payment.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className={statusBadge.className}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusBadge.label}
                                </Badge>
                                {payment.receiptUploaded && payment.receiptStatus === 'under_review' && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Receipt Under Review
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Payment Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Amount</p>
                              <p className="font-semibold text-lg">
                                {formatCurrency(payment.amount, payment.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                              <div className="flex items-center gap-1.5">
                                <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                                <p className="font-semibold text-sm">{payment.paymentMethod}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                              <p className="font-mono text-xs font-semibold">
                                {payment.transactionId}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Date</p>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="font-semibold text-sm">
                                  {payment.paidAt
                                    ? payment.paidAt.toLocaleDateString('en-AE', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })
                                    : 'Pending'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Failure Reason */}
                          {payment.status === 'failed' && payment.failureReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800">
                                <strong>Reason:</strong> {payment.failureReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex lg:flex-col gap-2 lg:justify-center">
                          <Button asChild variant="outline" className="flex-1 lg:flex-none">
                            <Link href={`/my-account/payments/${payment.id}`}>
                              View Details
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                          {payment.status === 'completed' && (
                            <Button variant="outline" className="flex-1 lg:flex-none">
                              <Download className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Need Help with a Payment?</CardTitle>
          <CardDescription>
            If you have questions about your payment history or need assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1">
              <a href="mailto:finance@georgiausedcars.com">
                <CreditCard className="h-4 w-4 mr-2" />
                Email Finance Team
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="tel:+971555467220">
                <Building2 className="h-4 w-4 mr-2" />
                Call Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
