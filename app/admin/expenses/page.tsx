'use client'

import { useState, useEffect, useMemo } from 'react'
import { ExpenseService, Expense, ExpenseFilters } from '@/lib/services/expenses'
import { ExpenseForm } from '@/components/expenses/expense-form'
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
  DollarSign, 
  FileText, 
  Calendar,
  Building,
  Car,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<any>(null)
  
  const { hasPermission } = useAuth()
  const canManageFinances = hasPermission('manage_finances')

  const filtersStringified = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    loadExpenses()
    loadStatistics()
  }, [page, filtersStringified])

  const loadExpenses = async () => {
    setLoading(true)
    
    const searchFilters = {
      ...filters,
      ...(searchTerm && { search: searchTerm })
    }

    const result = await ExpenseService.getAll(searchFilters, page, 20)
    
    if (result.success) {
      setExpenses(result.data || [])
      setTotalPages(result.pagination?.pages || 1)
    } else {
      console.error('Failed to load expenses:', result.error)
    }
    
    setLoading(false)
  }

  const loadStatistics = async () => {
    const result = await ExpenseService.getStatistics(filters)
    if (result.success) {
      setStatistics(result.data)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadExpenses()
  }

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }))
    setPage(1)
  }

  const formatPrice = (amount: number | { toString: () => string }, currency: string) => {
    const numAmount = typeof amount === 'number' ? amount : Number(amount.toString())
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED'
    }).format(numAmount)
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'acquisition': 'bg-blue-100 text-blue-800',
      'transportation': 'bg-purple-100 text-purple-800',
      'import': 'bg-orange-100 text-orange-800',
      'enhancement': 'bg-green-100 text-green-800',
      'marketing': 'bg-pink-100 text-pink-800',
      'operational': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'acquisition': 'Acquisition',
      'transportation': 'Transportation',
      'import': 'Import',
      'enhancement': 'Enhancement',
      'marketing': 'Marketing',
      'operational': 'Operational'
    }
    return labels[category] || category
  }

  if (loading && expenses.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage all business expenses
          </p>
        </div>
        
        {canManageFinances && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(statistics.total, 'AED')}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicle Expenses</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(
                  (statistics.byCategory.acquisition || 0) + 
                  (statistics.byCategory.transportation || 0) + 
                  (statistics.byCategory.import || 0) + 
                  (statistics.byCategory.enhancement || 0),
                  'AED'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Vehicle-related costs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operational</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(statistics.byCategory.operational || 0, 'AED')}
              </div>
              <p className="text-xs text-muted-foreground">
                Business operations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketing</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(statistics.byCategory.marketing || 0, 'AED')}
              </div>
              <p className="text-xs text-muted-foreground">
                Marketing & advertising
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search expenses..."
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
          
          <Select onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="acquisition">Acquisition</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="import">Import</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('currency', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From date"
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-40"
          />

          <Input
            type="date"
            placeholder="To date"
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).some(key => filters[key as keyof ExpenseFilters]) 
              ? 'No expenses match your filters' 
              : 'No expenses found'}
          </div>
          {canManageFinances && !searchTerm && Object.keys(filters).length === 0 && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Expense
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getCategoryColor(expense.category)}>
                          {getCategoryLabel(expense.category)}
                        </Badge>
                        {expense.subcategory && (
                          <Badge variant="outline">{expense.subcategory}</Badge>
                        )}
                        {expense.vehicle && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Car className="h-3 w-3" />
                            {expense.vehicle.year} {expense.vehicle.make} {expense.vehicle.model}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-lg mb-1">{expense.description}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </div>
                        
                        {expense.vendor && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {expense.vendor}
                          </div>
                        )}
                        
                        {expense.receiptUrl && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Receipt available
                          </div>
                        )}
                      </div>
                      
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{expense.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPrice(expense.amount, expense.currency)}
                      </div>
                      
                      {canManageFinances && (
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
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

      {/* Expense Form */}
      <ExpenseForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          loadExpenses()
          loadStatistics()
        }}
      />
    </div>
  )
}