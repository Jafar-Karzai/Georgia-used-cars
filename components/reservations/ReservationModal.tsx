'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Car,
  Wallet,
  Calendar,
} from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  salePrice: number
  saleCurrency: string
  vehiclePhotos?: { url: string; is_primary: boolean }[]
}

interface ReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle
  isAuthenticated?: boolean // Mock: will be true/false based on auth state
}

export function ReservationModal({
  open,
  onOpenChange,
  vehicle,
  isAuthenticated = false,
}: ReservationModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'confirm' | 'payment' | 'processing' | 'success'>('confirm')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Mock payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardName, setCardName] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (open && !isAuthenticated) {
      onOpenChange(false)
      router.push(`/auth/register?redirect=/inventory/${vehicle.id}&action=reserve`)
    }
  }, [open, isAuthenticated, vehicle.id, router, onOpenChange])

  // Don't render modal if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const totalPrice = vehicle.salePrice
  const depositPercentage = 5
  const depositAmount = (totalPrice * depositPercentage) / 100
  const remainingAmount = totalPrice - depositAmount

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16)
    setCardNumber(formatCardNumber(cleaned))
  }

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    if (cleaned.length >= 2) {
      setCardExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2))
    } else {
      setCardExpiry(cleaned)
    }
  }

  const handleCvcChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 3)
    setCardCvc(cleaned)
  }

  const handleConfirm = () => {
    if (!acceptedTerms) {
      setPaymentError('Please accept the terms and conditions to continue')
      return
    }
    setPaymentError(null)
    setStep('payment')
  }

  const handlePayment = async () => {
    // Validate payment fields
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      setPaymentError('Please fill in all payment details')
      return
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setPaymentError('Please enter a valid card number')
      return
    }

    setPaymentError(null)
    setStep('processing')

    // Mock payment processing
    setTimeout(() => {
      setStep('success')
    }, 2000)
  }

  const handleSuccess = () => {
    // Mock: Navigate to reservation details page
    router.push(`/my-account/reservations/mock-reservation-id`)
    onOpenChange(false)
  }

  const primaryPhoto = vehicle.vehiclePhotos?.find((p) => p.is_primary)?.url || '/placeholder-car.jpg'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 'success' ? 'Reservation Confirmed!' : 'Reserve Your Vehicle'}
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' && 'Review your reservation details and proceed to payment'}
            {step === 'payment' && 'Secure payment for your reservation deposit'}
            {step === 'processing' && 'Processing your payment...'}
            {step === 'success' && 'Your reservation has been successfully completed'}
          </DialogDescription>
        </DialogHeader>

        {/* Confirm Step */}
        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Vehicle Summary */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={primaryPhoto}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.trim && <p className="text-sm text-muted-foreground">{vehicle.trim}</p>}
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatCurrency(totalPrice, vehicle.saleCurrency)}
                </p>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payment Breakdown
              </h4>
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Vehicle Price</span>
                  <span className="font-medium">
                    {formatCurrency(totalPrice, vehicle.saleCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-emerald-600 font-medium">
                    Reservation Deposit ({depositPercentage}%)
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(depositAmount, vehicle.saleCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Balance</span>
                  <span className="font-medium">
                    {formatCurrency(remainingAmount, vehicle.saleCurrency)}
                  </span>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You'll pay <strong>{formatCurrency(depositAmount, vehicle.saleCurrency)}</strong>{' '}
                  now to reserve this vehicle. The remaining balance can be paid via bank transfer,
                  cash deposit, or in-person at our showroom.
                </AlertDescription>
              </Alert>
            </div>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                What Happens Next?
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Pay {depositPercentage}% reservation deposit securely online</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>
                    Receive payment instructions for the remaining balance via email and your
                    dashboard
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>
                    Complete payment within 7 days via bank transfer, cash deposit, or showroom
                    visit
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Upload payment receipt to finalize your purchase</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-5 cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms and Conditions
                  </a>{' '}
                  and understand that my reservation will expire in 7 days if the remaining balance
                  is not paid. The deposit is non-refundable.
                </Label>
              </div>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={!acceptedTerms}>
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="space-y-6">
            {/* Payment Amount */}
            <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Reservation Deposit</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(depositAmount, vehicle.saleCurrency)}
              </p>
            </div>

            {/* Mock Payment Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Secure payment powered by Stripe</span>
              </div>

              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    maxLength={19}
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cardCvc">CVC</Label>
                  <Input
                    id="cardCvc"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => handleCvcChange(e.target.value)}
                    maxLength={3}
                    type="password"
                  />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your payment information is encrypted and secure. We never store your card details.
                </AlertDescription>
              </Alert>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('confirm')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handlePayment}>
                <Lock className="h-4 w-4 mr-2" />
                Pay {formatCurrency(depositAmount, vehicle.saleCurrency)}
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-xl font-semibold">Processing Payment...</h3>
            <p className="text-muted-foreground">Please wait while we process your payment</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-100 p-4">
                <CheckCircle className="h-16 w-16 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Reservation Confirmed!</h3>
              <p className="text-muted-foreground">
                Your {vehicle.year} {vehicle.make} {vehicle.model} has been reserved successfully.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit Paid</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(depositAmount, vehicle.saleCurrency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-semibold">
                  {formatCurrency(remainingAmount, vehicle.saleCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Deadline</span>
                <span className="font-semibold">
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                We've sent payment instructions to your email. You can also view them anytime in your
                dashboard.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button className="w-full" onClick={handleSuccess}>
                <Car className="h-4 w-4 mr-2" />
                View Reservation Details
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/inventory')}>
                Browse More Vehicles
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
