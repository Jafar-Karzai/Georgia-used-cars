'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  CreditCard,
  Building2,
  Wallet,
  MapPin,
  Mail,
  Phone,
  Download,
  Upload,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Info,
} from 'lucide-react'

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string
  const [copied, setCopied] = useState('')
  const [uploading, setUploading] = useState(false)

  // Mock reservation data
  const reservation = {
    id: reservationId,
    vehicle: {
      year: 2021,
      make: 'Toyota',
      model: 'Camry',
      trim: 'XLE',
      vin: '4T1BF1FK5CU123456',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop&sat=-100',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop&sat=100',
      ],
    },
    depositPaid: 2500,
    totalPrice: 50000,
    remainingBalance: 47500,
    currency: 'AED',
    status: 'awaiting_balance',
    paymentMethod: null, // Will be set after balance payment
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    depositPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    transactionId: 'TXN-2024-001234',
  }

  // Mock bank details
  const bankDetails = {
    bankName: 'Emirates NBD',
    accountName: 'Georgia Used Cars LLC',
    accountNumber: '1234567890123',
    iban: 'AE070331234567890123456',
    swiftCode: 'EBILAEAD',
    branch: 'Sharjah Main Branch',
    currency: 'AED',
  }

  // Mock showroom details
  const showroomDetails = {
    name: 'Georgia Used Cars Showroom',
    address: 'Industrial Area 13, Sharjah, UAE',
    phone: '+971 55 546 7220',
    email: 'info@georgiausedcars.com',
    financeEmail: 'finance@georgiausedcars.com',
    hours: 'Sunday - Thursday: 9:00 AM - 6:00 PM\nFriday - Saturday: 10:00 AM - 4:00 PM',
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDaysRemaining = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      deposit_paid: { label: 'Deposit Paid', className: 'bg-blue-100 text-blue-800' },
      awaiting_balance: { label: 'Payment Pending', className: 'bg-amber-100 text-amber-800' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
      expired: { label: 'Expired', className: 'bg-red-100 text-red-800' },
    }
    return statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Mock upload
    setTimeout(() => {
      setUploading(false)
      alert('Receipt uploaded successfully! Our team will review it shortly.')
    }, 1500)
  }

  const daysRemaining = getDaysRemaining(reservation.expiresAt)
  const isUrgent = daysRemaining <= 3
  const statusBadge = getStatusBadge(reservation.status)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link href="/my-account/reservations">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reservations
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {reservation.vehicle.year} {reservation.vehicle.make} {reservation.vehicle.model}
            </h1>
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </div>
          {reservation.vehicle.trim && (
            <p className="text-muted-foreground mb-2">{reservation.vehicle.trim}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Reservation ID: {reservation.id} • Transaction ID: {reservation.transactionId}
          </p>
        </div>
      </div>

      {/* Urgency Alert */}
      {isUrgent && reservation.status !== 'completed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> Your reservation expires in {daysRemaining}{' '}
            {daysRemaining === 1 ? 'day' : 'days'}! Please complete the remaining payment to avoid
            losing your reservation.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message for Completed */}
      {reservation.status === 'completed' && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>Congratulations!</strong> Your vehicle purchase is complete. We'll contact you
            shortly to arrange delivery.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Payment Summary & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Vehicle Price</span>
                  <span className="font-semibold">
                    {formatCurrency(reservation.totalPrice, reservation.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Deposit Paid (5%)</span>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(reservation.depositPaid, reservation.currency)}
                  </span>
                </div>
                {reservation.depositPaidAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Paid on {reservation.depositPaidAt.toLocaleDateString('en-AE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Remaining Balance (95%)</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(reservation.remainingBalance, reservation.currency)}
                  </span>
                </div>
              </div>

              {reservation.status !== 'completed' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Payment Deadline</p>
                      <p className="text-sm">
                        {reservation.expiresAt.toLocaleDateString('en-AE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        ({daysRemaining} days remaining)
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Payment Instructions Tabs */}
          {reservation.status !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
                <CardDescription>
                  Choose your preferred method to pay the remaining balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bank" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                    <TabsTrigger value="cash">Cash Deposit</TabsTrigger>
                    <TabsTrigger value="showroom">Showroom Visit</TabsTrigger>
                  </TabsList>

                  {/* Bank Transfer */}
                  <TabsContent value="bank" className="space-y-4 mt-4">
                    <Alert>
                      <Building2 className="h-4 w-4" />
                      <AlertDescription>
                        Transfer the remaining balance to our bank account. Don't forget to include
                        your reservation ID in the transfer description.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                          <p className="font-semibold">{bankDetails.bankName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Branch</p>
                          <p className="font-semibold">{bankDetails.branch}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Account Name</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                          >
                            {copied === 'accountName' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="font-semibold">{bankDetails.accountName}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">IBAN</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bankDetails.iban, 'iban')}
                          >
                            {copied === 'iban' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="font-mono font-semibold text-sm">{bankDetails.iban}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">Account Number</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(bankDetails.accountNumber, 'accountNumber')
                              }
                            >
                              {copied === 'accountNumber' ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <p className="font-mono font-semibold text-sm">
                            {bankDetails.accountNumber}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">SWIFT Code</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(bankDetails.swiftCode, 'swift')}
                            >
                              {copied === 'swift' ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <p className="font-mono font-semibold text-sm">{bankDetails.swiftCode}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transfer Amount</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(reservation.remainingBalance, reservation.currency)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">
                            Transfer Description (Important!)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `Reservation ${reservation.id}`,
                                'description'
                              )
                            }
                          >
                            {copied === 'description' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="font-mono font-semibold">Reservation {reservation.id}</p>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">After making the transfer:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Take a screenshot or photo of the transfer receipt</li>
                          <li>Upload it using the "Upload Receipt" section below</li>
                          <li>Our team will verify and confirm your payment within 24 hours</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  {/* Cash Deposit */}
                  <TabsContent value="cash" className="space-y-4 mt-4">
                    <Alert>
                      <Wallet className="h-4 w-4" />
                      <AlertDescription>
                        Deposit cash directly to our bank account using CDM (Cash Deposit Machine)
                        at any {bankDetails.bankName} branch.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold">Step-by-Step Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Locate the nearest {bankDetails.bankName} CDM machine</li>
                          <li>Select "Deposit" option on the machine</li>
                          <li>
                            Enter account number: <strong>{bankDetails.accountNumber}</strong>
                          </li>
                          <li>
                            Deposit amount:{' '}
                            <strong>
                              {formatCurrency(reservation.remainingBalance, reservation.currency)}
                            </strong>
                          </li>
                          <li>Collect the printed receipt</li>
                          <li>Upload the receipt below or email to {showroomDetails.financeEmail}</li>
                        </ol>
                      </div>

                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Keep your cash deposit receipt safe. You'll
                          need it to confirm your payment.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>

                  {/* Showroom Visit */}
                  <TabsContent value="showroom" className="space-y-4 mt-4">
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Visit our showroom in person to complete your payment in cash or by card.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                      <div>
                        <h4 className="font-semibold mb-2">{showroomDetails.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{showroomDetails.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${showroomDetails.phone}`} className="text-primary hover:underline">
                              {showroomDetails.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${showroomDetails.email}`}
                              className="text-primary hover:underline"
                            >
                              {showroomDetails.email}
                            </a>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="whitespace-pre-line">{showroomDetails.hours}</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="font-semibold text-sm">What to bring:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Your Emirates ID</li>
                          <li>Reservation ID: {reservation.id}</li>
                          <li>Payment amount: {formatCurrency(reservation.remainingBalance, reservation.currency)}</li>
                        </ul>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          We recommend calling ahead to ensure availability and to schedule your
                          visit.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Upload Receipt Section */}
          {reservation.status !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Receipt</CardTitle>
                <CardDescription>
                  Once you've made the payment, upload your receipt here for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload bank transfer receipt, cash deposit slip, or payment confirmation
                  </p>
                  <input
                    type="file"
                    id="receipt-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                  <Button asChild variant="outline" disabled={uploading}>
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </label>
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>
                    Or email your receipt to{' '}
                    <a
                      href={`mailto:${showroomDetails.financeEmail}?subject=Payment Receipt - Reservation ${reservation.id}`}
                      className="text-primary hover:underline"
                    >
                      {showroomDetails.financeEmail}
                    </a>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Vehicle Info & Actions */}
        <div className="space-y-6">
          {/* Vehicle Image */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              <img
                src={reservation.vehicle.image}
                alt={`${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-mono font-semibold">{reservation.vehicle.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reserved On</span>
                  <span className="font-semibold">
                    {reservation.createdAt.toLocaleDateString('en-AE', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full">
                <Link href={`/inventory/${reservation.id}`}>View Vehicle Details</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Our team is here to assist you with your reservation and payment.
              </p>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`tel:${showroomDetails.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`mailto:${showroomDetails.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Us
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/contact">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Download Invoice */}
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Reservation Summary
          </Button>
        </div>
      </div>
    </div>
  )
}
