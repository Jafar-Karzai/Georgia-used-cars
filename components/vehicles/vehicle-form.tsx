'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VinData } from '@/lib/services/vin-decoder'
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
  // Issue 15: Align with API validation which allows 10-17 characters
  vin: z.string().min(10, 'VIN must be between 10 and 17 characters').max(17, 'VIN must be between 10 and 17 characters'),
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
  drivetrain: z.string().optional(),

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
  sale_price: z.number().min(0.01, 'Sale price must be positive').optional(),
  sale_currency: z.enum(['USD', 'CAD', 'AED']).optional(),
  sale_price_includes_vat: z.boolean().optional(),
  sale_type: z.enum(['local_only', 'export_only', 'local_and_export']).optional(),

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

  // Initialize photos from initialData if available
  const [vehiclePhotos, setVehiclePhotos] = useState(
    initialData?.vehicle_photos || []
  )

  const { user } = useAuth()

  // Convert Decimal fields to numbers for form compatibility
  // Keep data in snake_case format to match form schema
  const transformedData = initialData ? {
    ...initialData,
    // Convert Decimal types to numbers
    purchase_price: initialData.purchase_price ? Number(initialData.purchase_price) : 0,
    sale_price: initialData.sale_price ? Number(initialData.sale_price) : 0,
    estimated_total_cost: initialData.estimated_total_cost ? Number(initialData.estimated_total_cost) : 0,
    repair_estimate: initialData.repair_estimate ? Number(initialData.repair_estimate) : 0,
    mileage: initialData.mileage ? Number(initialData.mileage) : 0,
  } : undefined

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
      drivetrain: '',
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
      sale_price: 0,
      sale_currency: 'AED',
      sale_price_includes_vat: false,
      sale_type: 'local_and_export',
      ...(transformedData && transformedData)
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
    setLoading(true)

    if (!user) {
      alert('User not authenticated. Please log in and try again.')
      setLoading(false)
      return
    }

    // Issue 17: Pre-flight validation to catch errors before API call
    if (!data.vin || data.vin.length < 10 || data.vin.length > 17) {
      alert('Please provide a valid VIN (10-17 characters)')
      setLoading(false)
      return
    }

    if (data.sale_price && data.sale_price > 0 && !data.sale_currency) {
      alert('Sale currency is required when sale price is specified')
      setLoading(false)
      return
    }

    if (data.sale_type === 'local_only' && data.sale_currency && data.sale_currency !== 'AED') {
      alert('Local sales must use AED currency')
      setLoading(false)
      return
    }

    // Issue 18: Client-side type validation before API submission
    const typeErrors: string[] = []

    if (typeof data.year !== 'number') typeErrors.push('Year must be a number')
    if (typeof data.purchase_price !== 'number') typeErrors.push('Purchase price must be a number')
    if (data.mileage !== undefined && typeof data.mileage !== 'number') typeErrors.push('Mileage must be a number')
    if (data.sale_price !== undefined && typeof data.sale_price !== 'number') typeErrors.push('Sale price must be a number')
    if (data.repair_estimate !== undefined && typeof data.repair_estimate !== 'number') typeErrors.push('Repair estimate must be a number')
    if (data.estimated_total_cost !== undefined && typeof data.estimated_total_cost !== 'number') typeErrors.push('Estimated total cost must be a number')
    if (typeof data.keys_available !== 'boolean') typeErrors.push('Keys available must be boolean')
    if (typeof data.run_and_drive !== 'boolean') typeErrors.push('Run and drive must be boolean')
    if (typeof data.is_public !== 'boolean') typeErrors.push('Is public must be boolean')
    if (data.sale_price_includes_vat !== undefined && typeof data.sale_price_includes_vat !== 'boolean') typeErrors.push('Sale price includes VAT must be boolean')

    if (typeErrors.length > 0) {
      alert('Form validation errors:\n' + typeErrors.join('\n'))
      setLoading(false)
      return
    }

    console.log('Submitting vehicle data:', data)

    try {
      let result

      // Get access token with timeout to prevent hanging
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      try {
        // Use the new @supabase/ssr package for client-side auth
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get session without network request (reads from local storage)
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
          console.log('✓ Got access token for API request')
        } else {
          console.log('No access token, will use cookie authentication')
        }
      } catch (sessionError) {
        console.warn('Session token retrieval failed, will rely on cookies:', sessionError)
        // Continue without Authorization header - API will fall back to cookies
      }

      if (isEdit && initialData?.id) {
        console.log('Updating vehicle via API with ID:', initialData.id)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        try {
          const response = await fetch(`/api/vehicles/${initialData.id}`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify({ ...data }),
            signal: controller.signal
          })

          clearTimeout(timeout)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('API Error Response:', errorData)
            throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }

          result = await response.json()
        } catch (error) {
          clearTimeout(timeout)
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds. Please check your connection and try again.')
          }
          throw error
        }
      } else {
        console.log('Creating new vehicle via API')
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        try {
          const response = await fetch('/api/vehicles', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(data),
            signal: controller.signal
          })

          clearTimeout(timeout)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('API Error Response:', errorData)
            throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }

          result = await response.json()
        } catch (error) {
          clearTimeout(timeout)
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds. Please check your connection and try again.')
          }
          throw error
        }
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
        <form id="vehicle-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              value={field.value ?? new Date().getFullYear()}
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
                              value={field.value ?? 0}
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="transmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transmission</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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

                    <FormField
                      control={form.control}
                      name="drivetrain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drivetrain</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select drivetrain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FWD">FWD</SelectItem>
                              <SelectItem value="RWD">RWD</SelectItem>
                              <SelectItem value="AWD">AWD</SelectItem>
                              <SelectItem value="four_WD">4WD</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                              value={field.value ?? 0}
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                              value={field.value ?? 0}
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
                          <Select onValueChange={field.onChange} value={field.value || 'USD'}>
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
                            value={field.value ?? 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              // Ensure only 2 decimal places
                              const fixed = Math.round(value * 100) / 100
                              field.onChange(fixed)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Include purchase price, shipping, taxes, repairs, and other costs. Amount will be rounded to 2 decimal places.
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

              {/* Sale Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Sale Information
                  </CardTitle>
                  <CardDescription>
                    Set sale price and market type for this vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sale Type Selection */}
                  <FormField
                    control={form.control}
                    name="sale_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Sale Type</FormLabel>
                        <FormDescription className="mb-4">
                          Choose which market(s) you want to sell this vehicle in
                        </FormDescription>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
                            onClick={() => field.onChange('local_and_export')}>
                            <input
                              type="radio"
                              id="local_export"
                              name="sale_type"
                              value="local_and_export"
                              checked={field.value === 'local_and_export'}
                              onChange={() => field.onChange('local_and_export')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="local_export" className="flex-1 cursor-pointer">
                              <div className="font-medium">Local & Export (Default)</div>
                              <div className="text-sm text-muted-foreground">Sell to both UAE customers and export buyers</div>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
                            onClick={() => field.onChange('local_only')}>
                            <input
                              type="radio"
                              id="local_only"
                              name="sale_type"
                              value="local_only"
                              checked={field.value === 'local_only'}
                              onChange={() => field.onChange('local_only')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="local_only" className="flex-1 cursor-pointer">
                              <div className="font-medium">Local Market Only</div>
                              <div className="text-sm text-muted-foreground">Sell only to UAE customers (5% VAT applies)</div>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
                            onClick={() => field.onChange('export_only')}>
                            <input
                              type="radio"
                              id="export_only"
                              name="sale_type"
                              value="export_only"
                              checked={field.value === 'export_only'}
                              onChange={() => field.onChange('export_only')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="export_only" className="flex-1 cursor-pointer">
                              <div className="font-medium">Export Only</div>
                              <div className="text-sm text-muted-foreground">Sell only for export (no VAT)</div>
                            </label>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Sale Price Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sale_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price (Base Price)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={field.value ?? 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                // Ensure only 2 decimal places
                                const fixed = Math.round(value * 100) / 100
                                field.onChange(fixed)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the price you want to sell this vehicle for. Amount will be rounded to 2 decimal places.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sale_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'AED'}>
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

                  {/* VAT Toggle */}
                  <FormField
                    control={form.control}
                    name="sale_price_includes_vat"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Is VAT Included in Price?</FormLabel>
                          <FormDescription>
                            Check if the sale price already includes 5% VAT for local sales
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

                  {/* VAT Calculation Display */}
                  {(form.watch('sale_price') ?? 0) > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="font-semibold text-blue-900 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Price Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Base Price:</span>
                          <div className="font-semibold">AED {form.watch('sale_price')?.toFixed(2) || '0.00'}</div>
                        </div>
                        {form.watch('sale_type') !== 'export_only' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">5% VAT:</span>
                              <div className="font-semibold">AED {((form.watch('sale_price') || 0) * 0.05).toFixed(2)}</div>
                            </div>
                            <div className="col-span-2 bg-blue-100 rounded p-2">
                              <span className="text-muted-foreground">Total for Local (UAE) Customers:</span>
                              <div className="font-bold text-lg text-blue-900">
                                AED {((form.watch('sale_price') || 0) * (form.watch('sale_price_includes_vat') ? 1 : 1.05)).toFixed(2)}
                              </div>
                            </div>
                          </>
                        )}
                        {form.watch('sale_type') !== 'local_only' && (
                          <div className="col-span-2 bg-green-100 rounded p-2">
                            <span className="text-muted-foreground">Total for Export Customers:</span>
                            <div className="font-bold text-lg text-green-900">
                              AED {form.watch('sale_price')?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                      onPhotosUpdate={async () => {
                        // Refetch photos after upload
                        try {
                          const response = await fetch(`/api/vehicles/${initialData.id}`)
                          if (response.ok) {
                            const result = await response.json()
                            if (result.data?.vehicle_photos) {
                              setVehiclePhotos(result.data.vehicle_photos)
                            }
                          }
                        } catch (error) {
                          console.error('Failed to refetch photos:', error)
                        }
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

      {/* Form Actions - Always visible, outside tabs */}
      <div className="flex justify-between items-center pt-6 border-t sticky bottom-0 bg-white z-10">
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
            ← Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const tabs = ['basic', 'auction', 'condition', 'financial', 'photos']
              const currentIndex = tabs.indexOf(activeTab)
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1])
              }
            }}
            disabled={activeTab === 'photos'}
          >
            Next →
          </Button>

          <Button
            type="submit"
            form="vehicle-form"
            disabled={loading}
            className="ml-2"
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
        </div>
      </div>
    </div>
  )
}
