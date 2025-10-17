import { test, expect, Page } from '@playwright/test'
import { login } from './helpers/auth'
import { generateTestVehicle, generateTestCustomer, generateTestInvoice, generateTestPayment } from './helpers/test-data'

test.describe('Invoice Process Workflow', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Complete invoice workflow from creation to payment', async () => {
    const vehicle = generateTestVehicle()
    const customer = generateTestCustomer()
    let invoiceNumber: string

    // Step 1: Set up prerequisites (vehicle and customer)
    await test.step('Create vehicle and customer', async () => {
      // Add vehicle
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      
      await page.fill('[name="vin"]', vehicle.vin)
      await page.fill('[name="year"]', vehicle.year.toString())
      await page.fill('[name="make"]', vehicle.make)
      await page.fill('[name="model"]', vehicle.model)
      await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
      await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
      await page.selectOption('[name="purchaseCurrency"]', vehicle.purchaseCurrency)
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Vehicle added successfully"')).toBeVisible()
      
      // Add customer
      await page.goto('/admin/customers')
      await page.click('text="Add Customer"')
      
      await page.fill('[name="fullName"]', customer.fullName)
      await page.fill('[name="email"]', customer.email)
      await page.fill('[name="phone"]', customer.phone)
      await page.fill('[name="address"]', customer.address)
      await page.fill('[name="city"]', customer.city)
      await page.fill('[name="state"]', customer.state)
      await page.fill('[name="zipCode"]', customer.zipCode)
      await page.selectOption('[name="country"]', customer.country)
      await page.selectOption('[name="customerType"]', customer.customerType)
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Customer added successfully"')).toBeVisible()
    })

    // Step 2: Create invoice
    await test.step('Create sales invoice', async () => {
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      // Select customer
      await page.click('[data-testid="customer-select"]')
      await page.fill('[data-testid="customer-search"]', customer.fullName)
      await page.click(`text="${customer.fullName}"`)
      
      // Select vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.fill('[data-testid="vehicle-search"]', vehicle.vin)
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Fill invoice details
      const salePrice = 45000
      await page.fill('[name="salePrice"]', salePrice.toString())
      await page.selectOption('[name="currency"]', 'USD')
      
      // Add tax
      const taxRate = 8 // 8%
      const taxAmount = Math.round(salePrice * (taxRate / 100))
      await page.fill('[name="taxAmount"]', taxAmount.toString())
      
      // Add discount
      const discountAmount = 2000
      await page.fill('[name="discountAmount"]', discountAmount.toString())
      
      // Set payment terms
      await page.selectOption('[name="paymentTerms"]', 'Net 30')
      
      // Set due date
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      await page.fill('[name="dueDate"]', dueDate.toISOString().split('T')[0])
      
      // Add notes
      await page.fill('[name="notes"]', 'Invoice for vehicle purchase with agreed terms')
      
      await page.click('button[type="submit"]')
      
      // Verify invoice creation
      await expect(page.locator('text="Invoice created successfully"')).toBeVisible()
      
      // Capture invoice number for later use
      const invoiceNumberElement = await page.locator('[data-testid="invoice-number"]')
      invoiceNumber = await invoiceNumberElement.textContent() || ''
      expect(invoiceNumber).toBeTruthy()
    })

    // Step 3: View and verify invoice details
    await test.step('Verify invoice details and calculations', async () => {
      await page.click(`text="${invoiceNumber}"`)
      
      // Verify customer information
      await expect(page.locator(`text="${customer.fullName}"`)).toBeVisible()
      await expect(page.locator(`text="${customer.email}"`)).toBeVisible()
      await expect(page.locator(`text="${customer.phone}"`)).toBeVisible()
      
      // Verify vehicle information
      await expect(page.locator(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)).toBeVisible()
      await expect(page.locator(`text="${vehicle.vin}"`)).toBeVisible()
      
      // Verify pricing calculations
      await expect(page.locator('text="Sale Price: $45,000.00"')).toBeVisible()
      await expect(page.locator('text="Tax (8%): $3,600.00"')).toBeVisible()
      await expect(page.locator('text="Discount: -$2,000.00"')).toBeVisible()
      
      // Calculate and verify total
      const total = 45000 + 3600 - 2000 // $46,600
      await expect(page.locator(`text="Total Amount: $${total.toLocaleString()}.00"`)).toBeVisible()
      
      // Verify payment status
      await expect(page.locator('text="Payment Status: Pending"')).toBeVisible()
      await expect(page.locator('text="Amount Due: $46,600.00"')).toBeVisible()
      
      // Verify payment terms and due date
      await expect(page.locator('text="Payment Terms: Net 30"')).toBeVisible()
      await expect(page.locator(/text="Due Date:.*\d{1,2}\/\d{1,2}\/\d{4}"/)).toBeVisible()
    })

    // Step 4: Send invoice to customer
    await test.step('Send invoice to customer via email', async () => {
      await page.click('text="Send Invoice"')
      
      // Verify email details
      await expect(page.locator(`text="To: ${customer.email}"`)).toBeVisible()
      await expect(page.locator(`text="Subject: Invoice ${invoiceNumber}"`)).toBeVisible()
      
      // Customize email message
      await page.fill('[name="emailMessage"]', 
        `Dear ${customer.fullName},\n\nPlease find attached your invoice for the vehicle purchase. Payment is due within 30 days.\n\nThank you for your business!`
      )
      
      // Verify PDF attachment
      await expect(page.locator('text="Attachment: invoice.pdf"')).toBeVisible()
      
      await page.click('button:has-text("Send Email")')
      
      // Verify email sent
      await expect(page.locator('text="Invoice sent successfully"')).toBeVisible()
      
      // Verify email log
      await page.click('text="Email History"')
      await expect(page.locator(`text="Sent to ${customer.email}"`)).toBeVisible()
      await expect(page.locator(/text="Sent:.*\d{1,2}\/\d{1,2}\/\d{4}"/)).toBeVisible()
    })

    // Step 5: Record partial payment
    await test.step('Record partial payment from customer', async () => {
      await page.goto('/admin/payments')
      await page.click('text="Record Payment"')
      
      // Select invoice
      await page.click('[data-testid="invoice-select"]')
      await page.click(`text="${invoiceNumber}"`)
      
      // Record down payment (50%)
      const partialAmount = 23300 // Half of $46,600
      await page.fill('[name="amount"]', partialAmount.toString())
      await page.selectOption('[name="currency"]', 'USD')
      await page.selectOption('[name="paymentMethod"]', 'bank_transfer')
      
      // Set payment date
      await page.fill('[name="paymentDate"]', new Date().toISOString().split('T')[0])
      
      // Add transaction details
      await page.fill('[name="transactionId"]', 'TXN-DOWN-' + Date.now())
      await page.fill('[name="notes"]', 'Down payment - 50% of total invoice amount')
      
      await page.click('button[type="submit"]')
      
      // Verify payment recorded
      await expect(page.locator('text="Payment recorded successfully"')).toBeVisible()
      
      // Verify payment appears in list
      await expect(page.locator(`text="$${partialAmount.toLocaleString()}.00"`)).toBeVisible()
      await expect(page.locator('text="Bank Transfer"')).toBeVisible()
    })

    // Step 6: Verify invoice payment status update
    await test.step('Verify invoice status after partial payment', async () => {
      await page.goto('/admin/invoices')
      await page.click(`text="${invoiceNumber}"`)
      
      // Verify partial payment status
      await expect(page.locator('text="Payment Status: Partially Paid"')).toBeVisible()
      await expect(page.locator('text="Amount Paid: $23,300.00"')).toBeVisible()
      await expect(page.locator('text="Amount Due: $23,300.00"')).toBeVisible()
      
      // Verify payment history
      await page.click('text="Payment History"')
      await expect(page.locator('text="Down payment - 50% of total invoice amount"')).toBeVisible()
      await expect(page.locator('text="Bank Transfer: $23,300.00"')).toBeVisible()
    })

    // Step 7: Record final payment
    await test.step('Record final payment to complete invoice', async () => {
      await page.goto('/admin/payments')
      await page.click('text="Record Payment"')
      
      // Select same invoice
      await page.click('[data-testid="invoice-select"]')
      await page.click(`text="${invoiceNumber}"`)
      
      // Record remaining amount
      const finalAmount = 23300 // Remaining balance
      await page.fill('[name="amount"]', finalAmount.toString())
      await page.selectOption('[name="paymentMethod"]', 'cash')
      
      await page.fill('[name="paymentDate"]', new Date().toISOString().split('T')[0])
      await page.fill('[name="transactionId"]', 'TXN-FINAL-' + Date.now())
      await page.fill('[name="notes"]', 'Final payment on vehicle delivery')
      
      await page.click('button[type="submit"]')
      
      // Verify final payment recorded
      await expect(page.locator('text="Payment recorded successfully"')).toBeVisible()
    })

    // Step 8: Verify invoice completion
    await test.step('Verify invoice marked as fully paid', async () => {
      await page.goto('/admin/invoices')
      await page.click(`text="${invoiceNumber}"`)
      
      // Verify full payment status
      await expect(page.locator('text="Payment Status: Paid"')).toBeVisible()
      await expect(page.locator('text="Amount Paid: $46,600.00"')).toBeVisible()
      await expect(page.locator('text="Amount Due: $0.00"')).toBeVisible()
      
      // Verify completion date
      await expect(page.locator(/text="Paid Date:.*\d{1,2}\/\d{1,2}\/\d{4}"/)).toBeVisible()
      
      // Verify both payments in history
      await page.click('text="Payment History"')
      await expect(page.locator('text="Down payment"')).toBeVisible()
      await expect(page.locator('text="Final payment"')).toBeVisible()
      await expect(page.locator('text="Total Payments: $46,600.00"')).toBeVisible()
    })

    // Step 9: Update vehicle status to sold
    await test.step('Update vehicle status after sale completion', async () => {
      await page.goto(`/admin/vehicles/${vehicle.vin}`)
      
      await page.click('text="Update Status"')
      await page.selectOption('[name="status"]', 'sold')
      await page.fill('[name="notes"]', `Vehicle sold to ${customer.fullName} - Invoice ${invoiceNumber} paid in full`)
      await page.click('button:has-text("Update Status")')
      
      // Verify status update
      await expect(page.locator('text="Status updated successfully"')).toBeVisible()
      await expect(page.locator('text="Sold"')).toBeVisible()
      
      // Verify link to invoice
      await expect(page.locator(`text="Invoice: ${invoiceNumber}"`)).toBeVisible()
    })

    // Step 10: Generate final reports
    await test.step('Generate invoice and sales reports', async () => {
      // Download invoice PDF
      await page.goto('/admin/invoices')
      await page.click(`text="${invoiceNumber}"`)
      
      const [download1] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Download PDF"')
      ])
      expect(download1.suggestedFilename()).toMatch(/.*invoice.*\.pdf$/)
      
      // Generate payment receipt
      const [download2] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Download Receipt"')
      ])
      expect(download2.suggestedFilename()).toMatch(/.*receipt.*\.pdf$/)
      
      // Generate sales report
      await page.goto('/admin/reports/sales')
      await page.selectOption('[name="reportType"]', 'completed_sales')
      await page.selectOption('[name="dateRange"]', 'this_month')
      
      const [download3] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Generate Report"')
      ])
      expect(download3.suggestedFilename()).toMatch(/.*sales-report.*\.pdf$/)
    })
  })

  test('Handle invoice with multiple vehicles', async () => {
    await test.step('Create invoice with multiple vehicles for single customer', async () => {
      const customer = generateTestCustomer()
      const vehicles = [
        generateTestVehicle({ make: 'Honda', model: 'Civic', purchasePrice: 20000 }),
        generateTestVehicle({ make: 'Toyota', model: 'Camry', purchasePrice: 25000 })
      ]
      
      // Create customer
      await page.goto('/admin/customers')
      await page.click('text="Add Customer"')
      
      await page.fill('[name="fullName"]', customer.fullName)
      await page.fill('[name="email"]', customer.email)
      await page.fill('[name="phone"]', customer.phone)
      await page.fill('[name="address"]', customer.address)
      await page.fill('[name="city"]', customer.city)
      await page.fill('[name="state"]', customer.state)
      await page.fill('[name="zipCode"]', customer.zipCode)
      await page.selectOption('[name="country"]', customer.country)
      await page.selectOption('[name="customerType"]', customer.customerType)
      
      await page.click('button[type="submit"]')
      
      // Create vehicles
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
      }
      
      // Create multi-vehicle invoice
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      
      // Add first vehicle
      await page.click('[data-testid="add-vehicle-line"]')
      await page.click('[data-testid="vehicle-select-1"]')
      await page.click(`text="${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}"`)
      await page.fill('[name="salePrice1"]', '28000')
      
      // Add second vehicle
      await page.click('[data-testid="add-vehicle-line"]')
      await page.click('[data-testid="vehicle-select-2"]')
      await page.click(`text="${vehicles[1].year} ${vehicles[1].make} ${vehicles[1].model}"`)
      await page.fill('[name="salePrice2"]', '33000')
      
      await page.click('button[type="submit"]')
      
      // Verify multi-vehicle invoice
      await expect(page.locator('text="Invoice created successfully"')).toBeVisible()
      await expect(page.locator('text="Honda Civic"')).toBeVisible()
      await expect(page.locator('text="Toyota Camry"')).toBeVisible()
      await expect(page.locator('text="Subtotal: $61,000.00"')).toBeVisible()
    })
  })

  test('Handle invoice modifications and credit notes', async () => {
    await test.step('Create invoice and then modify with credit note', async () => {
      const vehicle = generateTestVehicle()
      const customer = generateTestCustomer()
      
      // Create prerequisites
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      await page.fill('[name="vin"]', vehicle.vin)
      await page.fill('[name="year"]', vehicle.year.toString())
      await page.fill('[name="make"]', vehicle.make)
      await page.fill('[name="model"]', vehicle.model)
      await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
      await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
      await page.click('button[type="submit"]')
      
      await page.goto('/admin/customers')
      await page.click('text="Add Customer"')
      await page.fill('[name="fullName"]', customer.fullName)
      await page.fill('[name="email"]', customer.email)
      await page.fill('[name="phone"]', customer.phone)
      await page.fill('[name="address"]', customer.address)
      await page.fill('[name="city"]', customer.city)
      await page.fill('[name="state"]', customer.state)
      await page.fill('[name="zipCode"]', customer.zipCode)
      await page.selectOption('[name="country"]', customer.country)
      await page.selectOption('[name="customerType"]', customer.customerType)
      await page.click('button[type="submit"]')
      
      // Create original invoice
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      await page.fill('[name="salePrice"]', '40000')
      await page.click('button[type="submit"]')
      
      const invoiceNumberElement = await page.locator('[data-testid="invoice-number"]')
      const invoiceNumber = await invoiceNumberElement.textContent() || ''
      
      // Issue credit note for price adjustment
      await page.click(`text="${invoiceNumber}"`)
      await page.click('text="Issue Credit Note"')
      
      await page.selectOption('[name="creditReason"]', 'price_adjustment')
      await page.fill('[name="creditAmount"]', '3000')
      await page.fill('[name="creditNotes"]', 'Price adjustment due to minor undisclosed damage')
      
      await page.click('button[type="submit"]')
      
      // Verify credit note created
      await expect(page.locator('text="Credit note issued successfully"')).toBeVisible()
      await expect(page.locator('text="Adjusted Total: $37,000.00"')).toBeVisible()
      await expect(page.locator('text="Credit Applied: -$3,000.00"')).toBeVisible()
      
      // Verify credit note appears in history
      await page.click('text="Credit Notes"')
      await expect(page.locator('text="Price adjustment due to minor undisclosed damage"')).toBeVisible()
    })
  })
})