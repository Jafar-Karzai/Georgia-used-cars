import { http, HttpResponse } from 'msw'
import { createMockVehicle, createMockInvoice, createMockCustomer } from '../test-utils'

// Mock data
const mockVehicles = [
  createMockVehicle({ id: '1', vin: '1HGBH41JXMN109186' }),
  createMockVehicle({ id: '2', vin: '1FTFW1ET5DFC10312', make: 'Ford', model: 'F-150' }),
]

const mockInvoices = [
  createMockInvoice({ id: '1', invoice_number: 'INV-2024-0001' }),
  createMockInvoice({ id: '2', invoice_number: 'INV-2024-0002' }),
]

const mockCustomers = [
  createMockCustomer({ id: '1', name: 'John Doe' }),
  createMockCustomer({ id: '2', name: 'Jane Smith' }),
]

// API handlers
export const handlers = [
  // Vehicles
  http.get('/api/vehicles', () => {
    return HttpResponse.json({ data: mockVehicles, error: null })
  }),

  http.get('/api/vehicles/:id', ({ params }) => {
    const vehicle = mockVehicles.find(v => v.id === params.id)
    if (!vehicle) {
      return HttpResponse.json({ data: null, error: 'Vehicle not found' }, { status: 404 })
    }
    return HttpResponse.json({ data: vehicle, error: null })
  }),

  http.post('/api/vehicles', async ({ request }) => {
    const newVehicle = await request.json() as any
    const vehicle = createMockVehicle({ ...newVehicle, id: Date.now().toString() })
    return HttpResponse.json({ data: vehicle, error: null }, { status: 201 })
  }),

  http.put('/api/vehicles/:id', async ({ params, request }) => {
    const updates = await request.json() as any
    const vehicle = createMockVehicle({ ...updates, id: params.id as string })
    return HttpResponse.json({ data: vehicle, error: null })
  }),

  http.delete('/api/vehicles/:id', ({ params }) => {
    return HttpResponse.json({ data: { id: params.id }, error: null })
  }),

  // Invoices
  http.get('/api/invoices', () => {
    return HttpResponse.json({ data: mockInvoices, error: null })
  }),

  http.get('/api/invoices/:id', ({ params }) => {
    const invoice = mockInvoices.find(i => i.id === params.id)
    if (!invoice) {
      return HttpResponse.json({ data: null, error: 'Invoice not found' }, { status: 404 })
    }
    return HttpResponse.json({ data: invoice, error: null })
  }),

  http.post('/api/invoices', async ({ request }) => {
    const newInvoice = await request.json() as any
    const invoice = createMockInvoice({ ...newInvoice, id: Date.now().toString() })
    return HttpResponse.json({ data: invoice, error: null }, { status: 201 })
  }),

  // Customers
  http.get('/api/customers', () => {
    return HttpResponse.json({ data: mockCustomers, error: null })
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = mockCustomers.find(c => c.id === params.id)
    if (!customer) {
      return HttpResponse.json({ data: null, error: 'Customer not found' }, { status: 404 })
    }
    return HttpResponse.json({ data: customer, error: null })
  }),

  http.post('/api/customers', async ({ request }) => {
    const newCustomer = await request.json() as any
    const customer = createMockCustomer({ ...newCustomer, id: Date.now().toString() })
    return HttpResponse.json({ data: customer, error: null }, { status: 201 })
  }),

  // VIN Decoder API
  http.get('https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/:vin', ({ params }) => {
    return HttpResponse.json({
      Results: [
        { Variable: 'Make', Value: 'Honda' },
        { Variable: 'Model', Value: 'Civic' },
        { Variable: 'Model Year', Value: '2021' },
        { Variable: 'Vehicle Type', Value: 'PASSENGER CAR' },
      ]
    })
  }),
]