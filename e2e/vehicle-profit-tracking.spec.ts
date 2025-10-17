import { test, expect, Page } from '@playwright/test'
import { login } from './helpers/auth'
import { generateTestVehicle, generateTestExpense, TestVehicle, TestExpense } from './helpers/test-data'

test.describe('Vehicle Profit & Loss Tracking', () => {
  let page: Page
  let testVehicle: TestVehicle

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    testVehicle = generateTestVehicle({
      purchasePrice: 20000,
      purchaseCurrency: 'USD'
    })
    await login(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Track complete vehicle profitability from purchase to sale', async () => {
    // Step 1: Add vehicle to inventory
    await test.step('Add vehicle with purchase details', async () => {
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      
      // Fill essential vehicle information
      await page.fill('[name="vin"]', testVehicle.vin)
      await page.fill('[name="year"]', testVehicle.year.toString())
      await page.fill('[name="make"]', testVehicle.make)
      await page.fill('[name="model"]', testVehicle.model)
      await page.fill('[name="auctionHouse"]', testVehicle.auctionHouse)
      await page.fill('[name="purchasePrice"]', testVehicle.purchasePrice.toString())
      await page.selectOption('[name="purchaseCurrency"]', testVehicle.purchaseCurrency)
      
      await page.click('button[type="submit"]')
      
      // Verify vehicle creation
      await expect(page.locator('text="Vehicle added successfully"')).toBeVisible()
    })

    // Step 2: Add comprehensive expense tracking
    await test.step('Record all vehicle expenses by category', async () => {
      const expenses = [
        { category: 'shipping', amount: 1500, description: 'Ocean freight US to UAE', receipt: true },
        { category: 'customs', amount: 850, description: 'UAE customs duties and clearance', receipt: true },
        { category: 'enhancement', amount: 2800, description: 'Body repair and paint work', receipt: true },
        { category: 'enhancement', amount: 1200, description: 'Interior detailing and cleaning', receipt: false },
        { category: 'storage', amount: 400, description: 'Warehouse storage for 2 months', receipt: true },
        { category: 'insurance', amount: 300, description: 'Transit and storage insurance', receipt: true },
        { category: 'other', amount: 250, description: 'Documentation and admin fees', receipt: false },
        { category: 'other', amount: 150, description: 'Vehicle inspection costs', receipt: true }
      ]

      await page.goto(`/admin/vehicles/${testVehicle.vin}`)
      await page.click('text="Expenses"')
      
      for (const expense of expenses) {
        await page.click('text="Add Expense"')
        
        await page.selectOption('[name="category"]', expense.category)
        await page.fill('[name="amount"]', expense.amount.toString())
        await page.selectOption('[name="currency"]', 'USD')
        await page.fill('[name="description"]', expense.description)
        await page.fill('[name="expenseDate"]', new Date().toISOString().split('T')[0])
        
        if (expense.receipt) {
          await page.setChecked('[name="hasReceipt"]', true)
        }
        
        await page.click('button[type="submit"]')
        await expect(page.locator('text="Expense added successfully"')).toBeVisible()
      }
      
      // Verify total expenses calculation
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      await expect(page.locator(`text="Total Expenses: $${totalExpenses.toLocaleString()}"`)).toBeVisible()
    })

    // Step 3: Track expense categories and analytics
    await test.step('Verify expense category breakdown', async () => {
      await page.goto(`/admin/vehicles/${testVehicle.vin}/expenses`)
      
      // Verify category totals
      await expect(page.locator('text="Shipping: $1,500"')).toBeVisible()
      await expect(page.locator('text="Customs: $850"')).toBeVisible()
      await expect(page.locator('text="Enhancement: $4,000"')).toBeVisible() // 2800 + 1200
      await expect(page.locator('text="Storage: $400"')).toBeVisible()
      await expect(page.locator('text="Insurance: $300"')).toBeVisible()
      await expect(page.locator('text="Other: $400"')).toBeVisible() // 250 + 150
      
      // Verify expense with/without receipts tracking
      await expect(page.locator('text="Receipts Available: 6 of 8 expenses"')).toBeVisible()
      
      // Verify expense timeline chart
      await expect(page.locator('[data-testid="expense-timeline-chart"]')).toBeVisible()
    })

    // Step 4: Set sale price and calculate profit
    await test.step('Record vehicle sale and calculate profit', async () => {
      const salePrice = 32000
      
      // Create customer and invoice
      await page.goto('/admin/customers')
      await page.click('text="Add Customer"')
      
      await page.fill('[name="fullName"]', 'John Doe')
      await page.fill('[name="email"]', 'john.doe@example.com')
      await page.fill('[name="phone"]', '+1234567890')
      await page.fill('[name="address"]', '123 Main St')
      await page.fill('[name="city"]', 'Dubai')
      await page.fill('[name="state"]', 'Dubai')
      await page.fill('[name="zipCode"]', '12345')
      await page.selectOption('[name="country"]', 'United Arab Emirates')
      await page.selectOption('[name="customerType"]', 'individual')
      
      await page.click('button[type="submit"]')
      
      // Create invoice
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      await page.click('[data-testid="customer-select"]')
      await page.click('text="John Doe"')
      
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${testVehicle.year} ${testVehicle.make} ${testVehicle.model}"`)
      
      await page.fill('[name="salePrice"]', salePrice.toString())
      await page.fill('[name="notes"]', 'Vehicle sale to customer')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Invoice created successfully"')).toBeVisible()
      
      // Update vehicle status to sold
      await page.goto(`/admin/vehicles/${testVehicle.vin}`)
      await page.click('text="Update Status"')
      await page.selectOption('[name="status"]', 'sold')
      await page.fill('[name="notes"]', 'Vehicle sold to customer')
      await page.click('button:has-text("Update Status")')
    })

    // Step 5: Verify comprehensive profit & loss analysis
    await test.step('Analyze vehicle profitability', async () => {
      await page.goto(`/admin/vehicles/${testVehicle.vin}/profit-loss`)
      
      // Verify cost breakdown
      await expect(page.locator('text="Purchase Price"')).toBeVisible()
      await expect(page.locator(`text="$${testVehicle.purchasePrice.toLocaleString()}"`)).toBeVisible()
      
      // Verify total expenses
      const totalExpenses = 7450 // Sum of all expenses above
      await expect(page.locator(`text="Total Expenses: $${totalExpenses.toLocaleString()}"`)).toBeVisible()
      
      // Verify total cost
      const totalCost = testVehicle.purchasePrice + totalExpenses
      await expect(page.locator(`text="Total Cost: $${totalCost.toLocaleString()}"`)).toBeVisible()
      
      // Verify revenue
      const salePrice = 32000
      await expect(page.locator(`text="Sale Price: $${salePrice.toLocaleString()}"`)).toBeVisible()
      
      // Verify profit calculation
      const profit = salePrice - totalCost
      await expect(page.locator(`text="Net Profit: $${profit.toLocaleString()}"`)).toBeVisible()
      
      // Verify profit margin
      const profitMargin = ((profit / salePrice) * 100).toFixed(2)
      await expect(page.locator(`text="Profit Margin: ${profitMargin}%"`)).toBeVisible()
      
      // Verify ROI calculation
      const roi = ((profit / totalCost) * 100).toFixed(2)
      await expect(page.locator(`text="Return on Investment: ${roi}%"`)).toBeVisible()
    })

    // Step 6: Verify expense category analysis for future decisions
    await test.step('Analyze expense patterns for decision making', async () => {
      await page.goto(`/admin/vehicles/${testVehicle.vin}/analytics`)
      
      // Verify expense breakdown chart
      await expect(page.locator('[data-testid="expense-breakdown-chart"]')).toBeVisible()
      
      // Verify cost per category as percentage
      await expect(page.locator('text="Enhancement: 53.7%"')).toBeVisible() // 4000/7450
      await expect(page.locator('text="Shipping: 20.1%"')).toBeVisible() // 1500/7450
      await expect(page.locator('text="Customs: 11.4%"')).toBeVisible() // 850/7450
      
      // Verify recommendations for future purchases
      await expect(page.locator('text="High enhancement costs detected"')).toBeVisible()
      await expect(page.locator('text="Consider vehicles requiring less repair work"')).toBeVisible()
      
      // Verify cost efficiency metrics
      await expect(page.locator('text="Cost per mile"')).toBeVisible()
      await expect(page.locator('text="Cost per year of age"')).toBeVisible()
    })

    // Step 7: Generate comprehensive profit report
    await test.step('Generate detailed profit & loss report', async () => {
      await page.goto(`/admin/vehicles/${testVehicle.vin}/reports`)
      
      // Generate detailed PDF report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Download Complete P&L Report"')
      ])
      
      expect(download.suggestedFilename()).toMatch(/.*profit-loss.*\.pdf$/)
      
      // Verify report preview contains all key information
      await page.click('text="Preview Report"')
      
      // Verify all sections are included
      await expect(page.locator('text="Vehicle Information"')).toBeVisible()
      await expect(page.locator('text="Cost Breakdown"')).toBeVisible()
      await expect(page.locator('text="Expense Details by Category"')).toBeVisible()
      await expect(page.locator('text="Revenue & Profit Analysis"')).toBeVisible()
      await expect(page.locator('text="Recommendations"')).toBeVisible()
      
      // Verify executive summary
      await expect(page.locator('text="Executive Summary"')).toBeVisible()
      await expect(page.locator(`text="${testVehicle.year} ${testVehicle.make} ${testVehicle.model}"`)).toBeVisible()
      await expect(page.locator('text="Vehicle was profitable with positive ROI"')).toBeVisible()
    })
  })

  test('Compare profitability across multiple vehicles', async () => {
    await test.step('Add multiple vehicles with different profit profiles', async () => {
      const vehicles = [
        { ...generateTestVehicle(), purchasePrice: 15000, make: 'Honda', model: 'Civic' },
        { ...generateTestVehicle(), purchasePrice: 25000, make: 'Toyota', model: 'Camry' },
        { ...generateTestVehicle(), purchasePrice: 35000, make: 'BMW', model: 'X3' }
      ]
      
      for (const vehicle of vehicles) {
        await page.goto('/admin/vehicles')
        await page.click('text="Add Vehicle"')
        
        await page.fill('[name="vin"]', vehicle.vin)
        await page.fill('[name="year"]', vehicle.year.toString())
        await page.fill('[name="make"]', vehicle.make)
        await page.fill('[name="model"]', vehicle.model)
        await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
        await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
        
        await page.click('button[type="submit"]')
        await expect(page.locator('text="Vehicle added successfully"')).toBeVisible()
      }
      
      // Navigate to portfolio analytics
      await page.goto('/admin/analytics/portfolio')
      
      // Verify vehicle comparison table
      await expect(page.locator('text="Vehicle Profitability Comparison"')).toBeVisible()
      await expect(page.locator('text="Honda Civic"')).toBeVisible()
      await expect(page.locator('text="Toyota Camry"')).toBeVisible()
      await expect(page.locator('text="BMW X3"')).toBeVisible()
      
      // Verify sorting by profit margin
      await page.click('text="Sort by Profit Margin"')
      
      // Verify filtering options
      await page.selectOption('[name="priceRange"]', '15000-30000')
      await expect(page.locator('text="Honda Civic"')).toBeVisible()
      await expect(page.locator('text="Toyota Camry"')).toBeVisible()
      await expect(page.locator('text="BMW X3"')).not.toBeVisible()
    })
  })

  test('Track expense trends over time for decision making', async () => {
    await test.step('Analyze expense patterns across time periods', async () => {
      await page.goto('/admin/analytics/expenses')
      
      // Verify time-based expense analysis
      await expect(page.locator('text="Expense Trends Analysis"')).toBeVisible()
      
      // Test different time periods
      await page.click('[data-testid="time-period-selector"]')
      await page.click('text="Last 6 Months"')
      
      // Verify category trend charts
      await expect(page.locator('[data-testid="shipping-costs-trend"]')).toBeVisible()
      await expect(page.locator('[data-testid="enhancement-costs-trend"]')).toBeVisible()
      await expect(page.locator('[data-testid="customs-costs-trend"]')).toBeVisible()
      
      // Verify insights and recommendations
      await expect(page.locator('text="Cost Optimization Insights"')).toBeVisible()
      await expect(page.locator('text="Shipping costs have increased by"')).toBeVisible()
      await expect(page.locator('text="Consider alternative shipping routes"')).toBeVisible()
      
      // Verify vendor performance tracking
      await expect(page.locator('text="Enhancement Provider Performance"')).toBeVisible()
      await expect(page.locator('text="Average cost per vehicle"')).toBeVisible()
      await expect(page.locator('text="Quality rating"')).toBeVisible()
    })
  })

  test('Profit forecasting and purchase decision support', async () => {
    await test.step('Use historical data for purchase decision making', async () => {
      await page.goto('/admin/tools/purchase-analyzer')
      
      // Enter potential vehicle details
      await page.fill('[name="estimatedPurchasePrice"]', '22000')
      await page.selectOption('[name="vehicleCategory"]', 'sedan')
      await page.selectOption('[name="damageLevel"]', 'moderate')
      await page.selectOption('[name="auctionHouse"]', 'Copart')
      
      await page.click('text="Analyze Potential Profit"')
      
      // Verify profit projection based on historical data
      await expect(page.locator('text="Profit Projection"')).toBeVisible()
      await expect(page.locator('text="Estimated Total Cost:"')).toBeVisible()
      await expect(page.locator('text="Projected Sale Price:"')).toBeVisible()
      await expect(page.locator('text="Expected Profit Margin:"')).toBeVisible()
      
      // Verify risk assessment
      await expect(page.locator('text="Risk Assessment"')).toBeVisible()
      await expect(page.locator('text="Historical success rate for similar vehicles:"')).toBeVisible()
      await expect(page.locator('text="Average time to sale:"')).toBeVisible()
      
      // Verify recommendations
      await expect(page.locator('text="Purchase Recommendation"')).toBeVisible()
      await expect(page.locator(/text="(Recommended|Not Recommended|Proceed with Caution)"/)).toBeVisible()
      
      // Verify break-even analysis
      await expect(page.locator('text="Break-even Sale Price:"')).toBeVisible()
      await expect(page.locator('text="Minimum Profit Sale Price:"')).toBeVisible()
    })
  })
})