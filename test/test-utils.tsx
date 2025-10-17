import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Import Supabase mock
export { mockSupabaseClient } from './mocks/supabase'

// Mock Next Auth session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'manager',
  },
  expires: '2024-12-31',
}

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'manager',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockVehicle = (overrides = {}) => ({
  id: 'test-vehicle-id',
  vin: '1HGBH41JXMN109186',
  year: 2021,
  make: 'Honda',
  model: 'Civic',
  trim: 'LX',
  color: 'White',
  mileage: 25000,
  status: 'ready_for_sale',
  auction_house: 'Copart',
  lot_number: '12345',
  sale_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  invoice_number: 'INV-2024-0001',
  customer_id: 'test-customer-id',
  vehicle_id: 'test-vehicle-id',
  subtotal: 25000,
  vat_amount: 1250,
  total_amount: 26250,
  status: 'draft',
  currency: 'AED',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+971501234567',
  address: 'Dubai, UAE',
  type: 'individual',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})