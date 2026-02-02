'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Wallet, Heart, AlertCircle, Car, ArrowRight, Calendar } from 'lucide-react'

export default function MyAccountPage() {
  // Mock data
  const stats = {
    activeReservations: 2,
    pendingPayments: 1,
    favoriteVehicles: 5,
    completedPurchases: 3,
  }

  const recentReservations = [
    {
      id: 'mock-reservation-id',
      vehicle: {
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      },
      depositPaid: 2500,
      remainingBalance: 47500,
      currency: 'AED',
      status: 'awaiting_balance',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      id: 'mock-reservation-id-2',
      vehicle: {
        year: 2022,
        make: 'Honda',
        model: 'Accord',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      },
      depositPaid: 3000,
      remainingBalance: 57000,
      currency: 'AED',
      status: 'deposit_paid',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
  ]

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDaysRemaining = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      deposit_paid: { label: 'Deposit Paid', className: 'bg-blue-100 text-blue-800' },
      awaiting_balance: { label: 'Payment Pending', className: 'bg-amber-100 text-amber-800' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
      expired: { label: 'Expired', className: 'bg-red-100 text-red-800' },
    }
    return statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Reservations
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">Vehicles reserved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favorite Vehicles
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.favoriteVehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved for later</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Purchases
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">Total purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reservations</CardTitle>
              <CardDescription>Your most recent vehicle reservations</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/my-account/reservations">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReservations.map((reservation) => {
              const daysRemaining = getDaysRemaining(reservation.expiresAt)
              const isUrgent = daysRemaining <= 3
              const statusBadge = getStatusBadge(reservation.status)

              return (
                <div
                  key={reservation.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-full sm:w-32 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={reservation.vehicle.image}
                      alt={`${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {reservation.vehicle.year} {reservation.vehicle.make}{' '}
                          {reservation.vehicle.model}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                          {isUrgent && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/my-account/reservations/${reservation.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Deposit Paid</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(reservation.depositPaid, reservation.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining Balance</p>
                        <p className="font-semibold">
                          {formatCurrency(reservation.remainingBalance, reservation.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Expires on{' '}
                        {reservation.expiresAt.toLocaleDateString('en-AE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>Get assistance with your reservations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/contact">
                <AlertCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/faq">
                <AlertCircle className="h-4 w-4 mr-2" />
                View FAQs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browse Vehicles</CardTitle>
            <CardDescription>Find your next vehicle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/inventory">
                <Car className="h-4 w-4 mr-2" />
                View All Vehicles
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/my-account/favorites">
                <Heart className="h-4 w-4 mr-2" />
                View Favorites
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
