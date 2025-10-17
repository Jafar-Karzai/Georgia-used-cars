'use client'

import { useState, useEffect, useMemo } from 'react'
import { InquiryService, InquiryWithDetails, InquiryFilters } from '@/lib/services/inquiries'
import { InquiryForm } from '@/components/inquiries/inquiry-form'
import { CommunicationForm } from '@/components/communications/communication-form'
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
  MessageSquare, 
  AlertCircle, 
  Clock,
  CheckCircle,
  Eye,
  Edit,
  MessageCircle,
  UserCheck,
  Car,
  Phone,
  Mail,
  Globe,
  Users,
  Calendar
} from 'lucide-react'

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [showCommunicationForm, setShowCommunicationForm] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<InquiryFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null)
  
  const { hasPermission, user } = useAuth()
  const canManageInquiries = hasPermission('manage_inquiries')

  const filtersStringified = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    loadInquiries()
    loadStatistics()
  }, [page, filtersStringified])

  const loadInquiries = async () => {
    setLoading(true)
    
    const searchFilters = {
      ...filters,
      ...(searchTerm && { search: searchTerm })
    }

    const result = await InquiryService.getAll(searchFilters, page, 20)
    
    if (result.success) {
      setInquiries(result.data as unknown as InquiryWithDetails[] || [])
      setTotalPages(result.pagination?.pages || 1)
    } else {
      console.error('Failed to load inquiries:', result.error)
    }
    
    setLoading(false)
  }

  const loadStatistics = async () => {
    const result = await InquiryService.getStatistics(filters)
    if (result.success) {
      setStatistics(result.data)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadInquiries()
  }

  const handleFilterChange = (key: keyof InquiryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setPage(1)
  }

  const handleAssignToMe = async (inquiryId: string) => {
    if (!user) return
    
    const result = await InquiryService.assign(inquiryId, user.id)
    if (result.success) {
      loadInquiries()
      loadStatistics()
    } else {
      alert('Failed to assign inquiry: ' + result.error)
    }
  }

  const handleStatusChange = async (inquiryId: string, status: string) => {
    const result = await InquiryService.update(inquiryId, { status: status as any })
    if (result.success) {
      loadInquiries()
      loadStatistics()
    } else {
      alert('Failed to update status: ' + result.error)
    }
  }

  const handleAddCommunication = (inquiry: InquiryWithDetails) => {
    setSelectedInquiry(inquiry)
    setShowCommunicationForm(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'responded': 'bg-purple-100 text-purple-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getSourceIcon = (source: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'website': <Globe className="h-3 w-3" />,
      'phone': <Phone className="h-3 w-3" />,
      'email': <Mail className="h-3 w-3" />,
      'social_media': <MessageSquare className="h-3 w-3" />,
      'referral': <Users className="h-3 w-3" />,
      'walk_in': <UserCheck className="h-3 w-3" />
    }
    return icons[source] || <MessageSquare className="h-3 w-3" />
  }

  if (loading && inquiries.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inquiry Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer inquiries and communications
          </p>
        </div>
        
        {canManageInquiries && (
          <Button onClick={() => setShowInquiryForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Inquiry
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All inquiries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New & In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics.byStatus.new || 0) + (statistics.byStatus.in_progress || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.byPriority.urgent || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Urgent inquiries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.byStatus.resolved || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully resolved
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search inquiries by subject or message..."
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
          
          <Select onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('priority', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('source', value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="walk_in">Walk-in</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => handleFilterChange('assignedTo', user?.id || '')}
            className="whitespace-nowrap"
          >
            My Inquiries
          </Button>
        </div>
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof InquiryFilters]) 
              ? 'No inquiries match your filters' 
              : 'No inquiries found'}
          </div>
          {canManageInquiries && !searchTerm && Object.keys(filters).length === 0 && (
            <Button onClick={() => setShowInquiryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Inquiry
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {inquiries.map((inquiry) => (
              <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(inquiry.priority)}>
                          {inquiry.priority.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getSourceIcon(inquiry.source)}
                          {inquiry.source.replace('_', ' ')}
                        </div>
                        {inquiry.vehicle && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Car className="h-3 w-3" />
                            {inquiry.vehicle.year} {inquiry.vehicle.make} {inquiry.vehicle.model}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-lg mb-1">{inquiry.subject}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {inquiry.message}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {inquiry.customer?.fullName}
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(inquiry.createdAt.toISOString())}
                        </div>
                        
                        {inquiry.assignedToProfile && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Assigned to {inquiry.assignedToProfile?.fullName}
                          </div>
                        )}
                        
                        {inquiry.communicationsCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {inquiry.communicationsCount} communications
                          </div>
                        )}
                      </div>

                      {inquiry.lastCommunication && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Last communication: {formatDateTime(inquiry.lastCommunication.toISOString())}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {canManageInquiries && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddCommunication(inquiry)}
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            {!inquiry.assignedTo && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignToMe(inquiry.id)}
                                className="text-xs"
                              >
                                Assign to Me
                              </Button>
                            )}
                            
                            {inquiry.status === 'new' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(inquiry.id, 'in_progress')}
                                className="text-xs"
                              >
                                Start Working
                              </Button>
                            )}
                            
                            {inquiry.status === 'in_progress' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(inquiry.id, 'resolved')}
                                className="text-xs"
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </div>
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
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Inquiry Form */}
      <InquiryForm
        isOpen={showInquiryForm}
        onClose={() => setShowInquiryForm(false)}
        onSuccess={() => {
          loadInquiries()
          loadStatistics()
        }}
      />

      {/* Communication Form */}
      <CommunicationForm
        isOpen={showCommunicationForm}
        onClose={() => {
          setShowCommunicationForm(false)
          setSelectedInquiry(null)
        }}
        onSuccess={() => {
          loadInquiries()
          loadStatistics()
        }}
        customerId={selectedInquiry?.customerId}
        inquiryId={selectedInquiry?.id}
      />
    </div>
  )
}