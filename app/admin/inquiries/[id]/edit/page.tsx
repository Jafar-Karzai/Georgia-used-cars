'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { InquiryForm } from '@/components/inquiries/inquiry-form'
import { InquiryService } from '@/lib/services/inquiries'
import { Inquiry } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditInquiryPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditInquiryPage({ params: paramsPromise }: EditInquiryPageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manage_inquiries')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadInquiry()
    }
  }, [user, hasPermission, router, params?.id])

  useEffect(() => {
    if (inquiry) {
      setIsFormOpen(true)
    }
  }, [inquiry])

  const loadInquiry = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await InquiryService.getById(params?.id || '')
      
      if (result.success && result.data) {
        setInquiry(result.data as unknown as Inquiry)
      } else {
        setError(result.error || 'Inquiry not found')
      }
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Failed to load inquiry')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/admin/inquiries')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    router.push('/admin/inquiries')
  }

  if (!user || !hasPermission('manage_inquiries')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading inquiry...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !inquiry) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Inquiry Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested inquiry could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/inquiries')}
              className="text-primary hover:underline"
            >
              Return to Inquiry List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <InquiryForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialData={{
          customer_id: inquiry.customer_id || '',
          vehicle_id: inquiry.vehicle_id || '',
          source: inquiry.source,
          subject: inquiry.subject || '' || '',
          message: inquiry.message || '' || '',
          priority: inquiry.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
        }}
        isEdit={true}
        inquiryId={inquiry.id}
      />
    </div>
  )
}