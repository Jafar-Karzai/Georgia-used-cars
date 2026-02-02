'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Download,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Wallet,
  FileText,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Info,
  Receipt,
  Car,
} from 'lucide-react'

export default function PaymentDetailsPage() {
  const params = useParams()
  const paymentId = params.id as string

  // Mock payment data (in real app, fetch based on paymentId)
  const payment = {
    id: paymentId,
    reservationId: '2021-Camry-XLE-id',
    vehicle: {
      year: 2021,
      make: 'Toyota',
      model: 'Camry',
      trim: 'XLE',
      vin: '4T1BF1FK5CU123456',
      image:
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    },
    type: 'deposit',
    amount: 2500,
    currency: 'AED',
    paymentMethod: 'Credit Card',
    cardLast4: '4242',
    cardBrand: 'Visa',
    status: 'completed',
    transactionId: 'TXN-2024-001234',
    stripePaymentId: 'pi_3AbCdEfGhIjKlMnO',
    description: 'Reservation Deposit (5%)',
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000),
    billingDetails: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+971 50 123 4567',
      address: 'Dubai, UAE',
    },
    receiptUrl: '/receipts/PAY-001234.pdf',
    receiptNumber: 'RCP-2024-001234',
  }

  // Mock showroom details
  const showroomDetails = {
    name: 'Georgia Used Cars',
    address: 'Industrial Area 13, Sharjah, UAE',
    phone: '+971 55 546 7220',
    email: 'info@georgiausedcars.com',
    financeEmail: 'finance@georgiausedcars.com',
  }

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

  const getTypeDetails = (type: string) => {
    return type === 'deposit'
      ? {
          label: 'Deposit Payment',
          badge: 'Deposit (5%)',
          className: 'bg-blue-100 text-blue-800',
        }
      : {
          label: 'Balance Payment',
          badge: 'Balance (95%)',
          className: 'bg-purple-100 text-purple-800',
        }
  }

  const statusBadge = getStatusBadge(payment.status)
  const StatusIcon = statusBadge.icon
  const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod)
  const typeDetails = getTypeDetails(payment.type)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link href="/my-account/payments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Payment Details</h1>
            <Badge variant="outline" className={statusBadge.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusBadge.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Payment ID: {payment.id} • Transaction ID: {payment.transactionId}
          </p>
        </div>
        {payment.status === 'completed' && (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}
      </div>

      {/* Success Alert */}
      {payment.status === 'completed' && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>Payment Successful!</strong> Your payment has been processed and confirmed.
            {payment.type === 'deposit' &&
              ' Your vehicle reservation is now active.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Transaction and payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="bg-muted/30 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Amount Paid</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                <Badge variant="outline" className={`${typeDetails.className} mt-3`}>
                  {typeDetails.badge}
                </Badge>
              </div>

              <Separator />

              {/* Payment Details Grid */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{payment.paymentMethod}</p>
                    </div>
                    {payment.cardLast4 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.cardBrand} ending in {payment.cardLast4}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className={statusBadge.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold text-sm">
                        {payment.paidAt.toLocaleDateString('en-AE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {payment.paidAt.toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Processed At</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold text-sm">
                        {payment.processedAt.toLocaleTimeString('en-AE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm font-semibold">{payment.transactionId}</p>
                  </div>
                  {payment.stripePaymentId && (
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Stripe Payment ID</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {payment.stripePaymentId}
                      </p>
                    </div>
                  )}
                  {payment.receiptNumber && (
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Receipt Number</p>
                      <p className="font-mono text-sm font-semibold">{payment.receiptNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-semibold">{payment.billingDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold text-sm">{payment.billingDetails.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold text-sm">{payment.billingDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-semibold text-sm">{payment.billingDetails.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Related Vehicle</CardTitle>
              <CardDescription>Vehicle associated with this payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={payment.vehicle.image}
                    alt={`${payment.vehicle.year} ${payment.vehicle.make} ${payment.vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {payment.vehicle.year} {payment.vehicle.make} {payment.vehicle.model}
                    </h4>
                    {payment.vehicle.trim && (
                      <p className="text-sm text-muted-foreground">{payment.vehicle.trim}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">VIN: </span>
                      <span className="font-mono font-semibold">{payment.vehicle.vin}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/my-account/reservations/${payment.reservationId}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Reservation
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/inventory/${payment.reservationId}`}>
                        <Car className="h-4 w-4 mr-2" />
                        View Vehicle
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold">Payment Initiated</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paidAt.toLocaleString('en-AE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold">Payment Processed</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.processedAt.toLocaleString('en-AE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Payment Confirmed</p>
                    <p className="text-sm text-muted-foreground">
                      Transaction completed successfully
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Help */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.status === 'completed' && (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Receipt
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="h-4 w-4 mr-2" />
                    Email Receipt
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Have questions about this payment? Contact our finance team.
              </p>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`tel:${showroomDetails.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`mailto:${showroomDetails.financeEmail}?subject=Payment ${payment.id}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Finance
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Security Info */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-blue-900">Secure Payment</p>
                  <p className="text-xs text-blue-800">
                    All payments are processed securely using industry-standard encryption. Your
                    payment information is never stored on our servers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
