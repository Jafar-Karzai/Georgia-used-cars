'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { fetchVehicleById } from '@/lib/api/vehicles-client'
import { Vehicle } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditVehiclePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditVehiclePage({ params: paramsPromise }: EditVehiclePageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manage_vehicles')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadVehicle()
    }
  }, [user, hasPermission, router, params?.id])

  const loadVehicle = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await fetchVehicleById(params.id)
      if (result.success && result.data) setVehicle(result.data)
      else setError(result.error || 'Vehicle not found')
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (updatedVehicle: Vehicle) => {
    router.push(`/admin/vehicles/${updatedVehicle.id}`)
  }

  const handleCancel = () => {
    router.push(`/admin/vehicles/${params.id}`)
  }

  if (!user || !hasPermission('manage_vehicles')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading vehicle...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested vehicle could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/vehicles')}
              className="text-primary hover:underline"
            >
              Return to Vehicle List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <VehicleForm 
        initialData={vehicle}
        isEdit={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
