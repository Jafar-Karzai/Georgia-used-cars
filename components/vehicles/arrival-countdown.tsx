import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, Truck, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArrivalCountdownProps {
  expectedDate?: Date | string | null
  actualDate?: Date | string | null
  variant?: 'badge' | 'card' | 'full'
  className?: string
}

export function ArrivalCountdown({
  expectedDate,
  actualDate,
  variant = 'badge',
  className
}: ArrivalCountdownProps) {
  // If no expected date, don't render anything
  if (!expectedDate) {
    return null
  }

  // Convert to Date objects if needed
  const expected = typeof expectedDate === 'string' ? new Date(expectedDate) : expectedDate
  const actual = actualDate ? (typeof actualDate === 'string' ? new Date(actualDate) : actualDate) : null

  // Calculate days remaining
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expectedDay = new Date(expected)
  expectedDay.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil((expectedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Determine state and content
  let icon: React.ReactNode
  let message: string
  let colorClass: string
  let bgColorClass: string

  if (actual) {
    // Vehicle has arrived
    icon = <CheckCircle2 className="h-4 w-4" />
    message = `Arrived ${formatDate(actual)}`
    colorClass = 'text-primary'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining < 0) {
    // Expected date has passed but vehicle hasn't arrived
    const daysOverdue = Math.abs(daysRemaining)
    icon = <CalendarClock className="h-4 w-4" />
    message = `Expected ${formatDate(expected)} (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue)`
    colorClass = 'text-foreground'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining === 0) {
    // Arriving today
    icon = <Truck className="h-4 w-4 animate-pulse" />
    message = 'Arriving Today!'
    colorClass = 'text-primary'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining <= 3) {
    // Arriving very soon (1-3 days)
    icon = <Truck className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    colorClass = 'text-primary'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining <= 7) {
    // Arriving soon (4-7 days)
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    colorClass = 'text-primary'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining <= 30) {
    // Arriving in 1-4 weeks
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} days`
    colorClass = 'text-muted-foreground'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else if (daysRemaining <= 90) {
    // Arriving in 1-3 months
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} days`
    colorClass = 'text-muted-foreground'
    bgColorClass = 'bg-muted/50 text-foreground border'
  } else {
    // Arriving later (3+ months)
    icon = <Clock className="h-4 w-4" />
    const months = Math.floor(daysRemaining / 30)
    message = `Arriving in ${months} month${months === 1 ? '' : 's'} (${daysRemaining} days)`
    colorClass = 'text-muted-foreground'
    bgColorClass = 'bg-muted/50 text-foreground border'
  }

  // Render based on variant
  if (variant === 'badge') {
    // For arrived vehicles, return null (card will show lot number)
    if (actual) {
      return null
    }

    // Overdue - show "Delayed" badge with warning color
    if (daysRemaining < 0) {
      return (
        <span className={cn('text-3xs font-bold text-warning uppercase flex items-center gap-1.5', className)}>
          <span className="w-1.5 h-1.5 bg-warning rounded-full" aria-hidden="true" />
          Delayed
        </span>
      )
    }

    // Arriving today
    if (daysRemaining === 0) {
      return (
        <span className={cn('text-3xs font-bold text-precision-500 uppercase flex items-center gap-1.5', className)}>
          <span className="w-1.5 h-1.5 bg-precision-500 rounded-full animate-pulse" aria-hidden="true" />
          Arriving Today
        </span>
      )
    }

    // Show simple ETA format
    return (
      <span className={cn('text-3xs font-bold text-precision-500 uppercase flex items-center gap-1.5', className)}>
        <span className="w-1.5 h-1.5 bg-precision-500 rounded-full animate-pulse" aria-hidden="true" />
        ETA: {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''}
      </span>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-l-4', className)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5', colorClass)}>
              {icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                {actual ? 'Vehicle Arrived' : 'Arrival Status'}
              </h4>
              <p className={cn('text-sm', colorClass)}>
                {message}
              </p>
              {!actual && daysRemaining >= 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {formatDate(expected)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // variant === 'full'
  return (
    <div className={cn('rounded-lg border p-6', className)}>
      <div className="flex items-start gap-4">
        <div className={cn('rounded-full p-3 bg-muted/50 flex items-center justify-center')}>
          <div className={cn('h-6 w-6 flex items-center justify-center', colorClass)}>{icon}</div>
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">
            {actual ? 'Vehicle Arrived' : 'Arrival Status'}
          </h3>
          <p className={cn('text-base font-medium', colorClass)}>
            {message}
          </p>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {!actual && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Expected Date:</span>
                <span>{formatDate(expected)}</span>
              </div>
            )}
            {actual && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Expected Date:</span>
                  <span>{formatDate(expected)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Actual Arrival:</span>
                  <span>{formatDate(actual)}</span>
                </div>
                {(() => {
                  const actualDay = new Date(actual)
                  actualDay.setHours(0, 0, 0, 0)
                  const variance = Math.ceil((actualDay.getTime() - expectedDay.getTime()) / (1000 * 60 * 60 * 24))
                  if (variance !== 0) {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Variance:</span>
                        <span className={variance > 0 ? 'text-orange-600' : 'text-green-600'}>
                          {variance > 0 ? `+${variance}` : variance} day{Math.abs(variance) === 1 ? '' : 's'}
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
