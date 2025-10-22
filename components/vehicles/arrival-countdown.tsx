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
    // Vehicle has arrived - Green with high contrast
    icon = <CheckCircle2 className="h-4 w-4" />
    message = `Arrived ${formatDate(actual)}`
    colorClass = 'text-emerald-900'
    bgColorClass = 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-colors'
  } else if (daysRemaining < 0) {
    // Expected date has passed but vehicle hasn't arrived - Orange/red with high contrast
    const daysOverdue = Math.abs(daysRemaining)
    icon = <CalendarClock className="h-4 w-4" />
    message = `Expected ${formatDate(expected)} (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue)`
    colorClass = 'text-red-900'
    bgColorClass = 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100 hover:border-red-400 transition-colors'
  } else if (daysRemaining === 0) {
    // Arriving today - Bright blue with animation
    icon = <Truck className="h-4 w-4 animate-pulse" />
    message = 'Arriving Today!'
    colorClass = 'text-blue-900'
    bgColorClass = 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-colors'
  } else if (daysRemaining <= 3) {
    // Arriving very soon (1-3 days) - Vibrant blue
    icon = <Truck className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    colorClass = 'text-blue-900'
    bgColorClass = 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-colors'
  } else if (daysRemaining <= 7) {
    // Arriving soon (4-7 days) - Purple
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    colorClass = 'text-purple-900'
    bgColorClass = 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 hover:border-purple-400 transition-colors'
  } else if (daysRemaining <= 30) {
    // Arriving in 1-4 weeks - Indigo
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} days`
    colorClass = 'text-indigo-900'
    bgColorClass = 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 transition-colors'
  } else if (daysRemaining <= 90) {
    // Arriving in 1-3 months - Slate
    icon = <Clock className="h-4 w-4" />
    message = `Arriving in ${daysRemaining} days`
    colorClass = 'text-slate-900'
    bgColorClass = 'bg-slate-50 text-slate-900 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-colors'
  } else {
    // Arriving later (3+ months) - Gray
    icon = <Clock className="h-4 w-4" />
    const months = Math.floor(daysRemaining / 30)
    message = `Arriving in ${months} month${months === 1 ? '' : 's'} (${daysRemaining} days)`
    colorClass = 'text-gray-900'
    bgColorClass = 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors'
  }

  // Render based on variant
  if (variant === 'badge') {
    return (
      <Badge className={cn('flex items-center gap-1.5', bgColorClass, className)}>
        {icon}
        <span className="text-xs font-medium">{message}</span>
      </Badge>
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
        <div className={cn('rounded-full p-3 mt-1', bgColorClass.replace('text-', 'text-').replace('border-', 'border-'))}>
          <div className="h-6 w-6">{icon}</div>
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
