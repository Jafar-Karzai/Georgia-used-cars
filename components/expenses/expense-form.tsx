'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ExpenseService, CreateExpenseData } from '@/lib/services/expenses'
import { VehicleService } from '@/lib/services/vehicles'
import { StorageClient } from '@/lib/storage/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { useAuth } from '@/lib/auth/context'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

const expenseSchema = z.object({
  vehicle_id: z.string().optional(),
  category: z.enum(['acquisition', 'transportation', 'import', 'enhancement', 'marketing', 'operational']),
  subcategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'CAD', 'AED']),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vehicleId?: string
  initialData?: Partial<ExpenseFormData>
  isEdit?: boolean
  expenseId?: string
}

export function ExpenseForm({ isOpen, onClose, onSuccess, vehicleId, initialData, isEdit = false, expenseId }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Array<{ id: string; vin: string; year: number; make: string; model: string }>>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const { user } = useAuth()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicle_id: vehicleId || 'none',
      category: 'operational',
      currency: 'AED',
      date: new Date().toISOString().split('T')[0],
      ...initialData
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadVehicles()
    }
  }, [isOpen])

  const loadVehicles = async () => {
    const result = await VehicleService.getAll({}, 1, 100)
    if (result.success) {
      setVehicles(result.data || [])
    }
  }

  const categoryOptions = [
    { value: 'acquisition', label: 'Acquisition', subcategories: ['Final bid', 'Auction fees', 'Late payment', 'Storage fees', 'Gate fees'] },
    { value: 'transportation', label: 'Transportation', subcategories: ['Towing', 'Loading/Unloading', 'Port storage', 'Shipping', 'Insurance'] },
    { value: 'import', label: 'Import', subcategories: ['Customs duty', 'Clearance fees', 'Port handling', 'Local transport', 'Documentation'] },
    { value: 'enhancement', label: 'Enhancement', subcategories: ['Parts', 'Labor', 'Paint/Bodywork', 'Mechanical repair', 'Cleaning', 'Accessories'] },
    { value: 'marketing', label: 'Marketing', subcategories: ['Photography', 'Listing fees', 'Advertising', 'Marketing materials'] },
    { value: 'operational', label: 'Operational', subcategories: ['Rent', 'Utilities', 'Salaries', 'Insurance', 'Software', 'Equipment', 'Office supplies'] }
  ]

  const selectedCategory = categoryOptions.find(cat => cat.value === form.watch('category'))

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB

      if (!isValidType) {
        alert('Please select an image or PDF file')
        return
      }

      if (!isValidSize) {
        alert('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById('receipt') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return

    setLoading(true)
    try {
      let receiptUrl = ''

      // Upload receipt if provided
      if (selectedFile) {
        setUploading(true)
        const tempExpenseId = `temp-${Date.now()}`
        const uploadResult = await StorageClient.uploadReceipt(tempExpenseId, selectedFile)
        
        if (uploadResult.success) {
          receiptUrl = uploadResult.url || ''
        } else {
          console.error('Failed to upload receipt:', uploadResult.error)
        }
        setUploading(false)
      }

      // Create expense
      const expenseData: CreateExpenseData = {
        ...data,
        receipt_url: receiptUrl || undefined,
        vehicle_id: data.vehicle_id === 'none' ? undefined : data.vehicle_id || undefined
      }

      let result
      if (isEdit && expenseId) {
        result = await ExpenseService.update(expenseId, expenseData)
      } else {
        result = await ExpenseService.create(expenseData, user.id)
      }

      if (result.success) {
        form.reset()
        setSelectedFile(null)
        onSuccess()
        onClose()
      } else {
        console.error(`Failed to ${isEdit ? 'update' : 'create'} expense:`, result.error)
        alert(`Failed to ${isEdit ? 'update' : 'create'} expense: ` + result.error)
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('An error occurred while creating the expense')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the expense information and details.'
              : 'Record a new expense for your business operations.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vehicle Selection */}
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle or leave empty for operational expense" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No vehicle (Operational expense)</SelectItem>
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

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory */}
            {selectedCategory && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCategory.subcategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter expense description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Date and Vendor */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="flex-1"
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Supported formats: Images, PDF. Max size: 10MB.
              </p>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this expense"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  isEdit ? 'Update Expense' : 'Create Expense'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}