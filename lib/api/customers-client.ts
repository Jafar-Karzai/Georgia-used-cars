import { supabase } from '@/lib/supabase/client'

export interface CustomerFilters {
  search?: string
  city?: string
  country?: string
  marketingConsent?: boolean
  createdFrom?: string
  createdTo?: string
}

const toQuery = (params: Record<string, any>) => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    usp.set(k, String(v))
  })
  return usp.toString()
}

export async function fetchCustomers(filters: CustomerFilters = {}, page = 1, limit = 20) {
  const qs = toQuery({ ...filters, page, limit })
  const res = await fetch(`/api/customers?${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Customers fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCustomerById(id: string) {
  const res = await fetch(`/api/customers/${id}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(`Customer fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCustomerStats() {
  const res = await fetch('/api/customers/stats', { credentials: 'include' })
  if (!res.ok) throw new Error(`Customer stats fetch failed: ${res.status}`)
  return res.json()
}

export async function createCustomer(data: any) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch('/api/customers', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateCustomer(id: string, data: any) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteCustomer(id: string) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {}

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
  return res.json()
}
