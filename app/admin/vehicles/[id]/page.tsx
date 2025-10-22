'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { fetchVehicleById, updateVehicle } from '@/lib/api/vehicles-client'
import { StatusTracker } from '@/components/vehicles/status-tracker'
import { PhotoUpload } from '@/components/vehicles/photo-upload'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Vehicle } from '@/types/database'
import { ArrowLeft, Car, DollarSign, Calendar, MapPin, Wrench, FileText, Plus, Globe, Eye, EyeOff, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

interface VehicleWithDetails extends Vehicle {
  vehicle_photos: Array<{
    id: string
    url: string
    caption?: string
    is_primary: boolean
    sort_order: number
  }>
  vehicle_status_history: Array<{
    id: string
    status: any
    location?: string
    notes?: string
    changed_at: string
    changed_by?: string
    profiles?: { full_name: string }
  }>
  expenses: Array<{
    id: string
    category: string
    description: string
    amount: number
    currency: string
    date: string
  }>
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const vehicleId = params.id as string
  
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)
  
  const { user } = useAuth()

  const loadVehicle = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchVehicleById(vehicleId)
      if (result.success) setVehicle(result.data)
      else console.error('Failed to load vehicle:', result.error)
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => {
    loadVehicle()
  }, [loadVehicle])

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleVisibilityToggle = async (isPublic: boolean) => {
    if (!user || !vehicle) return

    setUpdatingVisibility(true)
    try {
      // Send camelCase field name to match VehicleService.update expectations
      const result = await updateVehicle(vehicle.id, { isPublic })

      if (result.success) {
        setVehicle(prev => prev ? { ...prev, is_public: isPublic } : null)
      } else {
        console.error('Failed to update visibility:', result.error)
        alert('Failed to update website visibility')
      }
    } catch (error) {
      console.error('Error updating visibility:', error)
      alert('An error occurred while updating visibility')
    } finally {
      setUpdatingVisibility(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Vehicle Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The vehicle you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/admin/vehicles">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalExpenses = vehicle.expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/vehicles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim && ` ${vehicle.trim}`}
          </h1>
          <p className="text-muted-foreground font-mono">VIN: {vehicle.vin}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                vehicleId={vehicle.id}
                photos={vehicle.vehicle_photos || []}
                onPhotosUpdate={loadVehicle}
              />
            </CardContent>
          </Card>

          {/* Vehicle Details Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="auction">Auction Info</TabsTrigger>
                  <TabsTrigger value="damage">Damage</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Vehicle Details</span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engine:</span>
                          <span>{vehicle.engine || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transmission:</span>
                          <span>{vehicle.transmission || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fuel Type:</span>
                          <span>{vehicle.fuel_type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Body Style:</span>
                          <span>{vehicle.body_style || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mileage:</span>
                          <span>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Colors & Features</span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exterior:</span>
                          <span>{vehicle.exterior_color || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interior:</span>
                          <span>{vehicle.interior_color || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Title Status:</span>
                          <span>{vehicle.title_status || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Keys Available:</span>
                          <Badge variant={vehicle.keys_available ? "default" : "secondary"}>
                            {vehicle.keys_available ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Run & Drive:</span>
                          <Badge variant={vehicle.run_and_drive ? "default" : "secondary"}>
                            {vehicle.run_and_drive ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="auction" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Auction Information</span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auction House:</span>
                        <span>{vehicle.auction_house}</span>
                      </div>
                      {vehicle.auction_location && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{vehicle.auction_location}</span>
                        </div>
                      )}
                      {vehicle.sale_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sale Date:</span>
                          <span>{formatDate(vehicle.sale_date)}</span>
                        </div>
                      )}
                      {vehicle.lot_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lot Number:</span>
                          <span>{vehicle.lot_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="damage" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Damage Assessment</span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {vehicle.primary_damage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Primary Damage:</span>
                          <span>{vehicle.primary_damage}</span>
                        </div>
                      )}
                      {vehicle.secondary_damage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Secondary Damage:</span>
                          <span>{vehicle.secondary_damage}</span>
                        </div>
                      )}
                      {vehicle.damage_severity && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Severity:</span>
                          <Badge variant="outline">
                            {vehicle.damage_severity.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                      {vehicle.repair_estimate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Repair Estimate:</span>
                          <span>{formatPrice(vehicle.repair_estimate, 'USD')}</span>
                        </div>
                      )}
                      {vehicle.damage_description && (
                        <div className="mt-3">
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1">{vehicle.damage_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="expenses" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Expenses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Total: {formatPrice(totalExpenses, 'AED')}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => setShowExpenseForm(true)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Expense
                        </Button>
                      </div>
                    </div>
                    {vehicle.expenses.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No expenses recorded yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {vehicle.expenses.map((expense) => (
                          <div key={expense.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {expense.category} • {formatDate(expense.date)}
                              </p>
                            </div>
                            <span className="font-medium">
                              {formatPrice(expense.amount, expense.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Website Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Website Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {vehicle.is_public ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {vehicle.is_public ? 'Visible on Website' : 'Hidden from Website'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.is_public 
                        ? 'Customers can see this vehicle online' 
                        : 'Only admins can see this vehicle'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={vehicle.is_public || false}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={updatingVisibility}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Toggle to control whether this vehicle appears on your public website</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Status Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTracker
                vehicleId={vehicle.id}
                currentStatus={vehicle.current_status}
                currentLocation={vehicle.current_location}
                statusHistory={vehicle.vehicle_status_history}
                onStatusUpdate={loadVehicle}
              />
            </CardContent>
          </Card>

          {/* Arrival Tracking */}
          {(vehicle.expected_arrival_date || vehicle.actual_arrival_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Arrival Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ArrivalCountdown
                  expectedDate={vehicle.expected_arrival_date}
                  actualDate={vehicle.actual_arrival_date}
                  variant="card"
                />

                {vehicle.actual_arrival_date && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">Inventory Metrics</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days in Yard:</span>
                        <span className="font-medium">
                          {(() => {
                            const today = new Date()
                            const actualDate = new Date(vehicle.actual_arrival_date)
                            const days = Math.floor((today.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24))
                            return `${days} day${days === 1 ? '' : 's'}`
                          })()}
                        </span>
                      </div>
                      {vehicle.expected_arrival_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Variance:</span>
                          <span className={`font-medium ${
                            (() => {
                              const expected = new Date(vehicle.expected_arrival_date)
                              const actual = new Date(vehicle.actual_arrival_date)
                              expected.setHours(0, 0, 0, 0)
                              actual.setHours(0, 0, 0, 0)
                              const variance = Math.ceil((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
                              return variance > 0 ? 'text-orange-600' : variance < 0 ? 'text-green-600' : ''
                            })()
                          }`}>
                            {(() => {
                              const expected = new Date(vehicle.expected_arrival_date)
                              const actual = new Date(vehicle.actual_arrival_date)
                              expected.setHours(0, 0, 0, 0)
                              actual.setHours(0, 0, 0, 0)
                              const variance = Math.ceil((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
                              if (variance === 0) return 'On Time'
                              return `${variance > 0 ? '+' : ''}${variance} day${Math.abs(variance) === 1 ? '' : 's'}`
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span className="font-medium">
                    {formatPrice(vehicle.purchase_price, vehicle.purchase_currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium">
                    {formatPrice(totalExpenses, 'AED')}
                  </span>
                </div>
                {vehicle.estimated_total_cost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Total:</span>
                    <span className="font-medium">
                      {formatPrice(vehicle.estimated_total_cost, 'AED')}
                    </span>
                  </div>
                )}
                {vehicle.sale_price && vehicle.sale_price > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sale Price:</span>
                      <span className="font-medium">
                        {formatPrice(vehicle.sale_price, vehicle.sale_currency || 'AED')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Profit/Loss:</span>
                      <span className={`font-medium ${
                        vehicle.sale_price > (vehicle.purchase_price + totalExpenses)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatPrice(
                          vehicle.sale_price - (vehicle.purchase_price + totalExpenses),
                          'AED'
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        onSuccess={loadVehicle}
        vehicleId={vehicle.id}
      />
    </div>
  )
}
