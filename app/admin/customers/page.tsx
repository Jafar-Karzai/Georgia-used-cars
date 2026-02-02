'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchCustomers, fetchCustomerStats, deleteCustomer, type CustomerFilters } from '@/lib/api/customers-client'
import { CustomerForm } from '@/components/customers/customer-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth/context'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  MessageSquare, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface CustomerWithStats {
  id: string
  email?: string | null
  fullName: string
  phone?: string | null
  address?: string | null
  city?: string | null
  country: string
  dateOfBirth?: Date | null
  preferredLanguage: string
  marketingConsent: boolean
  createdAt: Date
  updatedAt: Date
  inquiryCount?: number
  lastInquiryDate?: Date
  totalPurchases?: number
  totalSpent?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CustomerFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  
  const { hasPermission } = useAuth()
  const canManageCustomers = hasPermission('manage_customers') || hasPermission('manage_inquiries')

  const filtersStringified = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    loadCustomers()
    loadStatistics()
  }, [page, filtersStringified])

  const loadCustomers = async () => {
    setLoading(true)

    try {
      const searchFilters = {
        ...filters,
        ...(searchTerm && { search: searchTerm })
      }

      const result = await fetchCustomers(searchFilters, page, 20)

      if (result.success) {
        setCustomers(result.data || [])
        setTotalPages(result.pagination?.pages || 1)
      } else {
        console.error('Failed to load customers:', result.error)
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const result = await fetchCustomerStats()
      if (result.success) {
        setStatistics(result.data?.overview)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadCustomers()
  }

  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
    setPage(1)
  }

  const handleEdit = (customer: CustomerWithStats) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteCustomer(customerId)
      if (result.success) {
        loadCustomers()
        loadStatistics()
      } else {
        alert('Failed to delete customer: ' + result.error)
      }
    } catch (error) {
      alert('Failed to delete customer: ' + error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'UAE': '🇦🇪',
      'Saudi Arabia': '🇸🇦',
      'Kuwait': '🇰🇼',
      'Qatar': '🇶🇦',
      'Bahrain': '🇧🇭',
      'Oman': '🇴🇲'
    }
    return flags[country] || '🌍'
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount)
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-6 w-96" />
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="pb-3 pt-6">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles, inquiries, and purchase history
          </p>
        </div>
        
        {canManageCustomers && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All registered customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Customers</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.recent}</div>
              <p className="text-xs text-muted-foreground">
                Added in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.active}</div>
              <p className="text-xs text-muted-foreground">
                With recent inquiries
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select onValueChange={(value) => handleFilterChange('country', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
              <SelectItem value="Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
              <SelectItem value="Kuwait">🇰🇼 Kuwait</SelectItem>
              <SelectItem value="Qatar">🇶🇦 Qatar</SelectItem>
              <SelectItem value="Bahrain">🇧🇭 Bahrain</SelectItem>
              <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('marketingConsent', value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Marketing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="true">Marketing Consent</SelectItem>
              <SelectItem value="false">No Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof CustomerFilters]) 
              ? 'No customers match your filters' 
              : 'No customers found'}
          </div>
          {canManageCustomers && !searchTerm && Object.keys(filters).length === 0 && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Customer
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-card-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-medium text-lg">{customer.fullName}</h3>
                        {customer.marketingConsent ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marketing OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Marketing
                          </Badge>
                        )}
                        {customer.country && (
                          <Badge variant="outline">
                            {getCountryFlag(customer.country)} {customer.country}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        
                        {customer.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.city}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(customer.createdAt.toISOString())}
                        </div>
                      </div>
                      
                      {customer.preferredLanguage && customer.preferredLanguage !== 'en' && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <Globe className="h-3 w-3" />
                          Speaks {customer.preferredLanguage.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {customer.inquiryCount || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Inquiries</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {customer.totalPurchases || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Purchases</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {customer.totalSpent ? formatPrice(customer.totalSpent) : '---'}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Spent</div>
                        </div>
                      </div>
                      
                      {customer.lastInquiryDate && (
                        <div className="text-xs text-muted-foreground mb-3">
                          Last inquiry: {formatDate(customer.lastInquiryDate.toISOString())}
                        </div>
                      )}
                      
                      {canManageCustomers && (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-10"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page</span>
                <span className="font-medium">{page}</span>
                <span className="text-sm text-muted-foreground">of</span>
                <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="h-10"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Customer Form */}
      <CustomerForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCustomer(null)
        }}
        onSuccess={() => {
          loadCustomers()
          loadStatistics()
        }}
        initialData={editingCustomer || undefined}
        isEdit={!!editingCustomer}
        customerId={editingCustomer?.id}
      />
    </div>
  )
}