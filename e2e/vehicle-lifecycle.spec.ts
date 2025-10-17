import { test, expect, Page } from '@playwright/test'
import { login } from './helpers/auth'
import { generateVehicleLifecycleData, TestVehicle, TestCustomer, TestExpense } from './helpers/test-data'

test.describe('Vehicle Lifecycle Workflow', () => {
  let page: Page
  let testData: ReturnType<typeof generateVehicleLifecycleData>

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    testData = generateVehicleLifecycleData()
    await login(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Complete vehicle lifecycle from purchase to sale with profit tracking', async () => {
    // Step 1: Add a new vehicle to inventory
    await test.step('Add new vehicle to inventory', async () => {
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      
      // Fill vehicle form
      await fillVehicleForm(page, testData.vehicle)
      
      await page.click('button[type="submit"]')
      
      // Verify vehicle was created
      await expect(page.locator('text="Vehicle added successfully"')).toBeVisible()
      await expect(page.locator(`text="${testData.vehicle.year} ${testData.vehicle.make} ${testData.vehicle.model}"`)).toBeVisible()
    })

    // Step 2: Track vehicle status through different stages
    await test.step('Update vehicle status through lifecycle stages', async () => {
      // Navigate to vehicle details
      await page.click(`text="${testData.vehicle.year} ${testData.vehicle.make} ${testData.vehicle.model}"`)
      
      // Update status: Auction Won → Payment Processing
      await updateVehicleStatus(page, 'payment_processing', 'Payment verification in progress')
      
      // Update status: Payment Processing → In Transit
      await updateVehicleStatus(page, 'in_transit', 'Vehicle shipped from auction', 'Atlanta, GA to Dubai Port')
      
      // Update status: In Transit → At UAE Port
      await updateVehicleStatus(page, 'at_uae_port', 'Arrived at Dubai port')
      
      // Update status: At UAE Port → Customs Clearance
      await updateVehicleStatus(page, 'customs_clearance', 'Processing customs documentation')
      
      // Update status: Customs Clearance → At Yard
      await updateVehicleStatus(page, 'at_yard', 'Vehicle cleared customs and delivered to yard', 'Dubai Yard')
      
      // Update status: At Yard → Under Enhancement
      await updateVehicleStatus(page, 'under_enhancement', 'Vehicle undergoing repairs and detailing')
      
      // Update status: Under Enhancement → Ready for Sale
      await updateVehicleStatus(page, 'ready_for_sale', 'Vehicle ready for customer viewing')
    })

    // Step 3: Add vehicle expenses for profit tracking
    await test.step('Record vehicle expenses', async () => {
      for (const expense of testData.expenses) {
        await addVehicleExpense(page, expense)
      }
      
      // Verify expenses are recorded
      await page.goto(`/admin/vehicles/${testData.vehicle.vin}/expenses`)
      for (const expense of testData.expenses) {
        await expect(page.locator(`text="${expense.description}"`)).toBeVisible()
        await expect(page.locator(`text="$${expense.amount.toLocaleString()}"`)).toBeVisible()
      }
    })

    // Step 4: Create customer
    await test.step('Create customer record', async () => {
      await page.goto('/admin/customers')
      await page.click('text="Add Customer"')
      
      await fillCustomerForm(page, testData.customer)
      
      await page.click('button[type="submit"]')
      
      // Verify customer was created
      await expect(page.locator('text="Customer added successfully"')).toBeVisible()
      await expect(page.locator(`text="${testData.customer.fullName}"`)).toBeVisible()
    })

    // Step 5: Create invoice for vehicle sale
    await test.step('Create sales invoice', async () => {
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      // Select customer
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${testData.customer.fullName}"`)
      
      // Select vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${testData.vehicle.year} ${testData.vehicle.make} ${testData.vehicle.model}"`)
      
      // Fill invoice details
      await page.fill('[name="salePrice"]', testData.invoice.salePrice.toString())
      await page.fill('[name="notes"]', testData.invoice.notes || '')
      
      if (testData.invoice.taxAmount) {
        await page.fill('[name="taxAmount"]', testData.invoice.taxAmount.toString())
      }
      
      if (testData.invoice.discountAmount) {
        await page.fill('[name="discountAmount"]', testData.invoice.discountAmount.toString())
      }
      
      await page.click('button[type="submit"]')
      
      // Verify invoice was created
      await expect(page.locator('text="Invoice created successfully"')).toBeVisible()
    })

    // Step 6: Record payments
    await test.step('Record customer payments', async () => {
      // Navigate to payments page
      await page.goto('/admin/payments')
      
      // Record partial payment
      const partialPayment = {
        amount: Math.floor(testData.invoice.salePrice * 0.5), // 50% down payment
        paymentMethod: 'bank_transfer' as const,
        transactionId: 'TXN-' + Date.now(),
        notes: 'Down payment for vehicle purchase'
      }
      
      await recordPayment(page, partialPayment)
      
      // Record final payment
      const finalPayment = {
        amount: testData.invoice.salePrice - partialPayment.amount,
        paymentMethod: 'cash' as const,
        transactionId: 'TXN-' + (Date.now() + 1000),
        notes: 'Final payment on delivery'
      }
      
      await recordPayment(page, finalPayment)
      
      // Verify payments are recorded
      await expect(page.locator(`text="$${partialPayment.amount.toLocaleString()}"`)).toBeVisible()
      await expect(page.locator(`text="$${finalPayment.amount.toLocaleString()}"`)).toBeVisible()
    })

    // Step 7: Update vehicle status to sold
    await test.step('Mark vehicle as sold', async () => {
      await page.goto(`/admin/vehicles/${testData.vehicle.vin}`)
      await updateVehicleStatus(page, 'sold', 'Vehicle sold to customer')
      
      // Verify status change
      await expect(page.locator('text="Sold"')).toBeVisible()
    })

    // Step 8: Verify profit & loss calculation
    await test.step('Verify profit & loss tracking', async () => {
      await page.goto(`/admin/vehicles/${testData.vehicle.vin}/profit-loss`)
      
      // Verify purchase price is displayed
      await expect(page.locator(`text="$${testData.vehicle.purchasePrice.toLocaleString()}"`)).toBeVisible()
      
      // Verify all expenses are included
      for (const expense of testData.expenses) {
        await expect(page.locator(`text="${expense.description}"`)).toBeVisible()
        await expect(page.locator(`text="$${expense.amount.toLocaleString()}"`)).toBeVisible()
      }
      
      // Verify total expenses calculation
      const totalExpenses = testData.expenses.reduce((sum, expense) => sum + expense.amount, 0)
      await expect(page.locator(`text="Total Expenses: $${totalExpenses.toLocaleString()}"`)).toBeVisible()
      
      // Verify revenue (sale price)
      await expect(page.locator(`text="Sale Price: $${testData.invoice.salePrice.toLocaleString()}"`)).toBeVisible()
      
      // Verify total cost (purchase + expenses)
      const totalCost = testData.vehicle.purchasePrice + totalExpenses
      await expect(page.locator(`text="Total Cost: $${totalCost.toLocaleString()}"`)).toBeVisible()
      
      // Verify profit calculation
      const profit = testData.invoice.salePrice - totalCost
      const profitText = profit >= 0 ? `Profit: $${profit.toLocaleString()}` : `Loss: $${Math.abs(profit).toLocaleString()}`
      await expect(page.locator(`text="${profitText}"`)).toBeVisible()
      
      // Verify profit margin percentage
      const profitMargin = ((profit / testData.invoice.salePrice) * 100).toFixed(2)
      await expect(page.locator(`text="Profit Margin: ${profitMargin}%"`)).toBeVisible()
    })

    // Step 9: Generate and verify reports
    await test.step('Generate vehicle lifecycle report', async () => {
      await page.goto(`/admin/vehicles/${testData.vehicle.vin}/reports`)
      
      // Generate PDF report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Download Profit & Loss Report"')
      ])
      
      expect(download.suggestedFilename()).toContain('.pdf')
      
      // Verify report contains key information
      await page.click('text="View Report"')
      await expect(page.locator(`text="${testData.vehicle.vin}"`)).toBeVisible()
      await expect(page.locator(`text="${testData.vehicle.year} ${testData.vehicle.make} ${testData.vehicle.model}"`)).toBeVisible()
      await expect(page.locator(`text="Purchase Price: $${testData.vehicle.purchasePrice.toLocaleString()}"`)).toBeVisible()
      await expect(page.locator(`text="Sale Price: $${testData.invoice.salePrice.toLocaleString()}"`)).toBeVisible()
    })
  })

  test('Vehicle profit tracking with multiple expense categories', async () => {
    await test.step('Add vehicle with comprehensive expense tracking', async () => {
      const vehicle = testData.vehicle
      
      // Add vehicle
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      await fillVehicleForm(page, vehicle)
      await page.click('button[type="submit"]')
      
      // Add various expense categories
      const comprehensiveExpenses = [
        { category: 'shipping', amount: 1500, description: 'Ocean freight from US to UAE' },
        { category: 'customs', amount: 800, description: 'UAE customs duties and fees' },
        { category: 'enhancement', amount: 3200, description: 'Body work and paint repair' },
        { category: 'enhancement', amount: 1800, description: 'Interior cleaning and detailing' },
        { category: 'storage', amount: 450, description: 'Warehouse storage fees' },
        { category: 'insurance', amount: 250, description: 'Transit insurance premium' },
        { category: 'other', amount: 300, description: 'Documentation and admin fees' }
      ]
      
      for (const expense of comprehensiveExpenses) {
        await addVehicleExpense(page, {
          vehicleId: vehicle.vin,
          category: expense.category as any,
          amount: expense.amount,
          description: expense.description,
          currency: 'USD',
          expenseDate: new Date().toISOString().split('T')[0]
        })
      }
      
      // Verify expense categorization
      await page.goto(`/admin/vehicles/${vehicle.vin}/expenses`)
      
      // Check that expenses are grouped by category
      await expect(page.locator('text="Shipping ($1,500)"')).toBeVisible()
      await expect(page.locator('text="Customs ($800)"')).toBeVisible()
      await expect(page.locator('text="Enhancement ($5,000)"')).toBeVisible()
      await expect(page.locator('text="Storage ($450)"')).toBeVisible()
      await expect(page.locator('text="Insurance ($250)"')).toBeVisible()
      await expect(page.locator('text="Other ($300)"')).toBeVisible()
      
      // Verify total expenses
      const totalExpenses = comprehensiveExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      await expect(page.locator(`text="Total Expenses: $${totalExpenses.toLocaleString()}"`)).toBeVisible()
    })
  })

  test('Vehicle status history tracking', async () => {
    await test.step('Track complete status history with timestamps and users', async () => {
      const vehicle = testData.vehicle
      
      // Add vehicle
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      await fillVehicleForm(page, vehicle)
      await page.click('button[type="submit"]')
      
      // Navigate to vehicle details
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Update through multiple status changes
      const statusUpdates = [
        { status: 'payment_processing', notes: 'Payment verification started', location: 'Atlanta, GA' },
        { status: 'pickup_scheduled', notes: 'Pickup scheduled for next Tuesday', location: 'Auction Yard' },
        { status: 'in_transit_to_port', notes: 'Vehicle loaded on transport truck', location: 'En route to Savannah Port' },
        { status: 'at_port', notes: 'Arrived at shipping port', location: 'Savannah Port, GA' },
        { status: 'shipped', notes: 'Loaded on cargo ship', location: 'MS Ocean Carrier' },
        { status: 'in_transit', notes: 'Ship departed for UAE', location: 'Atlantic Ocean' },
        { status: 'at_uae_port', notes: 'Arrived at destination port', location: 'Jebel Ali Port, Dubai' },
        { status: 'customs_clearance', notes: 'Customs processing initiated', location: 'Dubai Customs' },
        { status: 'released_from_customs', notes: 'Customs cleared successfully', location: 'Dubai Customs' },
        { status: 'in_transit_to_yard', notes: 'Being transported to storage yard', location: 'En route to yard' },
        { status: 'at_yard', notes: 'Vehicle received at yard', location: 'Dubai Storage Yard' }
      ]
      
      for (const update of statusUpdates) {
        await updateVehicleStatus(page, update.status, update.notes, update.location)
        
        // Small delay to ensure timestamp differences
        await page.waitForTimeout(100)
      }
      
      // Verify status history shows all updates
      await expect(page.locator('text="Status History"')).toBeVisible()
      
      for (const update of statusUpdates) {
        await expect(page.locator(`text="${update.notes}"`)).toBeVisible()
        await expect(page.locator(`text="${update.location}"`)).toBeVisible()
      }
      
      // Verify chronological order (most recent first)
      const historyItems = page.locator('[data-testid="status-history-item"]')
      const firstItem = historyItems.first()
      await expect(firstItem.locator('text="Vehicle received at yard"')).toBeVisible()
    })
  })
})

