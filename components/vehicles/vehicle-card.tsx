import { Vehicle } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { CalendarDays, MapPin, DollarSign, Car, Wrench, ImageIcon, Globe, EyeOff } from 'lucide-react'

interface VehicleWithPhotos extends Vehicle {
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface VehicleCardProps {
  vehicle: VehicleWithPhotos
  onEdit?: (vehicle: VehicleWithPhotos) => void
  onViewDetails?: (vehicle: VehicleWithPhotos) => void
  className?: string
}

export function VehicleCard({ vehicle, onEdit, onViewDetails, className }: VehicleCardProps) {
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'auction_won': 'bg-blue-100 text-blue-800',
      'at_yard': 'bg-green-100 text-green-800',
      'ready_for_sale': 'bg-purple-100 text-purple-800',
      'sold': 'bg-gray-100 text-gray-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'customs_clearance': 'bg-orange-100 text-orange-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    if (!status) return ''
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
  }

  // Get primary photo or first photo
  const primaryPhoto = vehicle.vehicle_photos?.find(photo => photo.is_primary) 
    || vehicle.vehicle_photos?.[0]

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      {/* Vehicle Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No photo</p>
            </div>
          </div>
        )}
        
        {/* Status badge overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={getStatusColor(vehicle.current_status)}>
            {formatStatus(vehicle.current_status)}
          </Badge>
          
          {/* Visibility indicator - only show if is_public field exists */}
          {vehicle.is_public !== undefined && (
            vehicle.is_public ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                <EyeOff className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div>
          <h3 className="font-semibold text-lg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && (
            <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
          )}
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          VIN: {vehicle.vin}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.auction_house}</span>
          </div>
          
          {vehicle.current_location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{vehicle.current_location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatPrice(vehicle.purchase_price, vehicle.purchase_currency)}</span>
          </div>
          
          {vehicle.sale_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(vehicle.sale_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {vehicle.primary_damage && (
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {vehicle.primary_damage}
              {vehicle.secondary_damage && `, ${vehicle.secondary_damage}`}
            </span>
          </div>
        )}

        {vehicle.damage_severity && (
          <Badge variant="outline" className="w-fit">
            {vehicle.damage_severity.replace('_', ' ')}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="pt-3 gap-2">
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(vehicle)}>
            View Details
          </Button>
        )}
        {onEdit && (
          <Button size="sm" onClick={() => onEdit(vehicle)}>
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}