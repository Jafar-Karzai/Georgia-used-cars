import { supabase } from '@/lib/supabase/client'

export interface VehicleListFilters {
  status?: string
  make?: string
  model?: string
  auction_house?: string
  is_public?: boolean
  year_min?: number
  year_max?: number
  price_min?: number
  price_max?: number
  search?: string
}

const toQuery = (params: Record<string, any>) => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    usp.set(k, String(v))
  })
  return usp.toString()
}

export async function fetchVehicles(filters: VehicleListFilters = {}, page = 1, limit = 20) {
  const qs = toQuery({ ...filters, page, limit })
  const res = await fetch(`/api/vehicles?${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Vehicles fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchVehicleById(id: string) {
  const res = await fetch(`/api/vehicles/${id}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(`Vehicle fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchVehicleStats() {
  const res = await fetch('/api/vehicles/stats', { credentials: 'include' })
  if (!res.ok) throw new Error(`Vehicle stats fetch failed: ${res.status}`)
  return res.json()
}

export async function updateVehicle(id: string, data: any) {
  // Get access token from Supabase session for authentication
  const { data: session } = await supabase.auth.getSession()
  const accessToken = session?.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  // Include Authorization header if we have an access token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`/api/vehicles/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