// Helper functions for form filling and interactions

async function fillVehicleForm(page: Page, vehicle: TestVehicle) {
  await page.fill('[name="vin"]', vehicle.vin)
  await page.fill('[name="year"]', vehicle.year.toString())
  await page.fill('[name="make"]', vehicle.make)
  await page.fill('[name="model"]', vehicle.model)
  
  if (vehicle.trim) {
    await page.fill('[name="trim"]', vehicle.trim)
  }
  
  if (vehicle.engine) {
    await page.fill('[name="engine"]', vehicle.engine)
  }
  
  if (vehicle.mileage) {
    await page.fill('[name="mileage"]', vehicle.mileage.toString())
  }
  
  if (vehicle.exteriorColor) {
    await page.fill('[name="exteriorColor"]', vehicle.exteriorColor)
  }
  
  if (vehicle.interiorColor) {
    await page.fill('[name="interiorColor"]', vehicle.interiorColor)
  }
  
  await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
  
  if (vehicle.auctionLocation) {
    await page.fill('[name="auctionLocation"]', vehicle.auctionLocation)
  }
  
  await page.fill('[name="saleDate"]', vehicle.saleDate)
  
  if (vehicle.lotNumber) {
    await page.fill('[name="lotNumber"]', vehicle.lotNumber)
  }
  
  if (vehicle.primaryDamage) {
    await page.fill('[name="primaryDamage"]', vehicle.primaryDamage)
  }
  
  if (vehicle.secondaryDamage) {
    await page.fill('[name="secondaryDamage"]', vehicle.secondaryDamage)
  }
  
  if (vehicle.damageDescription) {
    await page.fill('[name="damageDescription"]', vehicle.damageDescription)
  }
  
  if (vehicle.damageSeverity) {
    await page.selectOption('[name="damageSeverity"]', vehicle.damageSeverity)
  }
  
  if (vehicle.repairEstimate) {
    await page.fill('[name="repairEstimate"]', vehicle.repairEstimate.toString())
  }
  
  if (vehicle.titleStatus) {
    await page.selectOption('[name="titleStatus"]', vehicle.titleStatus)
  }
  
  if (vehicle.keysAvailable !== undefined) {
    await page.setChecked('[name="keysAvailable"]', vehicle.keysAvailable)
  }
  
  if (vehicle.runAndDrive !== undefined) {
    await page.setChecked('[name="runAndDrive"]', vehicle.runAndDrive)
  }
  
  await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
  await page.selectOption('[name="purchaseCurrency"]', vehicle.purchaseCurrency)
  
  if (vehicle.estimatedTotalCost) {
    await page.fill('[name="estimatedTotalCost"]', vehicle.estimatedTotalCost.toString())
  }
  
  if (vehicle.currentLocation) {
    await page.fill('[name="currentLocation"]', vehicle.currentLocation)
  }
  
  if (vehicle.isPublic !== undefined) {
    await page.setChecked('[name="isPublic"]', vehicle.isPublic)
  }
}

