'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { InvoiceService } from '@/lib/services/invoices'
import { Invoice } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditInvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditInvoicePage({ params: paramsPromise }: EditInvoicePageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manageInvoices')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadInvoice()
    }
  }, [user, hasPermission, router, params?.id])

  useEffect(() => {
    if (invoice) {
      setIsFormOpen(true)
    }
  }, [invoice])

  const loadInvoice = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await InvoiceService.getById(params?.id || '')
      
      if (result.success && result.data) {
        setInvoice(result.data as unknown as Invoice)
      } else {
        setError(result.error || 'Invoice not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/admin/invoices')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    router.push('/admin/invoices')
  }

  if (!user || !hasPermission('manage_invoices')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading invoice...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested invoice could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/invoices')}
              className="text-primary hover:underline"
            >
              Return to Invoice List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <InvoiceForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialData={{
          customer_id: invoice.customer_id,
          vehicle_id: invoice.vehicle_id || '',
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.created_at,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          vat_rate: invoice.vat_rate || 0,
          vat_amount: invoice.vat_amount || 0,
          total_amount: invoice.total_amount,
          currency: invoice.currency,
          status: invoice.status,
          terms: invoice.terms || '',
          notes: invoice.notes || ''
        }}
        isEdit={true}
        invoiceId={invoice.id}
      />
    </div>
  )
}