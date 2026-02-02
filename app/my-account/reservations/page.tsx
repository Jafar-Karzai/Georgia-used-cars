'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Calendar, ArrowRight, Car, Filter } from 'lucide-react'

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState('all')

  // Mock reservations data
  const reservations = [
    {
      id: '2021-Camry-XLE-id',
      vehicle: {
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        trim: 'XLE',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      },
      depositPaid: 2500,
      totalPrice: 50000,
      remainingBalance: 47500,
      currency: 'AED',
      status: 'awaiting_balance',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'mock-reservation-id-2',
      vehicle: {
        year: 2022,
        make: 'Honda',
        model: 'Accord',
        trim: 'Sport',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      },
      depositPaid: 3000,
      totalPrice: 60000,
      remainingBalance: 57000,
      currency: 'AED',
      status: 'deposit_paid',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2020-Mustang-id-3',
      vehicle: {
        year: 2020,
        make: 'Ford',
        model: 'Mustang',
        trim: 'GT',
        image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
      },
      depositPaid: 4000,
      totalPrice: 80000,
      remainingBalance: 0,
      currency: 'AED',
      status: 'completed',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'mock-reservation-id-4',
      vehicle: {
        year: 2019,
        make: 'BMW',
        model: 'X5',
        trim: 'xDrive40i',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
      },
      depositPaid: 5000,
      totalPrice: 100000,
      remainingBalance: 95000,
      currency: 'AED',
      status: 'expired',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
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
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }

  const filterReservations = (status: string) => {
    if (status === 'all') return reservations
    if (status === 'active')
      return reservations.filter((r) => ['deposit_paid', 'awaiting_balance'].includes(r.status))
    if (status === 'completed') return reservations.filter((r) => r.status === 'completed')
    if (status === 'expired') return reservations.filter((r) => r.status === 'expired')
    return reservations
  }

  const filteredReservations = filterReservations(activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Reservations</h1>
        <p className="text-muted-foreground">
          View and manage all your vehicle reservations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {reservations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {reservations.filter((r) => ['deposit_paid', 'awaiting_balance'].includes(r.status)).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">
              {reservations.filter((r) => r.status === 'completed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            <Badge variant="secondary" className="ml-2">
              {reservations.filter((r) => r.status === 'expired').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Car className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reservations Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  You don't have any {activeTab !== 'all' && activeTab} reservations yet.
                </p>
                <Button asChild>
                  <Link href="/inventory">Browse Vehicles</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => {
                const daysRemaining = getDaysRemaining(reservation.expiresAt)
                const isUrgent = daysRemaining <= 3 && daysRemaining > 0
                const statusBadge = getStatusBadge(reservation.status)

                return (
                  <Card key={reservation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Vehicle Image */}
                        <div className="w-full lg:w-48 h-36 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={reservation.vehicle.image}
                            alt={`${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Reservation Details */}
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold">
                                {reservation.vehicle.year} {reservation.vehicle.make}{' '}
                                {reservation.vehicle.model}
                              </h3>
                              {reservation.vehicle.trim && (
                                <p className="text-sm text-muted-foreground">
                                  {reservation.vehicle.trim}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
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
                            <Button asChild>
                              <Link href={`/my-account/reservations/${reservation.id}`}>
                                View Details
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </div>

                          {/* Payment Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                              <p className="font-semibold">
                                {formatCurrency(reservation.totalPrice, reservation.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Deposit Paid</p>
                              <p className="font-semibold text-emerald-600">
                                {formatCurrency(reservation.depositPaid, reservation.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
                              <p className="font-semibold">
                                {formatCurrency(reservation.remainingBalance, reservation.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {reservation.status === 'completed' ? 'Completed' : 'Expires'}
                              </p>
                              <p className="font-semibold text-sm">
                                {(reservation.status === 'completed'
                                  ? reservation.completedAt
                                  : reservation.expiresAt
                                )?.toLocaleDateString('en-AE', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Created Date */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Reserved on{' '}
                              {reservation.createdAt.toLocaleDateString('en-AE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
