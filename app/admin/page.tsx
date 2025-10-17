'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VehicleService } from '@/lib/services/vehicles'
import { CustomerService } from '@/lib/services/customers'
import { InquiryService } from '@/lib/services/inquiries'
import { InvoiceService } from '@/lib/services/invoices'
import { PaymentService } from '@/lib/services/payments'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Car,
  Users,
  MessageSquare,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  BarChart3,
  Activity,
  Truck,
  Package,
  Gavel,
  Ship,
  Building,
  Wrench
} from 'lucide-react'

interface DashboardStats {
  vehicles: {
    total: number
    available: number
    sold: number
    inTransit: number
  }
  customers: {
    total: number
    recent: number
    active: number
  }
  inquiries: {
    total: number
    new: number
    urgent: number
    resolved: number
  }
  financial: {
    totalInvoiceValue: number
    totalPayments: number
    pendingPayments: number
    thisMonthRevenue: number
  }
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  loading = false,
  currency
}: {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
  loading?: boolean
  currency?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-normal tracking-tight text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-semibold tracking-tight">
            {currency && typeof value === 'number' ? 
              new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value) : 
              value
            }
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className="flex items-center pt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-xs text-emerald-600">
                +{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [vehicleStatusCounts, setVehicleStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        vehicleStats,
        customerStats,
        inquiryStats,
        invoiceStats,
        paymentStats
      ] = await Promise.all([
        VehicleService.getStatistics(),
        CustomerService.getStatistics(),
        InquiryService.getStatistics(),
        InvoiceService.getStatistics(),
        PaymentService.getStatistics()
      ])

      // Calculate pipeline statuses from vehicle data
      const statusCounts = vehicleStats.success ? vehicleStats.data?.byStatus : {}
      setVehicleStatusCounts(statusCounts || {})

      // Debug: Log the data we're getting
      console.log('Dashboard Stats Debug:')
      console.log('Vehicle Stats:', vehicleStats)
      console.log('Status Counts:', statusCounts)
      console.log('Customer Stats:', customerStats)
      console.log('Inquiry Stats:', inquiryStats)
      console.log('Invoice Stats:', invoiceStats)
      console.log('Payment Stats:', paymentStats)

      const dashboardStats: DashboardStats = {
        vehicles: {
          total: vehicleStats.success ? vehicleStats.data?.total || 0 : 0,
          available: ((statusCounts || {})['ready_for_sale'] || 0) + ((statusCounts || {})['available'] || 0),
          sold: ((statusCounts || {})['sold'] || 0) + ((statusCounts || {})['delivered'] || 0),
          inTransit: ((statusCounts || {})['in_transit'] || 0) + ((statusCounts || {})['shipped'] || 0) +
                    ((statusCounts || {})['at_port'] || 0) + ((statusCounts || {})['customs_clearance'] || 0),
        },
        customers: {
          total: customerStats.success ? customerStats.data?.total || 0 : 0,
          recent: customerStats.success ? customerStats.data?.recent || 0 : 0,
          active: customerStats.success ? customerStats.data?.active || 0 : 0,
        },
        inquiries: {
          total: inquiryStats.success ? inquiryStats.data?.total || 0 : 0,
          new: inquiryStats.success ? inquiryStats.data?.byStatus?.new || 0 : 0,
          urgent: inquiryStats.success ? inquiryStats.data?.byPriority?.urgent || 0 : 0,
          resolved: inquiryStats.success ? inquiryStats.data?.byStatus?.resolved || 0 : 0,
        },
        financial: {
          totalInvoiceValue: invoiceStats.success ? invoiceStats.data?.totalValue?.AED || 0 : 0,
          totalPayments: paymentStats.success ? paymentStats.data?.totalValue?.AED || 0 : 0,
          pendingPayments: invoiceStats.success ?
            (invoiceStats.data?.byStatus?.totals?.sent || 0) + (invoiceStats.data?.byStatus?.totals?.partially_paid || 0) : 0,
          thisMonthRevenue: paymentStats.success ? paymentStats.data?.totalValue?.AED || 0 : 0,
        }
      }

      setStats(dashboardStats)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Business Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats?.financial.totalPayments || 0}
          description="All payments received"
          icon={DollarSign}
          loading={loading}
          currency="AED"
          trend={{ value: 15, label: "from last month" }}
        />
        <StatCard
          title="Total Vehicles"
          value={stats?.vehicles.total || 0}
          description="In inventory"
          icon={Car}
          loading={loading}
          trend={{ value: 12, label: "from last month" }}
        />
        <StatCard
          title="Active Customers"
          value={stats?.customers.total || 0}
          description={`${stats?.customers.recent || 0} new this month`}
          icon={Users}
          loading={loading}
          trend={{ value: 8, label: "from last month" }}
        />
        <StatCard
          title="Open Inquiries"
          value={stats?.inquiries.new || 0}
          description={stats?.inquiries.urgent ? `${stats.inquiries.urgent} urgent` : "No urgent inquiries"}
          icon={MessageSquare}
          loading={loading}
        />
      </div>

      {/* Vehicle Pipeline */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Vehicle Pipeline</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Auction Won"
            value={vehicleStatusCounts['auction_won'] || vehicleStatusCounts['pending_pickup'] || 0}
            description="Awaiting shipment"
            icon={Gavel}
            loading={loading}
          />
          <StatCard
            title="In Transit"
            value={stats?.vehicles.inTransit || 0}
            description="Shipping to UAE"
            icon={Ship}
            loading={loading}
          />
          <StatCard
            title="Customs Processing"
            value={vehicleStatusCounts['customs_clearance'] || 0}
            description="Clearing customs"
            icon={Building}
            loading={loading}
          />
          <StatCard
            title="Ready for Sale"
            value={stats?.vehicles.available || 0}
            description="Available inventory"
            icon={CheckCircle}
            loading={loading}
          />
        </div>
      </div>

      {/* Financial Flow */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Financial Flow</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue This Month"
            value={stats?.financial.thisMonthRevenue || 0}
            description="Current month earnings"
            icon={TrendingUp}
            loading={loading}
            currency="AED"
          />
          <StatCard
            title="Outstanding Invoices"
            value={stats?.financial.pendingPayments || 0}
            description="Awaiting payment"
            icon={Clock}
            loading={loading}
            currency="AED"
          />
          <StatCard
            title="Inventory Value"
            value={stats?.financial.totalInvoiceValue || 0}
            description="Total vehicle value"
            icon={Package}
            loading={loading}
            currency="AED"
          />
          <StatCard
            title="Monthly Target"
            value={500000}
            description="Sales goal (AED 500K)"
            icon={BarChart3}
            loading={loading}
            currency="AED"
          />
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {stats?.vehicles.inTransit && stats.vehicles.inTransit > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Vehicles in Transit</span>
                      </div>
                      <span className="text-sm font-medium">{stats.vehicles.inTransit}</span>
                    </div>
                  )}
                  
                  {stats?.inquiries.urgent && stats.inquiries.urgent > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-muted-foreground">Urgent Inquiries</span>
                      </div>
                      <span className="text-sm font-medium text-destructive">{stats.inquiries.urgent}</span>
                    </div>
                  )}
                  
                  {stats?.financial.pendingPayments && stats.financial.pendingPayments > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pending Payments</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(stats.financial.pendingPayments)}
                      </span>
                    </div>
                  )}
                  
                  {stats?.inquiries.new && stats.inquiries.new > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">New Inquiries</span>
                      </div>
                      <span className="text-sm font-medium">{stats.inquiries.new}</span>
                    </div>
                  )}

                  {(!stats?.inquiries.new && !stats?.inquiries.urgent && !stats?.financial.pendingPayments && !stats?.vehicles.inTransit) && (
                    <div className="text-center text-muted-foreground py-4">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                      <p className="text-xs">All caught up! No urgent items need attention.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasPermission('create_vehicles') && (
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/vehicles/new">
                  <Gavel className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Link>
              </Button>
            )}
            {hasPermission('manage_customers') && (
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/customers">
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </Link>
              </Button>
            )}
            {hasPermission('manage_finances') && (
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              </Button>
            )}
            {hasPermission('manage_inquiries') && (
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/inquiries">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Log Inquiry
                </Link>
              </Button>
            )}
            {hasPermission('view_reports') && (
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/reports/sales">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Overview */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Navigation</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hasPermission('view_vehicles') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/admin/vehicles">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-tight text-muted-foreground">
                    <Car className="h-4 w-4" />
                    Vehicle Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-semibold tracking-tight">{stats?.vehicles.total || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats?.vehicles.available || 0} Available
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage inventory and sales
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}

          {hasPermission('view_customers') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/admin/customers">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-tight text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Customer Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-semibold tracking-tight">{stats?.customers.total || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats?.customers.recent || 0} New
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Track inquiries and relationships
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}

          {hasPermission('view_finances') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/admin/invoices">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-tight text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Financial Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold tracking-tight">
                      {loading ? "..." : formatCurrency(stats?.financial.totalPayments || 0)}
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Handle invoices and payments
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}