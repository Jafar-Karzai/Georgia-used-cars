'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentForm } from '@/components/payments/payment-form'
import { PaymentService } from '@/lib/services/payments'
import { Payment } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditPaymentPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPaymentPage({ params: paramsPromise }: EditPaymentPageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manage_payments')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadPayment()
    }
  }, [user, hasPermission, router, params?.id])

  useEffect(() => {
    if (payment) {
      setIsFormOpen(true)
    }
  }, [payment])

  const loadPayment = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await PaymentService.getById(params.id)
      
      if (result.success && result.data) {
        setPayment(result.data)
      } else {
        setError(result.error || 'Payment not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/admin/payments')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    router.push('/admin/payments')
  }

  if (!user || !hasPermission('manage_payments')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading payment...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Payment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested payment could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/payments')}
              className="text-primary hover:underline"
            >
              Return to Payment List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <PaymentForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialData={{
          customer_id: payment.customer_id || '',
          invoiceId: payment.invoice_id || '',
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.payment_method,
          paymentDate: payment.payment_date,
          referenceNumber: payment.reference_number || '',
          status: payment.status,
          notes: payment.notes || ''
        }}
        isEdit={true}
        paymentId={payment.id}
      />
    </div>
  )
}