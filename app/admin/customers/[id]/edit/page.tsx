'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/customers/customer-form'
import { CustomerService } from '@/lib/services/customers'
import { Customer } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditCustomerPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCustomerPage({ params: paramsPromise }: EditCustomerPageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [params, setParams] = useState<{ id: string } | null>(null)

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manage_customers')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadCustomer()
    }
  }, [user, hasPermission, router, params?.id])

  useEffect(() => {
    if (customer) {
      setIsFormOpen(true)
    }
  }, [customer])

  const loadCustomer = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await CustomerService.getById(params.id)
      
      if (result.success && result.data) {
        setCustomer(result.data)
      } else {
        setError(result.error || 'Customer not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/admin/customers')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    router.push('/admin/customers')
  }

  if (!user || !hasPermission('manage_customers')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading customer...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested customer could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/customers')}
              className="text-primary hover:underline"
            >
              Return to Customer List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <CustomerForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialData={customer}
        isEdit={true}
        customerId={customer.id}
      />
    </div>
  )
}