async function fillCustomerForm(page: Page, customer: TestCustomer) {
  await page.fill('[name="fullName"]', customer.fullName)
  await page.fill('[name="email"]', customer.email)
  await page.fill('[name="phone"]', customer.phone)
  await page.fill('[name="address"]', customer.address)
  await page.fill('[name="city"]', customer.city)
  await page.fill('[name="state"]', customer.state)
  await page.fill('[name="zipCode"]', customer.zipCode)
  await page.selectOption('[name="country"]', customer.country)
  await page.selectOption('[name="customerType"]', customer.customerType)
  
  if (customer.taxId) {
    await page.fill('[name="taxId"]', customer.taxId)
  }
  
  if (customer.companyName) {
    await page.fill('[name="companyName"]', customer.companyName)
  }
}

async function updateVehicleStatus(page: Page, status: string, notes: string, location?: string) {
  await page.click('text="Update Status"')
  await page.selectOption('[name="status"]', status)
  
  if (location) {
    await page.fill('[name="location"]', location)
  }
  
  await page.fill('[name="notes"]', notes)
  await page.click('button:has-text("Update Status")')
  
  // Wait for success message
  await expect(page.locator('text="Status updated successfully"')).toBeVisible()
}

async function addVehicleExpense(page: Page, expense: TestExpense) {
  await page.goto(`/admin/vehicles/${expense.vehicleId}/expenses`)
  await page.click('text="Add Expense"')
  
  await page.selectOption('[name="category"]', expense.category)
  await page.fill('[name="amount"]', expense.amount.toString())
  await page.selectOption('[name="currency"]', expense.currency)
  await page.fill('[name="description"]', expense.description)
  await page.fill('[name="expenseDate"]', expense.expenseDate)
  
  if (expense.receipt) {
    await page.setChecked('[name="hasReceipt"]', expense.receipt)
  }
  
  await page.click('button[type="submit"]')
  
  // Wait for success message
  await expect(page.locator('text="Expense added successfully"')).toBeVisible()
}

async function recordPayment(page: Page, payment: { amount: number; paymentMethod: string; transactionId?: string; notes?: string }) {
  await page.click('text="Record Payment"')
  
  await page.fill('[name="amount"]', payment.amount.toString())
  await page.selectOption('[name="paymentMethod"]', payment.paymentMethod)
  
  if (payment.transactionId) {
    await page.fill('[name="transactionId"]', payment.transactionId)
  }
  
  if (payment.notes) {
    await page.fill('[name="notes"]', payment.notes)
  }
  
  await page.click('button[type="submit"]')
  
  // Wait for success message
  await expect(page.locator('text="Payment recorded successfully"')).toBeVisible()
}