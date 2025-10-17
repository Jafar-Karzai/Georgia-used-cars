'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseService } from '@/lib/services/expenses'
import { Expense } from '@/types/database'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

interface EditExpensePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditExpensePage({ params: paramsPromise }: EditExpensePageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const router = useRouter()
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (!user || !hasPermission('manage_expenses')) {
      router.push('/admin')
      return
    }

    if (params?.id) {
      loadExpense()
    }
  }, [user, hasPermission, router, params?.id])

  useEffect(() => {
    if (expense) {
      setIsFormOpen(true)
    }
  }, [expense])

  const loadExpense = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await ExpenseService.getById(params.id)
      
      if (result.success && result.data) {
        setExpense(result.data)
      } else {
        setError(result.error || 'Expense not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/admin/expenses')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    router.push('/admin/expenses')
  }

  if (!user || !hasPermission('manage_expenses')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading expense...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Expense Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested expense could not be found.'}
            </p>
            <button 
              onClick={() => router.push('/admin/expenses')}
              className="text-primary hover:underline"
            >
              Return to Expense List
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialData={{
          vehicleId: expense.vehicleId || '',
          category: expense.category,
          subcategory: expense.subcategory || '',
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          date: expense.date,
          vendor: expense.vendor || '',
          notes: expense.notes || ''
        }}
        vehicleId={expense.vehicleId}
        isEdit={true}
        expenseId={expense.id}
      />
    </div>
  )
}