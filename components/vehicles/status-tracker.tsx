import { useState } from 'react'
import { VehicleStatus } from '@/types/database'
import { VehicleService } from '@/lib/services/vehicles'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/context'
import { Clock, MapPin, User, Edit3 } from 'lucide-react'

interface StatusTrackerProps {
  vehicleId: string
  currentStatus: VehicleStatus
  currentLocation?: string
  statusHistory?: Array<{
    id: string
    status: VehicleStatus
    location?: string
    notes?: string
    changed_at: string
    changed_by?: string
    profiles?: { full_name: string }
  }>
  onStatusUpdate?: () => void
}

export function StatusTracker({ 
  vehicleId, 
  currentStatus, 
  currentLocation,
  statusHistory = [],
  onStatusUpdate 
}: StatusTrackerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<VehicleStatus>(currentStatus)
  const [location, setLocation] = useState(currentLocation || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuth()

  const statusOptions = [
    { value: 'auction_won', label: 'Auction Won', color: 'bg-blue-100 text-blue-800' },
    { value: 'payment_processing', label: 'Payment Processing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pickup_scheduled', label: 'Pickup Scheduled', color: 'bg-orange-100 text-orange-800' },
    { value: 'in_transit_to_port', label: 'In Transit to Port', color: 'bg-purple-100 text-purple-800' },
    { value: 'at_port', label: 'At Port', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'in_transit', label: 'In Transit', color: 'bg-blue-100 text-blue-800' },
    { value: 'at_uae_port', label: 'At UAE Port', color: 'bg-teal-100 text-teal-800' },
    { value: 'customs_clearance', label: 'Customs Clearance', color: 'bg-amber-100 text-amber-800' },
    { value: 'released_from_customs', label: 'Released from Customs', color: 'bg-lime-100 text-lime-800' },
    { value: 'in_transit_to_yard', label: 'In Transit to Yard', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'at_yard', label: 'At Yard', color: 'bg-green-100 text-green-800' },
    { value: 'under_enhancement', label: 'Under Enhancement', color: 'bg-violet-100 text-violet-800' },
    { value: 'ready_for_sale', label: 'Ready for Sale', color: 'bg-purple-100 text-purple-800' },
    { value: 'reserved', label: 'Reserved', color: 'bg-pink-100 text-pink-800' },
    { value: 'sold', label: 'Sold', color: 'bg-rose-100 text-rose-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-gray-100 text-gray-800' }
  ] as const

  const getStatusOption = (status: VehicleStatus) => {
    return statusOptions.find(option => option.value === status)
  }

  const handleUpdateStatus = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const result = await VehicleService.updateStatus(
        vehicleId,
        newStatus,
        location || undefined,
        notes || undefined,
        user.id
      )

      if (result.success) {
        setIsOpen(false)
        setNotes('')
        onStatusUpdate?.()
      } else {
        console.error('Failed to update status:', result.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const currentStatusOption = getStatusOption(currentStatus)

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={currentStatusOption?.color}>
            {currentStatusOption?.label}
          </Badge>
          {currentLocation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {currentLocation}
            </div>
          )}
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Vehicle Status</DialogTitle>
              <DialogDescription>
                Update the current status and location of the vehicle.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={(value: VehicleStatus) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="Enter current location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Status History</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {statusHistory.map((entry, index) => {
              const statusOption = getStatusOption(entry.status)
              return (
                <div key={entry.id || `status-${index}`} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {statusOption?.label}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(entry.changed_at)}
                      </span>
                      {entry.profiles?.full_name && (
                        <>
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {entry.profiles.full_name}
                          </span>
                        </>
                      )}
                    </div>
                    {entry.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {entry.location}
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-sm">{entry.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}