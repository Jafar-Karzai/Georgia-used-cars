'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ShoppingCart,
  Wallet,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react'

export default function AdminReservationsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock reservations data
  const reservations = [
    {
      id: 'RES-001',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+971 50 123 4567',
      },
      vehicle: {
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        vin: '4T1BF1FK5CU123456',
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
      id: 'RES-002',
      customer: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+971 55 987 6543',
      },
      vehicle: {
        year: 2022,
        make: 'Honda',
        model: 'Accord',
        vin: '1HGCV1F36NA123456',
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
      id: 'RES-003',
      customer: {
        name: 'Ahmed Al-Mansoori',
        email: 'ahmed@example.com',
        phone: '+971 52 456 7890',
      },
      vehicle: {
        year: 2020,
        make: 'Ford',
        model: 'Mustang',
        vin: '1FA6P8TH0L5123456',
      },
      depositPaid: 4000,
      totalPrice: 80000,
      remainingBalance: 0,
      currency: 'AED',
      status: 'completed',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'RES-004',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+971 56 234 5678',
      },
      vehicle: {
        year: 2023,
        make: 'Tesla',
        model: 'Model 3',
        vin: '5YJ3E1EA2NF123456',
      },
      depositPaid: 3500,
      totalPrice: 70000,
      remainingBalance: 66500,
      currency: 'AED',
      status: 'balance_uploaded',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'RES-005',
      customer: {
        name: 'Mohammed Hassan',
        email: 'mohammed@example.com',
        phone: '+971 50 888 9999',
      },
      vehicle: {
        year: 2019,
        make: 'BMW',
        model: 'X5',
        vin: 'WBAKB6C50AK123456',
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

  // Calculate statistics
  const stats = {
    total: reservations.length,
    active: reservations.filter((r) =>
      ['deposit_paid', 'awaiting_balance', 'balance_uploaded'].includes(r.status)
    ).length,
    completed: reservations.filter((r) => r.status === 'completed').length,
    totalRevenue: reservations
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.totalPrice, 0),
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      deposit_paid: { label: 'Deposit Paid', className: 'bg-blue-100 text-blue-800' },
      awaiting_balance: { label: 'Awaiting Balance', className: 'bg-amber-100 text-amber-800' },
      balance_uploaded: { label: 'Receipt Uploaded', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
      expired: { label: 'Expired', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    }
    return statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }

  const getDaysRemaining = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' &&
        ['deposit_paid', 'awaiting_balance', 'balance_uploaded'].includes(reservation.status)) ||
      reservation.status === statusFilter

    const matchesSearch =
      searchQuery === '' ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Reservations</h1>
        <p className="text-muted-foreground">
          Manage vehicle reservations and track payments
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reservations
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Reservations
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Sales
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Vehicles sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">From completed sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, customer, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                <SelectItem value="awaiting_balance">Awaiting Balance</SelectItem>
                <SelectItem value="balance_uploaded">Receipt Uploaded</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reservation ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No reservations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map((reservation) => {
                  const statusBadge = getStatusBadge(reservation.status)
                  const daysRemaining = reservation.expiresAt
                    ? getDaysRemaining(reservation.expiresAt)
                    : null
                  const isUrgent = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0

                  return (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono font-semibold">
                        {reservation.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {reservation.customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {reservation.vehicle.year} {reservation.vehicle.make}{' '}
                            {reservation.vehicle.model}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {reservation.vehicle.vin}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-emerald-600">
                          {formatCurrency(reservation.depositPaid, reservation.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(reservation.remainingBalance, reservation.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {daysRemaining !== null ? (
                          <div className={isUrgent ? 'text-red-600 font-semibold' : ''}>
                            {daysRemaining > 0 ? (
                              <>
                                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                {isUrgent && (
                                  <AlertCircle className="inline-block h-3 w-3 ml-1" />
                                )}
                              </>
                            ) : (
                              'Expired'
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/reservations/${reservation.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
