# Testing Guidelines and Patterns

This document outlines the comprehensive testing strategy, guidelines, and patterns for the Georgia Used Cars application.

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing Guidelines](#unit-testing-guidelines)
4. [Component Testing Guidelines](#component-testing-guidelines)
5. [Integration Testing Guidelines](#integration-testing-guidelines)
6. [End-to-End Testing Guidelines](#end-to-end-testing-guidelines)
7. [Test Data Management](#test-data-management)
8. [Testing Patterns and Best Practices](#testing-patterns-and-best-practices)
9. [CI/CD Testing Pipeline](#cicd-testing-pipeline)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Testing Strategy Overview

Our testing strategy follows a comprehensive approach with multiple layers of testing to ensure application reliability, performance, and user experience quality.

### Testing Objectives

- **Reliability**: Ensure core business functionality works correctly
- **Performance**: Validate application performance under various conditions
- **User Experience**: Verify complete user workflows and journeys
- **Business Logic**: Test profit & loss calculations and financial tracking
- **Data Integrity**: Ensure data consistency across the application
- **Security**: Validate authentication and authorization mechanisms

## Testing Pyramid

```
        /\
       /  \
      / E2E \     ← Few, comprehensive workflow tests
     /______\
    /        \
   / Integration \  ← API endpoints, database interactions
  /______________\
 /              \
/ Unit & Component \  ← Many, fast, focused tests
\__________________/
```

### Test Distribution
- **Unit & Component Tests**: 70% - Fast, isolated, focused
- **Integration Tests**: 20% - API endpoints, service layer
- **End-to-End Tests**: 10% - Critical user workflows

## Unit Testing Guidelines

### Framework and Tools
- **Test Runner**: Vitest
- **Testing Library**: @testing-library/react
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Vitest coverage reports

### Unit Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup common test data
  })

  describe('Feature Group', () => {
    it('should describe specific behavior', () => {
      // Arrange
      const props = { /* test props */ }
      
      // Act
      render(<Component {...props} />)
      
      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })
})
```

### Unit Test Patterns

#### 1. Service Layer Testing
```typescript
describe('VehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate profit correctly', async () => {
    const vehicle = { purchasePrice: 20000, expenses: 5000 }
    const salePrice = 30000
    
    const result = VehicleService.calculateProfit(vehicle, salePrice)
    
    expect(result.profit).toBe(5000)
    expect(result.margin).toBe(16.67)
  })
})
```

#### 2. Component Testing with User Interactions
```typescript
it('should update status when button clicked', async () => {
  const onStatusUpdate = vi.fn()
  const user = userEvent.setup()
  
  render(<StatusTracker onStatusUpdate={onStatusUpdate} />)
  
  await user.click(screen.getByText('Update Status'))
  await user.selectOptions(screen.getByRole('combobox'), 'sold')
  await user.click(screen.getByText('Confirm'))
  
  expect(onStatusUpdate).toHaveBeenCalledWith('sold')
})
```

## Component Testing Guidelines

### Testing Strategies

#### 1. Presentation Components
Focus on props rendering and user interactions:

```typescript
describe('VehicleCard', () => {
  const mockVehicle = {
    id: '1',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    current_status: 'ready_for_sale'
  }

  it('should display vehicle information correctly', () => {
    render(<VehicleCard vehicle={mockVehicle} />)
    
    expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
    expect(screen.getByText('Ready For Sale')).toBeInTheDocument()
  })
})
```

#### 2. Form Components
Test validation, submission, and error handling:

```typescript
describe('VehicleForm', () => {
  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(<VehicleForm />)
    
    await user.click(screen.getByText('Submit'))
    
    expect(screen.getByText('VIN is required')).toBeInTheDocument()
    expect(screen.getByText('Make is required')).toBeInTheDocument()
  })
})
```

#### 3. Data Display Components
Test data formatting and edge cases:

```typescript
describe('ProfitLossDisplay', () => {
  it('should format currency correctly', () => {
    const data = { profit: 5000, currency: 'USD' }
    render(<ProfitLossDisplay data={data} />)
    
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('should show loss in red color', () => {
    const data = { profit: -2000, currency: 'USD' }
    render(<ProfitLossDisplay data={data} />)
    
    const lossElement = screen.getByText('-$2,000.00')
    expect(lossElement).toHaveClass('text-red-600')
  })
})
```

### Component Test Best Practices

1. **Test User Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal component state
   - Test component contracts (props and callbacks)

2. **Use Meaningful Test Data**
   - Use realistic data that represents actual use cases
   - Test edge cases (empty data, null values, large datasets)

3. **Mock External Dependencies**
   - Mock API calls with MSW
   - Mock navigation and routing
   - Mock complex child components when testing parent logic

## Integration Testing Guidelines

### API Testing Patterns

#### 1. Service Integration Tests
```typescript
describe('Vehicle API Integration', () => {
  beforeEach(() => {
    setupMSW()
  })

  it('should create vehicle with profit calculation', async () => {
    const vehicleData = {
      vin: 'TEST123',
      purchasePrice: 20000,
      expenses: [
        { category: 'shipping', amount: 1500 },
        { category: 'enhancement', amount: 3000 }
      ]
    }

    const result = await VehicleService.create(vehicleData)
    
    expect(result.success).toBe(true)
    expect(result.data.totalCost).toBe(24500)
  })
})
```

#### 2. Database Integration Tests
```typescript
describe('Vehicle Repository', () => {
  it('should calculate profit metrics correctly', async () => {
    const vehicle = await createTestVehicle()
    await addTestExpenses(vehicle.id)
    await createTestSale(vehicle.id, 30000)

    const metrics = await VehicleRepository.getProfitMetrics(vehicle.id)
    
    expect(metrics.totalCost).toBe(24500)
    expect(metrics.revenue).toBe(30000)
    expect(metrics.profit).toBe(5500)
    expect(metrics.margin).toBeCloseTo(18.33)
  })
})
```

## End-to-End Testing Guidelines

### E2E Testing Strategy

Our E2E tests focus on critical business workflows:

1. **Vehicle Lifecycle Workflow**
   - Vehicle acquisition to sale
   - Status tracking through all stages
   - Profit & loss calculation
   - Financial reporting

2. **Invoice Process Workflow**
   - Invoice creation and management
   - Payment processing
   - Multi-vehicle invoices
   - Credit notes and modifications

3. **Customer Journey Workflow**
   - Inquiry to purchase completion
   - Customer satisfaction tracking
   - Trade-in processing
   - Post-sale follow-up

### E2E Test Structure

```typescript
test.describe('Vehicle Lifecycle Workflow', () => {
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test('Complete vehicle lifecycle with profit tracking', async () => {
    await test.step('Add vehicle to inventory', async () => {
      // Test implementation
    })

    await test.step('Track vehicle expenses', async () => {
      // Test implementation
    })

    await test.step('Process vehicle sale', async () => {
      // Test implementation
    })

    await test.step('Verify profit calculations', async () => {
      // Test implementation
    })
  })
})
```

### E2E Best Practices

1. **Test Real User Scenarios**
   - Complete business workflows
   - Realistic test data
   - Multi-step processes

2. **Use Page Object Model**
   - Centralize page interactions
   - Reusable page methods
   - Maintainable test code

3. **Parallel Test Execution**
   - Independent test data
   - Isolated test environments
   - No shared state between tests

## Test Data Management

### Test Data Strategy

#### 1. Factory Pattern for Test Data
```typescript
export function generateTestVehicle(overrides = {}) {
  return {
    vin: faker.vehicle.vin(),
    year: faker.date.past({ years: 10 }).getFullYear(),
    make: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    purchasePrice: faker.number.int({ min: 15000, max: 50000 }),
    ...overrides
  }
}
```

#### 2. Realistic Financial Data
```typescript
export function generateVehicleProfitScenario() {
  const purchasePrice = 20000
  const expenses = [
    { category: 'shipping', amount: 1500 },
    { category: 'customs', amount: 800 },
    { category: 'enhancement', amount: 2500 }
  ]
  const salePrice = 28000
  
  return {
    vehicle: generateTestVehicle({ purchasePrice }),
    expenses,
    salePrice,
    expectedProfit: salePrice - purchasePrice - expenses.reduce((sum, e) => sum + e.amount, 0)
  }
}
```

#### 3. Database Seeding for E2E Tests
```typescript
export async function seedTestDatabase() {
  // Create test users
  await createTestUsers()
  
  // Create test vehicles with known profit scenarios
  await createProfitableVehicle()
  await createBreakEvenVehicle()
  await createLossVehicle()
  
  // Create test customers
  await createTestCustomers()
}
```

## Testing Patterns and Best Practices

### 1. AAA Pattern (Arrange, Act, Assert)
```typescript
it('should calculate profit margin correctly', () => {
  // Arrange
  const vehicle = { purchasePrice: 20000 }
  const expenses = [{ amount: 3000 }, { amount: 2000 }]
  const salePrice = 30000

  // Act
  const result = calculateProfitMargin(vehicle, expenses, salePrice)

  // Assert
  expect(result.margin).toBe(16.67)
  expect(result.profit).toBe(5000)
})
```

### 2. Custom Test Utilities
```typescript
// Test helper for profit calculations
export function expectProfitCalculation(
  purchasePrice: number,
  expenses: number[],
  salePrice: number,
  expectedProfit: number
) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp, 0)
  const totalCost = purchasePrice + totalExpenses
  const profit = salePrice - totalCost
  
  expect(profit).toBe(expectedProfit)
  expect(profit / salePrice * 100).toBeCloseTo((expectedProfit / salePrice) * 100, 2)
}
```

### 3. Mock Strategies
```typescript
// Service mocking
vi.mock('@/lib/services/vehicles', () => ({
  VehicleService: {
    getAll: vi.fn(),
    calculateProfit: vi.fn(),
    updateStatus: vi.fn()
  }
}))

// MSW for API mocking
const handlers = [
  rest.get('/api/vehicles', (req, res, ctx) => {
    return res(ctx.json(mockVehicles))
  }),
  
  rest.post('/api/vehicles/:id/profit', (req, res, ctx) => {
    const profit = calculateMockProfit(req.body)
    return res(ctx.json({ profit }))
  })
]
```

## CI/CD Testing Pipeline

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### Test Environment Management
```typescript
// Environment-specific test configuration
export const testConfig = {
  development: {
    baseURL: 'http://localhost:3000',
    testUser: 'admin@georgiaused.com'
  },
  staging: {
    baseURL: 'https://staging.georgiaused.com',
    testUser: 'test@georgiaused.com'
  }
}
```

## Troubleshooting Common Issues

### 1. JSDOM Compatibility Issues
```typescript
// Mock window.matchMedia for components using media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})
```

### 2. Async Component Testing
```typescript
// Wait for async operations to complete
it('should load vehicle data', async () => {
  render(<VehicleList />)
  
  await waitFor(() => {
    expect(screen.getByText('2021 Honda Civic')).toBeInTheDocument()
  })
})
```

### 3. Form Testing with Validation
```typescript
// Test form validation with proper user events
it('should validate required fields', async () => {
  const user = userEvent.setup()
  render(<VehicleForm />)
  
  // Try to submit empty form
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  
  // Check for validation messages
  await waitFor(() => {
    expect(screen.getByText('VIN is required')).toBeInTheDocument()
  })
})
```

### 4. E2E Test Stability
```typescript
// Use proper waits and assertions
await test.step('Wait for data to load', async () => {
  await page.waitForSelector('[data-testid="vehicle-list"]')
  await expect(page.locator('text="Loading"')).not.toBeVisible()
})
```

## Test Coverage Goals

### Coverage Targets
- **Unit Tests**: 90% line coverage
- **Component Tests**: 85% component coverage
- **Integration Tests**: 80% API endpoint coverage
- **E2E Tests**: 100% critical workflow coverage

### Critical Areas for High Coverage
1. **Financial Calculations**
   - Profit & loss calculations
   - Tax computations
   - Currency conversions
   - Expense categorization

2. **Business Logic**
   - Vehicle status workflows
   - Customer journey management
   - Invoice processing
   - Payment tracking

3. **Data Validation**
   - Form validations
   - API input validation
   - Database constraints
   - Security validations

## Running Tests

### Local Development
```bash
# Run all unit and component tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Test Organization
```
tests/
├── unit/              # Pure function and utility tests
├── components/        # Component-specific tests
├── integration/       # API and service integration tests
├── e2e/              # End-to-end workflow tests
├── helpers/          # Test utilities and helpers
└── fixtures/         # Test data and fixtures
```

This comprehensive testing strategy ensures that the Georgia Used Cars application maintains high quality, reliability, and user satisfaction while supporting critical business operations like profit & loss tracking for informed purchase decisions.