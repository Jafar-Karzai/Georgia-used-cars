'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { InquiryService, CreateInquiryData } from '@/lib/services/inquiries'
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
import { Loader2, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

const inquirySchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().optional(),
  source: z.enum(['website', 'phone', 'email', 'social_media', 'referral', 'walk_in']),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type InquiryFormData = z.infer<typeof inquirySchema>

interface InquiryFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId?: string
  vehicleId?: string
  initialData?: Partial<InquiryFormData>
  isEdit?: boolean
  inquiryId?: string
}

export function InquiryForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  customerId,
  vehicleId,
  initialData,
  isEdit = false,
  inquiryId
}: InquiryFormProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string; email?: string; phone?: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; year: number; make: string; model: string; vin: string }>>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  
  const { user } = useAuth()

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      customer_id: customerId || '',
      vehicle_id: vehicleId || '',
      source: 'website',
      priority: 'medium',
      ...initialData
    }
  })

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

  const loadVehicles = async () => {
    const result = await VehicleService.getAll({}, 1, 100)
    if (result.success) {
      setVehicles(result.data || [])
    }
  }

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

  const handleCustomerSearch = async () => {
    if (customerSearch) {
      await loadCustomers(customerSearch)
    } else {
      await loadCustomers()
    }
  }

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'referral', label: 'Referral' },
    { value: 'walk_in', label: 'Walk-in' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ]

  const onSubmit = async (data: InquiryFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const inquiryData: CreateInquiryData = {
        ...data,
        vehicle_id: data.vehicle_id === 'none' ? undefined : data.vehicle_id || undefined
      }

      let result
      if (isEdit && inquiryId) {
        result = await InquiryService.update(inquiryId, inquiryData)
      } else {
        result = await InquiryService.create(inquiryData)
      }

      if (result.success) {
        form.reset()
        onSuccess()
        onClose()
      } else {
        console.error(`Failed to ${isEdit ? 'update' : 'create'} inquiry:`, result.error)
        alert(`Failed to ${isEdit ? 'update' : 'create'} inquiry: ` + result.error)
      }
    } catch (error) {
      console.error('Error creating inquiry:', error)
      alert('An error occurred while creating the inquiry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Inquiry' : 'Create New Inquiry'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the inquiry information and details.'
              : 'Log a new customer inquiry for tracking and follow-up.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Selection */}
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
                          {customer.phone && ` - ${customer.phone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Selection */}
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!vehicleId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle or leave empty for general inquiry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific vehicle</SelectItem>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.vin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <span className={priority.color}>{priority.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter inquiry subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter customer's inquiry details..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include all relevant details from the customer's inquiry
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  isEdit ? 'Update Inquiry' : 'Create Inquiry'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}