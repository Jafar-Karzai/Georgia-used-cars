'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { InvoiceService, CreateInvoiceData, InvoiceLineItem } from '@/lib/services/invoices'
import { CustomerService } from '@/lib/services/customers'
import { VehicleService } from '@/lib/services/vehicles'
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
import { Loader2, Search, Plus, Trash2, Calculator } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be 0 or greater'),
  total: z.number().min(0, 'Total must be 0 or greater'),
})

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  currency: z.enum(['AED', 'USD', 'CAD']),
  due_date: z.string().min(1, 'Due date is required'),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  vat_rate: z.number().min(0).max(100),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId?: string
  vehicleId?: string
  initialData?: Partial<InvoiceFormData>
  isEdit?: boolean
  invoiceId?: string
}

export function InvoiceForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  customerId,
  vehicleId,
  initialData,
  isEdit = false,
  invoiceId
}: InvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string; email?: string; phone?: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; year: number; make: string; model: string; vin: string; sale_price?: number }>>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  
  const { user } = useAuth()

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: customerId || '',
      vehicle_id: vehicleId || '',
      line_items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      currency: 'AED',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      payment_terms: 'Net 30 days',
      vat_rate: 5, // UAE VAT rate
      ...initialData
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items'
  })

  const watchedLineItems = form.watch('line_items')
  const watchedCurrency = form.watch('currency')
  const watchedVatRate = form.watch('vat_rate')
  const watchedVehicleId = form.watch('vehicle_id')

  useEffect(() => {
    if (isOpen) {
      loadVehicles()
      if (customerId) {
        loadSingleCustomer(customerId)
      } else {
        loadCustomers()
      }
    }
  }, [isOpen, customerId])

  useEffect(() => {
    // Auto-update VAT rate based on currency
    if (watchedCurrency === 'AED') {
      form.setValue('vat_rate', 5)
    } else {
      form.setValue('vat_rate', 0)
    }
  }, [watchedCurrency])

  useEffect(() => {
    // Auto-populate from vehicle if selected
    if (watchedVehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === watchedVehicleId)
      if (selectedVehicle && selectedVehicle.sale_price) {
        const currentItems = form.getValues('line_items')
        const vehicleItemExists = currentItems.some(item => 
          item.description.includes(selectedVehicle.vin)
        )
        
        if (!vehicleItemExists) {
          form.setValue('line_items', [
            {
              description: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} - VIN: ${selectedVehicle.vin}`,
              quantity: 1,
              unit_price: selectedVehicle.sale_price,
              total: selectedVehicle.sale_price
            },
            ...currentItems.filter(item => item.description.trim() !== '')
          ])
        }
      }
    }
  }, [watchedVehicleId, vehicles])

  const loadSingleCustomer = async (id: string) => {
    const result = await CustomerService.getById(id)
    if (result.success && result.data) {
      setCustomers([{
        id: result.data.id,
        full_name: result.data.full_name,
        email: result.data.email,
        phone: result.data.phone
      }])
    }
  }

  const loadCustomers = async (search?: string) => {
    setLoadingCustomers(true)
    
    if (search) {
      const result = await CustomerService.search(search)
      if (result.success) {
        setCustomers(result.data || [])
      }
    } else {
      const result = await CustomerService.getAll({}, 1, 50)
      if (result.success) {
        setCustomers((result.data || []).map(c => ({
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone
        })))
      }
    }
    
    setLoadingCustomers(false)
  }

  const loadVehicles = async () => {
    const result = await VehicleService.getAll({ status: 'available' }, 1, 100)
    if (result.success) {
      setVehicles(result.data || [])
    }
  }

  const handleCustomerSearch = async () => {
    if (customerSearch) {
      await loadCustomers(customerSearch)
    } else {
      await loadCustomers()
    }
  }

  const calculateLineTotal = (index: number) => {
    const quantity = form.getValues(`line_items.${index}.quantity`)
    const unitPrice = form.getValues(`line_items.${index}.unit_price`)
    const total = quantity * unitPrice
    form.setValue(`line_items.${index}.total`, Math.round(total * 100) / 100)
  }

  const calculateTotals = () => {
    const subtotal = watchedLineItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const vatAmount = (subtotal * watchedVatRate) / 100
    const total = subtotal + vatAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  const totals = calculateTotals()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: watchedCurrency || 'AED'
    }).format(amount)
  }

  const onSubmit = async (data: InvoiceFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const invoiceData: CreateInvoiceData = {
        ...data,
        vehicle_id: data.vehicle_id || undefined,
        subtotal: totals.subtotal,
        vat_amount: totals.vatAmount,
        total_amount: totals.total
      }

      let result
      if (isEdit && invoiceId) {
        result = await InvoiceService.update(invoiceId, invoiceData)
      } else {
        result = await InvoiceService.create(invoiceData, user.id)
      }

      if (result.success) {
        form.reset()
        onSuccess()
        onClose()
      } else {
        console.error('Failed to create invoice:', result.error)
        alert('Failed to save invoice: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('An error occurred while saving the invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update invoice information'
              : 'Generate an invoice for a customer purchase.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer and Vehicle Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                        className="flex-1"
                        disabled={!!customerId}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCustomerSearch}
                        disabled={loadingCustomers || !!customerId}
                      >
                        {loadingCustomers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!customerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name}
                            {customer.email && ` - ${customer.email}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!vehicleId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific vehicle</SelectItem>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.vin}
                            {vehicle.sale_price && ` (${formatPrice(vehicle.sale_price)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Currency, VAT Rate, and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vat_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="5" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      UAE VAT rate is 5%
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: '', quantity: 1, unit_price: 0, total: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Description</FormLabel>}
                            <FormControl>
                              <Input placeholder="Item description" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Qty</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="1" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0)
                                  calculateLineTotal(index)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Unit Price</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0)
                                  calculateLineTotal(index)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.total`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Total</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field}
                                readOnly
                                className="bg-gray-50"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1">
                      {index === 0 && <div className="text-sm font-medium mb-2">Action</div>}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Totals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({watchedVatRate}%):</span>
                    <span className="font-medium">{formatPrice(totals.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input placeholder="Net 30 days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes or terms..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEdit ? 'Update Invoice' : 'Create Invoice'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}