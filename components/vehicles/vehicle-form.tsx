'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VehicleService, CreateVehicleData, UpdateVehicleData } from '@/lib/services/vehicles'
import { VinDecoderService, VinData } from '@/lib/services/vin-decoder'
import { VinInput } from '@/components/vehicles/vin-input'
import { PhotoUpload } from '@/components/vehicles/photo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth/context'
import { Vehicle } from '@/types/database'
import { 
  Car, 
  DollarSign, 
  MapPin, 
  AlertTriangle, 
  Key,
  Settings,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Info,
  Globe
} from 'lucide-react'

const vehicleSchema = z.object({
  // Basic Information
  vin: z.string().min(17, 'VIN must be exactly 17 characters').max(17, 'VIN must be exactly 17 characters'),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 2, 'Invalid year'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  trim: z.string().optional(),
  engine: z.string().optional(),
  mileage: z.number().min(0, 'Mileage cannot be negative').optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  transmission: z.string().optional(),
  fuel_type: z.string().optional(),
  body_style: z.string().optional(),

  // Auction Information
  auction_house: z.string().min(1, 'Auction house is required'),
  auction_location: z.string().optional(),
  sale_date: z.string().optional(),
  lot_number: z.string().optional(),

  // Damage Information
  primary_damage: z.string().optional(),
  secondary_damage: z.string().optional(),
  damage_description: z.string().optional(),
  damage_severity: z.enum(['minor', 'moderate', 'major', 'total_loss']).optional(),
  repair_estimate: z.number().min(0, 'Repair estimate cannot be negative').optional(),
  
  // Title and Condition
  title_status: z.string().optional(),
  keys_available: z.boolean().optional(),
  run_and_drive: z.boolean().optional(),

  // Financial Information
  purchase_price: z.number().min(0.01, 'Purchase price is required'),
  purchase_currency: z.enum(['USD', 'CAD', 'AED']),
  estimated_total_cost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  
  // Visibility
  is_public: z.boolean().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
  initialData?: Vehicle
  isEdit?: boolean
  onSuccess: (vehicle: Vehicle) => void
  onCancel: () => void
}

export function VehicleForm({ initialData, isEdit = false, onSuccess, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [vinDecoding, setVinDecoding] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [vehiclePhotos, setVehiclePhotos] = useState<any[]>([])
  
  const { user } = useAuth()

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      year: new Date().getFullYear(),
      make: '',
      model: '',
      trim: '',
      engine: '',
      mileage: 0,
      exterior_color: '',
      interior_color: '',
      transmission: '',
      fuel_type: '',
      body_style: '',
      auction_house: '',
      auction_location: '',
      sale_date: '',
      lot_number: '',
      primary_damage: '',
      secondary_damage: '',
      damage_description: '',
      damage_severity: undefined,
      repair_estimate: 0,
      title_status: '',
      keys_available: false,
      run_and_drive: false,
      is_public: false,
      purchase_price: 1,
      purchase_currency: 'USD',
      estimated_total_cost: 0,
      ...initialData
    }
  })

  // Auto-populate form when VIN is decoded
  const handleVinDecoded = (vinData: VinData) => {
    setVinDecoding(true)
    
    if (vinData.year) form.setValue('year', vinData.year)
    if (vinData.make) form.setValue('make', vinData.make)
    if (vinData.model) form.setValue('model', vinData.model)
    if (vinData.trim) form.setValue('trim', vinData.trim)
    if (vinData.engine) form.setValue('engine', vinData.engine)
    if (vinData.transmission) form.setValue('transmission', vinData.transmission)
    if (vinData.fuel_type) form.setValue('fuel_type', vinData.fuel_type)
    if (vinData.body_style) form.setValue('body_style', vinData.body_style)
    
    setTimeout(() => setVinDecoding(false), 1000)
  }

  const onSubmit = async (data: VehicleFormData) => {
    if (!user) {
      alert('User not authenticated. Please log in and try again.')
      return
    }

    console.log('Submitting vehicle data:', data)
    setLoading(true)
    
    try {
      let result

      if (isEdit && initialData?.id) {
        console.log('Updating vehicle with ID:', initialData.id)
        const updateData: UpdateVehicleData = { ...data }
        result = await VehicleService.update(initialData.id, updateData, user.id)
      } else {
        console.log('Creating new vehicle via API')
        
        // Use API route instead of direct Supabase call
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        result = await response.json()
      }

      console.log('Vehicle service result:', result)

      if (result.success && result.data) {
        console.log('Vehicle saved successfully:', result.data)
        onSuccess(result.data)
      } else {
        console.error('Failed to save vehicle:', result.error)
        alert('Failed to save vehicle: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('An error occurred while saving the vehicle: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const auctionHouses = [
    'Copart',
    'IAAI',
    'Manheim',
    'ADESA',
    'Barrett-Jackson',
    'Mecum',
    'RM Sotheby\'s',
    'Bonhams',
    'Other'
  ]

  const titleStatuses = [
    'Clean',
    'Salvage',
    'Rebuilt',
    'Lemon',
    'Flood',
    'Hail',
    'Fire',
    'Theft Recovery',
    'Unknown'
  ]

  const fuelTypes = [
    'Gasoline',
    'Diesel',
    'Hybrid',
    'Electric',
    'Flex Fuel',
    'CNG',
    'Other'
  ]

  const transmissionTypes = [
    'Automatic',
    'Manual',
    'CVT',
    'Semi-Automatic',
    'Other'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit 
              ? 'Update vehicle information and details'
              : 'Enter comprehensive vehicle information for inventory tracking'
            }
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="auction" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Auction Details
              </TabsTrigger>
              <TabsTrigger value="condition" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Condition
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Photos
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Identification
                  </CardTitle>
                  <CardDescription>
                    Enter the VIN to automatically populate vehicle details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* VIN Input with Auto-decode */}
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <VinInput
                          value={field.value}
                          onChange={field.onChange}
                          onVinDecoded={handleVinDecoded}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {vinDecoding && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Auto-filling vehicle details...
                    </div>
                  )}

                  <Separator />

                  {/* Basic Vehicle Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1900" 
                              max={new Date().getFullYear() + 2}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Toyota, BMW" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Camry, X5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trim</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., LE, Sport, Limited" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mileage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exterior_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exterior Color</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pearl White, Metallic Blue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interior_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interior Color</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Black Leather, Beige Cloth" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="transmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transmission</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transmission" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {transmissionTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="fuel_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fuelTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="body_style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Style</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sedan, SUV, Hatchback" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="engine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2.5L 4-Cylinder, 3.5L V6 Twin Turbo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auction Details Tab */}
            <TabsContent value="auction" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Auction Information
                  </CardTitle>
                  <CardDescription>
                    Details about where and when the vehicle was acquired
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="auction_house"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auction House *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select auction house" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {auctionHouses.map((house) => (
                                <SelectItem key={house} value={house}>
                                  {house}
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
                      name="auction_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auction Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Atlanta GA, Phoenix AZ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sale_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lot_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Condition Tab */}
            <TabsContent value="condition" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Vehicle Condition
                  </CardTitle>
                  <CardDescription>
                    Document damage, title status, and vehicle condition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primary_damage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Damage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Front End, Rear End, Side" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_damage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Damage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Hail, Water, Interior" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="damage_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Damage Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of damage and condition"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="damage_severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Damage Severity</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="minor">Minor</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="major">Major</SelectItem>
                              <SelectItem value="total_loss">Total Loss</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repair_estimate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repair Estimate (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
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
                  </div>

                  <FormField
                    control={form.control}
                    name="title_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select title status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {titleStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="keys_available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Keys Available
                            </FormLabel>
                            <FormDescription>
                              Vehicle comes with keys
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="run_and_drive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Run and Drive
                            </FormLabel>
                            <FormDescription>
                              Vehicle is operational and driveable
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-50 border-blue-200">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2 text-blue-700">
                              <Globe className="h-4 w-4" />
                              Show on Website
                            </FormLabel>
                            <FormDescription className="text-blue-600">
                              Make this vehicle visible to public on the website
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                  <CardDescription>
                    Purchase price and cost estimates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchase_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
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
                      name="purchase_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="AED">AED</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="estimated_total_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Total Cost (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Include purchase price, shipping, taxes, repairs, and other costs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Cost Estimation Tips:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Include auction fees (typically 5-10% of purchase price)</li>
                          <li>Factor in shipping costs ($500-2000 depending on distance)</li>
                          <li>Consider import duties and taxes for international purchases</li>
                          <li>Add estimated repair costs based on damage assessment</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Vehicle Photos
                  </CardTitle>
                  <CardDescription>
                    Upload high-quality images to showcase the vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEdit && initialData?.id ? (
                    <PhotoUpload 
                      vehicleId={initialData.id}
                      photos={vehiclePhotos}
                      onPhotosUpdate={() => {
                        // Reload photos if needed
                        // This can be enhanced to refetch photos
                      }}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">Photos can be uploaded after creating the vehicle</p>
                      <p className="text-sm text-muted-foreground">
                        Complete the vehicle information first, then add photos on the next screen
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </form>
      </Form>

      {/* Form Actions - Outside the form to avoid conflicts */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              const tabs = ['basic', 'auction', 'condition', 'financial', 'photos']
              const currentIndex = tabs.indexOf(activeTab)
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1])
              }
            }}
            disabled={activeTab === 'basic'}
          >
            Previous
          </Button>
          
          {activeTab !== 'photos' ? (
            <Button 
              type="button"
              onClick={() => {
                const tabs = ['basic', 'auction', 'condition', 'financial', 'photos']
                const currentIndex = tabs.indexOf(activeTab)
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1])
                }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={async () => {
                console.log('🚀 CREATE VEHICLE BUTTON CLICKED!')
                console.log('Loading state:', loading)
                console.log('User:', user)
                console.log('Form valid:', form.formState.isValid)
                console.log('Form errors:', form.formState.errors)
                console.log('Form values:', form.getValues())
                
                // Force validation and get all errors
                const isValid = await form.trigger()
                console.log('Manual validation result:', isValid)
                console.log('All form errors after validation:', form.formState.errors)
                
                // Reset loading state first
                setLoading(false)
                
                if (!isValid) {
                  console.error('❌ Form validation failed. Not submitting.')
                  console.log('Detailed errors:', form.formState.errors)
                  return
                }
                
                // Try to submit directly
                console.log('✅ Form is valid, calling onSubmit directly...')
                await onSubmit(form.getValues())
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isEdit ? 'Update Vehicle' : 'Create Vehicle'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}