'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PaymentService, CreatePaymentData } from '@/lib/services/payments'
import { InvoiceService } from '@/lib/services/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Banknote, Calculator } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['AED', 'USD', 'CAD']),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'other']),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId?: string
  initialData?: Partial<PaymentFormData>
  isEdit?: boolean
  paymentId?: string
}

export function PaymentForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  invoiceId,
  initialData,
  isEdit = false,
  paymentId
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Array<{ 
    id: string; 
    invoice_number: string; 
    total_amount: number; 
    balance_due: number; 
    currency: string;
    customers?: { full_name: string };
    vehicles?: { year: number; make: string; model: string };
  }>>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isFullPayment, setIsFullPayment] = useState(false)
  
  const { user } = useAuth()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: invoiceId || '',
      amount: 0,
      currency: 'AED',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      ...initialData
    }
  })

  const watchedInvoiceId = form.watch('invoice_id')
  const watchedAmount = form.watch('amount')

  useEffect(() => {
    if (isOpen) {
      if (invoiceId) {
        loadSingleInvoice(invoiceId)
      } else {
        loadInvoices()
      }
    }
  }, [isOpen, invoiceId])

  useEffect(() => {
    if (watchedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === watchedInvoiceId)
      if (invoice) {
        setSelectedInvoice(invoice)
        form.setValue('currency', invoice.currency as any)
        
        // Auto-set amount to balance due if not already set
        if (form.getValues('amount') === 0) {
          form.setValue('amount', invoice.balance_due)
          setIsFullPayment(true)
        }
      }
    }
  }, [watchedInvoiceId, invoices])

  useEffect(() => {
    if (selectedInvoice) {
      setIsFullPayment(watchedAmount === selectedInvoice.balance_due)
    }
  }, [watchedAmount, selectedInvoice])

  const loadSingleInvoice = async (id: string) => {
    const result = await InvoiceService.getById(id)
    if (result.success && result.data) {
      const invoice = result.data
      setInvoices([{
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        balance_due: invoice.balance_due || invoice.total_amount,
        currency: invoice.currency,
        customers: invoice.customers,
        vehicles: invoice.vehicles
      }])
    }
  }

  const loadInvoices = async () => {
    // Load unpaid and partially paid invoices
    const result = await InvoiceService.getAll({ 
      status: 'sent'
    }, 1, 100)
    
    if (result.success) {
      const unpaidInvoices = (result.data || [])
        .filter(invoice => (invoice.balance_due || invoice.total_amount) > 0)
        .map(invoice => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          balance_due: invoice.balance_due || invoice.total_amount,
          currency: invoice.currency,
          customers: invoice.customers,
          vehicles: invoice.vehicles
        }))
      
      setInvoices(unpaidInvoices)
    }
  }

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'check', label: 'Check', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'credit_card', label: 'Credit Card', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'other', label: 'Other', icon: <CreditCard className="h-4 w-4" /> }
  ]

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED'
    }).format(amount)
  }

  const handleFullPayment = () => {
    if (selectedInvoice) {
      form.setValue('amount', selectedInvoice.balance_due)
      setIsFullPayment(true)
    }
  }

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const paymentData: CreatePaymentData = {
        ...data,
        transaction_id: data.transaction_id || undefined,
        notes: data.notes || undefined
      }

      let result
      if (isEdit && paymentId) {
        result = await PaymentService.update(paymentId, paymentData)
      } else {
        result = await PaymentService.create(paymentData, user.id)
      }

      if (result.success) {
        form.reset()
        onSuccess()
        onClose()
      } else {
        console.error(`Failed to ${isEdit ? 'update' : 'create'} payment:`, result.error)
        alert(`Failed to ${isEdit ? 'update' : 'create'} payment: ` + result.error)
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('An error occurred while creating the payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the payment information and details.'
              : 'Record a payment received from a customer.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Invoice Selection */}
            <FormField
              control={form.control}
              name="invoice_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!invoiceId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice to pay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - {formatPrice(invoice.balance_due, invoice.currency)}
                          {invoice.customers && ` - ${invoice.customers.full_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invoice Details */}
            {selectedInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium">{selectedInvoice.invoice_number}</span>
                  </div>
                  
                  {selectedInvoice.customers && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{selectedInvoice.customers.full_name}</span>
                    </div>
                  )}
                  
                  {selectedInvoice.vehicles && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">
                        {selectedInvoice.vehicles.year} {selectedInvoice.vehicles.make} {selectedInvoice.vehicles.model}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatPrice(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance Due:</span>
                    <span className="font-bold text-red-600">{formatPrice(selectedInvoice.balance_due, selectedInvoice.currency)}</span>
                  </div>
                  
                  {isFullPayment && (
                    <Badge className="bg-green-100 text-green-800">
                      Full Payment
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      {selectedInvoice && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFullPayment}
                          className="w-full"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Pay Full Amount
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedInvoice}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              {method.icon}
                              {method.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Transaction ID */}
            <FormField
              control={form.control}
              name="transaction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID / Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Check number, transfer ID, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter check number, bank transfer reference, or other transaction identifier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this payment..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Validation Warning */}
            {selectedInvoice && watchedAmount > selectedInvoice.balance_due && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Payment amount ({formatPrice(watchedAmount, selectedInvoice.currency)}) exceeds 
                  balance due ({formatPrice(selectedInvoice.balance_due, selectedInvoice.currency)}).
                  This will result in an overpayment.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEdit ? 'Updating...' : 'Recording...'}
                  </>
                ) : (
                  isEdit ? 'Update Payment' : 'Record Payment'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}