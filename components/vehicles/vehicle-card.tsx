import { Vehicle, Photo } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { CalendarDays, MapPin, DollarSign, Car, Wrench, ImageIcon, Globe, EyeOff } from 'lucide-react'
import { ArrivalCountdown } from '@/components/vehicles/arrival-countdown'

interface VehicleWithPhotos extends Vehicle {
  vehicle_photos?: Photo[]
}

interface VehicleCardProps {
  vehicle: VehicleWithPhotos
  onEdit?: (vehicle: VehicleWithPhotos) => void
  onViewDetails?: (vehicle: VehicleWithPhotos) => void
  className?: string
}

export function VehicleCard({ vehicle, onEdit, onViewDetails, className }: VehicleCardProps) {
  const formatStatus = (status: string) => {
    if (!status) return ''
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price || price <= 0) return 'Contact for Price'
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Get primary photo or first photo
  const primaryPhoto = vehicle.vehicle_photos?.find(photo => photo.is_primary)
    || vehicle.vehicle_photos?.[0]

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow border-border ${className}`}>
      {/* Vehicle Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-1 text-xs text-muted-foreground">No image</p>
            </div>
          </div>
        )}

        {/* Compact status badges overlay */}
        <div className="absolute top-2 left-2 right-2 flex gap-1.5 justify-between items-start">
          <Badge variant="secondary" className="text-xs font-medium shadow-sm">
            {formatStatus(vehicle.current_status)}
          </Badge>

          {vehicle.is_public !== undefined && (
            <Badge variant={vehicle.is_public ? "default" : "outline"} className="text-xs shadow-sm">
              {vehicle.is_public ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Vehicle Title */}
        <div>
          <h3 className="font-semibold text-base leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && (
            <p className="text-sm text-muted-foreground mt-0.5">{vehicle.trim}</p>
          )}
        </div>

        {/* VIN */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="font-normal">VIN:</span>
          <span className="truncate">{vehicle.vin}</span>
        </div>

        {/* Arrival Status - Prominent */}
        {vehicle.expected_arrival_date && (
          <ArrivalCountdown
            expectedDate={vehicle.expected_arrival_date}
            actualDate={vehicle.actual_arrival_date}
            variant="badge"
          />
        )}

        {/* Key Information Grid */}
        <div className="space-y-2 text-sm pt-1">
          {/* Price - Most important, shown prominently */}
          <div className="flex items-center justify-between py-1.5 border-y border-border">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold">{formatPrice(vehicle.sale_price, vehicle.sale_currency)}</span>
          </div>

          {/* Other details in compact rows */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Car className="h-3.5 w-3.5" />
                <span>Auction</span>
              </div>
              <span className="font-medium">{vehicle.auction_house}</span>
            </div>

            {vehicle.sale_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Sale Date</span>
                </div>
                <span className="font-medium">{new Date(vehicle.sale_date).toLocaleDateString()}</span>
              </div>
            )}

            {vehicle.current_location && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Location</span>
                </div>
                <span className="font-medium truncate ml-2">{vehicle.current_location}</span>
              </div>
            )}

            {vehicle.primary_damage && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Damage</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {vehicle.primary_damage}
                    {vehicle.secondary_damage && `, ${vehicle.secondary_damage}`}
                  </span>
                  {vehicle.damage_severity && (
                    <Badge variant="outline" className="text-xs py-0 h-5 ml-1">
                      {vehicle.damage_severity.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(vehicle)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(vehicle)}
              className="flex-1"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}