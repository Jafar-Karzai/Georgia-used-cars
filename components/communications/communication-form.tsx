'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CommunicationService, CreateCommunicationData } from '@/lib/services/communications'
import { CustomerService } from '@/lib/services/customers'
import { InquiryService } from '@/lib/services/inquiries'
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

const communicationSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  inquiry_id: z.string().optional(),
  type: z.enum(['email', 'phone', 'sms', 'whatsapp', 'meeting', 'note']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  scheduled_at: z.string().optional(),
})

type CommunicationFormData = z.infer<typeof communicationSchema>

interface CommunicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId?: string
  inquiryId?: string
  initialData?: Partial<CommunicationFormData>
}

export function CommunicationForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  customerId,
  inquiryId,
  initialData 
}: CommunicationFormProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string; email?: string; phone?: string }>>([])
  const [inquiries, setInquiries] = useState<Array<{ id: string; subject: string; status: string }>>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  
  const { user } = useAuth()

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      customer_id: customerId || '',
      inquiry_id: inquiryId || '',
      type: 'note',
      direction: 'outbound',
      ...initialData
    }
  })

  const watchedCustomerId = form.watch('customer_id')
  const watchedType = form.watch('type')

  useEffect(() => {
    if (isOpen) {
      if (customerId) {
        loadSingleCustomer(customerId)
      } else {
        loadCustomers()
      }
    }
  }, [isOpen, customerId])

  useEffect(() => {
    if (watchedCustomerId && watchedCustomerId !== customerId) {
      loadCustomerInquiries(watchedCustomerId)
    }
  }, [watchedCustomerId])

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
    
    if (!inquiryId) {
      loadCustomerInquiries(id)
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

  const loadCustomerInquiries = async (customerId: string) => {
    const result = await InquiryService.getByCustomer(customerId)
    if (result.success) {
      setInquiries(result.data || [])
    }
  }

  const handleCustomerSearch = async () => {
    if (customerSearch) {
      await loadCustomers(customerSearch)
    } else {
      await loadCustomers()
    }
  }

  const typeOptions = [
    { value: 'email', label: 'Email', needsSubject: true },
    { value: 'phone', label: 'Phone Call', needsSubject: false },
    { value: 'sms', label: 'SMS', needsSubject: false },
    { value: 'whatsapp', label: 'WhatsApp', needsSubject: false },
    { value: 'meeting', label: 'Meeting/Appointment', needsSubject: false },
    { value: 'note', label: 'Internal Note', needsSubject: false }
  ]

  const directionOptions = [
    { value: 'inbound', label: 'Inbound (From Customer)' },
    { value: 'outbound', label: 'Outbound (To Customer)' }
  ]

  const selectedType = typeOptions.find(t => t.value === watchedType)
  const needsSubject = selectedType?.needsSubject || false

  const onSubmit = async (data: CommunicationFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const communicationData: CreateCommunicationData = {
        ...data,
        inquiry_id: data.inquiry_id || undefined,
        subject: needsSubject ? data.subject : undefined,
        handled_by: user.id,
        scheduled_at: data.scheduled_at || undefined
      }

      const result = await CommunicationService.create(communicationData)

      if (result.success) {
        form.reset()
        onSuccess()
        onClose()
      } else {
        console.error('Failed to create communication:', result.error)
        alert('Failed to create communication: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating communication:', error)
      alert('An error occurred while creating the communication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
          <DialogDescription>
            Record a communication with a customer for tracking and follow-up.
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

            {/* Related Inquiry */}
            <FormField
              control={form.control}
              name="inquiry_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Inquiry (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!inquiryId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select related inquiry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No related inquiry</SelectItem>
                      {inquiries.map((inquiry) => (
                        <SelectItem key={inquiry.id} value={inquiry.id}>
                          {inquiry.subject} - {inquiry.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Direction */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {directionOptions.map((direction) => (
                          <SelectItem key={direction.value} value={direction.value}>
                            {direction.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject (conditional) */}
            {needsSubject && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Scheduled Date (for meetings) */}
            {watchedType === 'meeting' && (
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      When is this meeting scheduled?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedType === 'note' ? 'Note Content' : 'Message Content'} *
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        watchedType === 'note' 
                          ? "Enter internal notes..."
                          : "Enter communication details..."
                      }
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {watchedType === 'note' 
                      ? 'Internal notes are only visible to team members'
                      : 'Record the details of this communication'
                    }
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
                    Saving...
                  </>
                ) : (
                  'Save Communication'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}