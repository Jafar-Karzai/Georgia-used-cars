import { supabase } from '@/lib/supabase/client'

export interface InquiryFilters {
  search?: string
  status?: string
  priority?: string
  source?: string
  assignedTo?: string
  customerId?: string
  vehicleId?: string
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

export async function fetchInquiries(filters: InquiryFilters = {}, page = 1, limit = 20) {
  const qs = toQuery({ ...filters, page, limit })
  const res = await fetch(`/api/inquiries?${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Inquiries fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchInquiryById(id: string) {
  const res = await fetch(`/api/inquiries/${id}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(`Inquiry fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchInquiryStats(filters: InquiryFilters = {}) {
  const qs = toQuery(filters)
  const res = await fetch(`/api/inquiries/stats?${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Inquiry stats fetch failed: ${res.status}`)
  return res.json()
}

export async function createInquiry(data: any) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateInquiry(id: string, data: any) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`/api/inquiries/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function assignInquiry(id: string, userId: string) {
  return updateInquiry(id, {
    assignedTo: userId,
    status: 'in_progress'
  })
}

export async function deleteInquiry(id: string) {
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {}

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`/api/inquiries/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
  return res.json()
}
