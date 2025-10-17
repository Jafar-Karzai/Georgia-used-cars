'use client'

import { useRouter } from 'next/navigation'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { Vehicle } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { useEffect } from 'react'

export default function NewVehiclePage() {
  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    if (!user || !hasPermission('manage_vehicles')) {
      router.push('/admin')
    }
  }, [user, hasPermission, router])

  const handleSuccess = (vehicle: Vehicle) => {
    router.push(`/admin/vehicles/${vehicle.id}`)
  }

  const handleCancel = () => {
    router.push('/admin/vehicles')
  }

  if (!user || !hasPermission('manage_vehicles')) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <VehicleForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}