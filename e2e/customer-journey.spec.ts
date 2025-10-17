import { test, expect, Page } from '@playwright/test'
import { login } from './helpers/auth'
import { generateTestCustomer, generateTestVehicle, TestCustomer, TestVehicle } from './helpers/test-data'

test.describe('Customer Journey Workflow', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await login(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Complete customer journey from inquiry to vehicle delivery', async () => {
    const customer = generateTestCustomer()
    const vehicle = generateTestVehicle({
      currentStatus: 'ready_for_sale',
      isPublic: true,
      purchasePrice: 25000
    })
    
    // Step 1: Customer makes initial inquiry
    await test.step('Customer submits inquiry through website', async () => {
      // Add vehicle to make it available for inquiry
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      
      await page.fill('[name="vin"]', vehicle.vin)
      await page.fill('[name="year"]', vehicle.year.toString())
      await page.fill('[name="make"]', vehicle.make)
      await page.fill('[name="model"]', vehicle.model)
      await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
      await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
      await page.setChecked('[name="isPublic"]', true)
      
      // Set status to ready for sale
      await page.click('text="Update Status"')
      await page.selectOption('[name="status"]', 'ready_for_sale')
      await page.fill('[name="notes"]', 'Vehicle ready for customer viewing')
      await page.click('button:has-text("Update Status")')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Vehicle added successfully"')).toBeVisible()
      
      // Simulate customer inquiry (normally would come from website contact form)
      await page.goto('/admin/customers')
      await page.click('text="Add Inquiry"')
      
      await page.fill('[name="fullName"]', customer.fullName)
      await page.fill('[name="email"]', customer.email)
      await page.fill('[name="phone"]', customer.phone)
      await page.selectOption('[name="inquiryType"]', 'vehicle_interest')
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      await page.fill('[name="message"]', 'Interested in purchasing this vehicle. Would like to schedule a viewing.')
      await page.selectOption('[name="preferredContact"]', 'phone')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Customer inquiry recorded"')).toBeVisible()
    })

    // Step 2: Staff responds to inquiry and creates customer record
    await test.step('Staff processes inquiry and creates customer profile', async () => {
      await page.goto('/admin/inquiries')
      await expect(page.locator(`text="${customer.fullName}"`)).toBeVisible()
      await expect(page.locator('text="Vehicle Interest"')).toBeVisible()
      
      // Mark inquiry as contacted
      await page.click(`[data-testid="inquiry-${customer.email}"]`)
      await page.click('text="Mark as Contacted"')
      await page.fill('[name="contactNotes"]', 'Called customer - interested in viewing vehicle this weekend')
      await page.click('button:has-text("Update Status")')
      
      // Convert inquiry to customer
      await page.click('text="Create Customer Profile"')
      
      // Fill additional customer details
      await page.fill('[name="address"]', customer.address)
      await page.fill('[name="city"]', customer.city)
      await page.fill('[name="state"]', customer.state)
      await page.fill('[name="zipCode"]', customer.zipCode)
      await page.selectOption('[name="country"]', customer.country)
      await page.selectOption('[name="customerType"]', customer.customerType)
      
      if (customer.taxId) {
        await page.fill('[name="taxId"]', customer.taxId)
      }
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Customer profile created successfully"')).toBeVisible()
    })

    // Step 3: Schedule vehicle viewing appointment
    await test.step('Schedule and manage vehicle viewing appointment', async () => {
      await page.goto('/admin/appointments')
      await page.click('text="Schedule Appointment"')
      
      // Select customer
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      
      // Select vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Set appointment details
      await page.selectOption('[name="appointmentType"]', 'vehicle_viewing')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('[name="appointmentDate"]', tomorrow.toISOString().split('T')[0])
      await page.fill('[name="appointmentTime"]', '14:00')
      
      await page.selectOption('[name="location"]', 'showroom')
      await page.fill('[name="notes"]', 'Customer wants to inspect vehicle condition and take test drive')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Appointment scheduled successfully"')).toBeVisible()
      
      // Send confirmation email to customer
      await page.click('text="Send Confirmation"')
      await expect(page.locator(`text="Confirmation sent to ${customer.email}"`)).toBeVisible()
    })

    // Step 4: Conduct vehicle viewing and inspection
    await test.step('Record vehicle viewing appointment outcome', async () => {
      await page.goto('/admin/appointments')
      await page.click(`[data-testid="appointment-${customer.email}"]`)
      
      // Mark appointment as completed
      await page.click('text="Mark as Completed"')
      
      // Record appointment outcome
      await page.selectOption('[name="outcome"]', 'interested_to_purchase')
      await page.fill('[name="customerFeedback"]', 'Customer is very satisfied with vehicle condition. Ready to proceed with purchase.')
      await page.fill('[name="staffNotes"]', 'Customer inspected engine, interior, and exterior. No concerns raised. Discussed financing options.')
      
      // Record any issues or requests
      await page.fill('[name="customerRequests"]', 'Customer requested minor touch-up of front bumper scratch')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Appointment completed successfully"')).toBeVisible()
      
      // Create follow-up task for enhancement request
      await page.click('text="Create Follow-up Task"')
      await page.selectOption('[name="taskType"]', 'vehicle_enhancement')
      await page.fill('[name="taskDescription"]', 'Touch-up front bumper scratch before sale')
      await page.selectOption('[name="priority"]', 'medium')
      await page.selectOption('[name="assignedTo"]', 'enhancement_team')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Follow-up task created"')).toBeVisible()
    })

    // Step 5: Process vehicle enhancement request
    await test.step('Complete vehicle enhancement before sale', async () => {
      await page.goto('/admin/tasks')
      await page.click('text="Vehicle Enhancement Tasks"')
      
      // Find and process the enhancement task
      await expect(page.locator('text="Touch-up front bumper scratch"')).toBeVisible()
      await page.click('[data-testid="task-enhance-bumper"]')
      
      // Mark task as in progress
      await page.click('text="Start Task"')
      await page.fill('[name="workNotes"]', 'Scheduled with detailing team for tomorrow morning')
      await page.click('button:has-text("Update Status")')
      
      // Complete the enhancement
      await page.click('text="Mark as Completed"')
      await page.fill('[name="completionNotes"]', 'Front bumper scratch successfully touched up. Vehicle ready for delivery.')
      await page.fill('[name="cost"]', '150')
      await page.selectOption('[name="currency"]', 'USD')
      await page.setChecked('[name="billToCustomer"]', false) // Goodwill gesture
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Enhancement completed"')).toBeVisible()
      
      // Update vehicle status
      await page.goto(`/admin/vehicles/${vehicle.vin}`)
      await page.click('text="Update Status"')
      await page.selectOption('[name="status"]', 'ready_for_sale')
      await page.fill('[name="notes"]', 'Enhancement completed - front bumper touched up')
      await page.click('button:has-text("Update Status")')
    })

    // Step 6: Negotiate price and create sales agreement
    await test.step('Negotiate price and create sales agreement', async () => {
      await page.goto('/admin/negotiations')
      await page.click('text="Start Negotiation"')
      
      // Select customer and vehicle
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Record initial offer
      const listPrice = 32000
      const customerOffer = 29000
      
      await page.fill('[name="listPrice"]', listPrice.toString())
      await page.fill('[name="customerOffer"]', customerOffer.toString())
      await page.fill('[name="negotiationNotes"]', 'Customer offered $29,000. Explained vehicle condition and market value.')
      
      await page.click('button[type="submit"]')
      
      // Make counter-offer
      await page.click('text="Make Counter-Offer"')
      const counterOffer = 30500
      await page.fill('[name="counterOffer"]', counterOffer.toString())
      await page.fill('[name="justification"]', 'Recent enhancement work and excellent condition justify price. Willing to meet halfway.')
      
      await page.click('button[type="submit"]')
      
      // Accept final negotiated price
      const finalPrice = 30000
      await page.click('text="Accept Offer"')
      await page.fill('[name="agreedPrice"]', finalPrice.toString())
      await page.fill('[name="agreementNotes"]', 'Final agreed price of $30,000. Customer satisfied with negotiation.')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Price agreement finalized"')).toBeVisible()
    })

    // Step 7: Create sales invoice
    await test.step('Generate sales invoice with agreed terms', async () => {
      await page.goto('/admin/invoices')
      await page.click('text="Create Invoice"')
      
      // Select customer and vehicle
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Fill invoice with negotiated price
      await page.fill('[name="salePrice"]', '30000')
      await page.selectOption('[name="currency"]', 'USD')
      
      // Add tax (8%)
      await page.fill('[name="taxAmount"]', '2400')
      
      // Set payment terms
      await page.selectOption('[name="paymentTerms"]', 'Net 15')
      
      // Set due date
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 15)
      await page.fill('[name="dueDate"]', dueDate.toISOString().split('T')[0])
      
      await page.fill('[name="notes"]', 'Invoice for vehicle purchase as per negotiated agreement. Enhancement work completed at no charge.')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Invoice created successfully"')).toBeVisible()
      
      // Send invoice to customer
      await page.click('text="Send Invoice"')
      await page.fill('[name="emailMessage"]', 
        `Dear ${customer.fullName},\n\nThank you for choosing our vehicle. Please find attached your invoice for the agreed purchase price of $30,000.\n\nWe look forward to completing your purchase!`
      )
      await page.click('button:has-text("Send Email")')
      await expect(page.locator('text="Invoice sent successfully"')).toBeVisible()
    })

    // Step 8: Process customer payment
    await test.step('Process customer payments and finalize sale', async () => {
      // Customer makes down payment
      await page.goto('/admin/payments')
      await page.click('text="Record Payment"')
      
      // Find the invoice
      const invoiceNumber = await page.locator('[data-testid="latest-invoice-number"]').textContent()
      await page.click('[data-testid="invoice-select"]')
      await page.click(`text="${invoiceNumber}"`)
      
      // Record down payment (50%)
      const downPayment = 16200 // 50% of $32,400 total including tax
      await page.fill('[name="amount"]', downPayment.toString())
      await page.selectOption('[name="paymentMethod"]', 'bank_transfer')
      await page.fill('[name="transactionId"]', 'TXN-' + Date.now())
      await page.fill('[name="notes"]', 'Down payment for vehicle purchase')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Payment recorded successfully"')).toBeVisible()
      
      // Schedule delivery for remaining payment
      await page.goto('/admin/deliveries')
      await page.click('text="Schedule Delivery"')
      
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      await page.click('[data-testid="vehicle-select"]')
      await page.click(`text="${vehicle.year} ${vehicle.make} ${vehicle.model}"`)
      
      // Set delivery details
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 3)
      await page.fill('[name="deliveryDate"]', deliveryDate.toISOString().split('T')[0])
      await page.fill('[name="deliveryTime"]', '10:00')
      
      await page.selectOption('[name="deliveryLocation"]', 'customer_address')
      await page.fill('[name="deliveryAddress"]', `${customer.address}, ${customer.city}, ${customer.state}`)
      
      await page.fill('[name="remainingPayment"]', '16200') // Remaining balance
      await page.selectOption('[name="paymentMethod"]', 'cash')
      
      await page.fill('[name="deliveryNotes"]', 'Deliver vehicle to customer address. Collect remaining payment and complete paperwork.')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Delivery scheduled successfully"')).toBeVisible()
    })

    // Step 9: Vehicle delivery and final payment
    await test.step('Complete vehicle delivery and collect final payment', async () => {
      await page.goto('/admin/deliveries')
      await page.click(`[data-testid="delivery-${customer.email}"]`)
      
      // Start delivery process
      await page.click('text="Start Delivery"')
      await page.fill('[name="deliveryPersonnel"]', 'John Driver')
      await page.fill('[name="departureTime"]', '09:30')
      await page.fill('[name="estimatedArrival"]', '10:00')
      
      await page.click('button:has-text("Confirm Departure")')
      
      // Complete delivery
      await page.click('text="Complete Delivery"')
      
      // Record final payment
      await page.fill('[name="finalPaymentAmount"]', '16200')
      await page.selectOption('[name="finalPaymentMethod"]', 'cash')
      await page.fill('[name="finalPaymentReference"]', 'CASH-' + Date.now())
      
      // Document handover
      await page.setChecked('[name="keysHandedOver"]', true)
      await page.setChecked('[name="documentsHandedOver"]', true)
      await page.setChecked('[name="vehicleInspected"]', true)
      
      // Customer satisfaction
      await page.selectOption('[name="customerSatisfaction"]', 'very_satisfied')
      await page.fill('[name="customerFeedback"]', 'Customer extremely happy with vehicle and service quality.')
      await page.fill('[name="deliveryNotes"]', 'Smooth delivery. Customer very pleased with vehicle condition and enhancement work.')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Delivery completed successfully"')).toBeVisible()
      
      // Update vehicle status to delivered
      await page.goto(`/admin/vehicles/${vehicle.vin}`)
      await page.click('text="Update Status"')
      await page.selectOption('[name="status"]', 'delivered')
      await page.fill('[name="notes"]', `Vehicle delivered to ${customer.fullName}. Sale completed successfully.`)
      await page.click('button:has-text("Update Status")')
    })

    // Step 10: Post-sale follow-up and customer satisfaction
    await test.step('Conduct post-sale follow-up and record satisfaction', async () => {
      // Schedule follow-up call
      await page.goto('/admin/follow-ups')
      await page.click('text="Schedule Follow-up"')
      
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      
      await page.selectOption('[name="followUpType"]', 'satisfaction_check')
      
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 7) // 1 week later
      await page.fill('[name="followUpDate"]', followUpDate.toISOString().split('T')[0])
      
      await page.fill('[name="followUpNotes"]', 'Check customer satisfaction and address any concerns')
      
      await page.click('button[type="submit"]')
      
      // Complete follow-up call
      await page.click('text="Complete Follow-up"')
      
      await page.selectOption('[name="contactOutcome"]', 'successful_contact')
      await page.selectOption('[name="overallSatisfaction"]', 'very_satisfied')
      
      // Record specific feedback
      await page.selectOption('[name="vehicleConditionSatisfaction"]', 'very_satisfied')
      await page.selectOption('[name="serviceQualitySatisfaction"]', 'very_satisfied')
      await page.selectOption('[name="deliveryProcessSatisfaction"]', 'satisfied')
      
      await page.fill('[name="customerComments"]', 'Vehicle is performing excellently. Very happy with the purchase and service received.')
      await page.fill('[name="additionalNeeds"]', 'Customer mentioned they might be interested in purchasing another vehicle for their spouse in the future.')
      
      // Mark customer for future marketing
      await page.setChecked('[name="marketingOptIn"]', true)
      await page.setChecked('[name="referralProgram"]', true)
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Follow-up completed successfully"')).toBeVisible()
      
      // Update customer profile with post-sale information
      await page.goto('/admin/customers')
      await page.click(`text="${customer.fullName}"`)
      
      // Add to VIP customer list
      await page.click('text="Update Customer Status"')
      await page.selectOption('[name="customerStatus"]', 'vip')
      await page.fill('[name="statusNotes"]', 'Excellent customer experience. High satisfaction. Potential for future purchases.')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text="Customer status updated"')).toBeVisible()
    })

    // Step 11: Generate customer journey report
    await test.step('Generate comprehensive customer journey report', async () => {
      await page.goto(`/admin/customers/${customer.email}/journey`)
      
      // Verify complete journey timeline
      await expect(page.locator('text="Customer Journey Timeline"')).toBeVisible()
      await expect(page.locator('text="Initial Inquiry"')).toBeVisible()
      await expect(page.locator('text="Customer Profile Created"')).toBeVisible()
      await expect(page.locator('text="Vehicle Viewing Scheduled"')).toBeVisible()
      await expect(page.locator('text="Vehicle Viewing Completed"')).toBeVisible()
      await expect(page.locator('text="Price Negotiation"')).toBeVisible()
      await expect(page.locator('text="Invoice Created"')).toBeVisible()
      await expect(page.locator('text="Payment Received"')).toBeVisible()
      await expect(page.locator('text="Vehicle Delivered"')).toBeVisible()
      await expect(page.locator('text="Post-Sale Follow-up"')).toBeVisible()
      
      // Verify journey metrics
      await expect(page.locator('text="Total Journey Time: 10 days"')).toBeVisible()
      await expect(page.locator('text="Customer Satisfaction: Very Satisfied"')).toBeVisible()
      await expect(page.locator('text="Conversion Rate: 100%"')).toBeVisible()
      
      // Generate journey report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text="Download Journey Report"')
      ])
      
      expect(download.suggestedFilename()).toMatch(/.*customer-journey.*\.pdf$/)
      
      // Verify report sections
      await page.click('text="Preview Report"')
      await expect(page.locator('text="Customer Information"')).toBeVisible()
      await expect(page.locator('text="Vehicle Details"')).toBeVisible()
      await expect(page.locator('text="Journey Timeline"')).toBeVisible()
      await expect(page.locator('text="Financial Summary"')).toBeVisible()
      await expect(page.locator('text="Satisfaction Metrics"')).toBeVisible()
      await expect(page.locator('text="Future Opportunities"')).toBeVisible()
    })
  })

  test('Handle customer inquiry with multiple vehicle interests', async () => {
    await test.step('Process customer interested in multiple vehicles', async () => {
      const customer = generateTestCustomer()
      const vehicles = [
        generateTestVehicle({ make: 'Honda', model: 'Civic', purchasePrice: 20000 }),
        generateTestVehicle({ make: 'Toyota', model: 'Camry', purchasePrice: 25000 }),
        generateTestVehicle({ make: 'BMW', model: 'X3', purchasePrice: 35000 })
      ]
      
      // Add vehicles to inventory
      for (const vehicle of vehicles) {
        await page.goto('/admin/vehicles')
        await page.click('text="Add Vehicle"')
        
        await page.fill('[name="vin"]', vehicle.vin)
        await page.fill('[name="year"]', vehicle.year.toString())
        await page.fill('[name="make"]', vehicle.make)
        await page.fill('[name="model"]', vehicle.model)
        await page.fill('[name="auctionHouse"]', vehicle.auctionHouse)
        await page.fill('[name="purchasePrice"]', vehicle.purchasePrice.toString())
        await page.setChecked('[name="isPublic"]', true)
        
        await page.click('button[type="submit"]')
      }
      
      // Customer inquiry for multiple vehicles
      await page.goto('/admin/customers')
      await page.click('text="Add Inquiry"')
      
      await page.fill('[name="fullName"]', customer.fullName)
      await page.fill('[name="email"]', customer.email)
      await page.fill('[name="phone"]', customer.phone)
      await page.selectOption('[name="inquiryType"]', 'multiple_vehicles')
      
      // Select multiple vehicles of interest
      await page.click('[data-testid="vehicle-multi-select"]')
      await page.check(`[data-value="${vehicles[0].vin}"]`)
      await page.check(`[data-value="${vehicles[1].vin}"]`)
      await page.check(`[data-value="${vehicles[2].vin}"]`)
      
      await page.fill('[name="message"]', 'Looking for a reliable vehicle for family use. Interested in comparing these options.')
      await page.fill('[name="budget"]', '30000')
      await page.selectOption('[name="preferredContact"]', 'email')
      
      await page.click('button[type="submit"]')
      
      // Process multi-vehicle comparison
      await page.goto('/admin/inquiries')
      await page.click(`[data-testid="inquiry-${customer.email}"]`)
      
      // Create comparison document
      await page.click('text="Create Vehicle Comparison"')
      
      // Verify comparison includes all vehicles
      await expect(page.locator('text="Honda Civic"')).toBeVisible()
      await expect(page.locator('text="Toyota Camry"')).toBeVisible()
      await expect(page.locator('text="BMW X3"')).toBeVisible()
      
      // Add comparison notes
      await page.fill('[name="civicPros"]', 'Most fuel efficient, lowest maintenance cost')
      await page.fill('[name="civicCons"]', 'Smallest size, less cargo space')
      await page.fill('[name="camryPros"]', 'Good balance of size and efficiency, reliable')
      await page.fill('[name="camryCons"]', 'Higher price than Civic')
      await page.fill('[name="x3Pros"]', 'Premium features, SUV versatility, excellent safety')
      await page.fill('[name="x3Cons"]', 'Highest price, higher maintenance costs')
      
      await page.fill('[name="recommendation"]', 'Based on budget and family needs, recommend Toyota Camry for best value proposition')
      
      await page.click('button[type="submit"]')
      
      // Send comparison to customer
      await page.click('text="Send Comparison"')
      await expect(page.locator(`text="Comparison sent to ${customer.email}"`)).toBeVisible()
    })
  })

  test('Handle customer with trade-in vehicle', async () => {
    await test.step('Process customer with trade-in during purchase', async () => {
      const customer = generateTestCustomer()
      const newVehicle = generateTestVehicle({ purchasePrice: 28000 })
      const tradeInVehicle = generateTestVehicle({ 
        make: 'Honda', 
        model: 'Accord', 
        year: 2018,
        mileage: 45000 
      })
      
      // Add new vehicle to inventory
      await page.goto('/admin/vehicles')
      await page.click('text="Add Vehicle"')
      
      await page.fill('[name="vin"]', newVehicle.vin)
      await page.fill('[name="year"]', newVehicle.year.toString())
      await page.fill('[name="make"]', newVehicle.make)
      await page.fill('[name="model"]', newVehicle.model)
      await page.fill('[name="auctionHouse"]', newVehicle.auctionHouse)
      await page.fill('[name="purchasePrice"]', newVehicle.purchasePrice.toString())
      
      await page.click('button[type="submit"]')
      
      // Create customer profile
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
      
      // Process trade-in evaluation
      await page.goto('/admin/trade-ins')
      await page.click('text="Evaluate Trade-in"')
      
      // Select customer
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      
      // Enter trade-in vehicle details
      await page.fill('[name="tradeInVin"]', tradeInVehicle.vin)
      await page.fill('[name="tradeInYear"]', tradeInVehicle.year.toString())
      await page.fill('[name="tradeInMake"]', tradeInVehicle.make)
      await page.fill('[name="tradeInModel"]', tradeInVehicle.model)
      await page.fill('[name="tradeInMileage"]', tradeInVehicle.mileage?.toString() || '45000')
      
      // Evaluate condition
      await page.selectOption('[name="exteriorCondition"]', 'good')
      await page.selectOption('[name="interiorCondition"]', 'good')
      await page.selectOption('[name="mechanicalCondition"]', 'excellent')
      await page.selectOption('[name="tiresCondition"]', 'fair')
      
      // Set trade-in value
      const tradeInValue = 18000
      await page.fill('[name="estimatedValue"]', tradeInValue.toString())
      await page.fill('[name="evaluationNotes"]', 'Well-maintained vehicle. Minor wear on tires. Engine and transmission in excellent condition.')
      
      await page.click('button[type="submit"]')
      
      // Create sales transaction with trade-in
      await page.goto('/admin/transactions')
      await page.click('text="Create Trade-in Transaction"')
      
      // Select customer and vehicles
      await page.click('[data-testid="customer-select"]')
      await page.click(`text="${customer.fullName}"`)
      
      await page.click('[data-testid="new-vehicle-select"]')
      await page.click(`text="${newVehicle.year} ${newVehicle.make} ${newVehicle.model}"`)
      
      await page.click('[data-testid="trade-vehicle-select"]')
      await page.click(`text="${tradeInVehicle.year} ${tradeInVehicle.make} ${tradeInVehicle.model}"`)
      
      // Set pricing
      const newVehiclePrice = 35000
      await page.fill('[name="newVehiclePrice"]', newVehiclePrice.toString())
      await page.fill('[name="tradeInValue"]', tradeInValue.toString())
      
      // Calculate difference
      const difference = newVehiclePrice - tradeInValue
      await expect(page.locator(`text="Amount Due: $${difference.toLocaleString()}"`)).toBeVisible()
      
      // Add tax and fees
      const tax = Math.round(newVehiclePrice * 0.08)
      await page.fill('[name="taxAmount"]', tax.toString())
      await page.fill('[name="processingFee"]', '299')
      
      await page.click('button[type="submit"]')
      
      // Verify trade-in transaction created
      await expect(page.locator('text="Trade-in transaction created successfully"')).toBeVisible()
      await expect(page.locator(`text="New Vehicle: ${newVehicle.year} ${newVehicle.make} ${newVehicle.model}"`)).toBeVisible()
      await expect(page.locator(`text="Trade-in: ${tradeInVehicle.year} ${tradeInVehicle.make} ${tradeInVehicle.model}"`)).toBeVisible()
      await expect(page.locator(`text="Trade-in Value: $${tradeInValue.toLocaleString()}"`)).toBeVisible()
    })
  })

  test('Track customer satisfaction and loyalty metrics', async () => {
    await test.step('Monitor customer satisfaction throughout journey', async () => {
      const customer = generateTestCustomer()
      
      // Create customer profile
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
      
      // Track satisfaction at multiple touchpoints
      await page.goto(`/admin/customers/${customer.email}/satisfaction`)
      
      // Initial inquiry satisfaction
      await page.click('text="Record Satisfaction Survey"')
      await page.selectOption('[name="touchpoint"]', 'initial_inquiry')
      await page.selectOption('[name="responseTime"]', 'very_satisfied')
      await page.selectOption('[name="staffKnowledge"]', 'satisfied')
      await page.selectOption('[name="overall"]', 'satisfied')
      await page.fill('[name="comments"]', 'Quick response to my inquiry. Staff was helpful.')
      await page.click('button[type="submit"]')
      
      // Vehicle viewing satisfaction
      await page.click('text="Record Satisfaction Survey"')
      await page.selectOption('[name="touchpoint"]', 'vehicle_viewing')
      await page.selectOption('[name="vehicleCondition"]', 'very_satisfied')
      await page.selectOption('[name="viewingExperience"]', 'very_satisfied')
      await page.selectOption('[name="staffProfessionalism"]', 'very_satisfied')
      await page.selectOption('[name="overall"]', 'very_satisfied')
      await page.fill('[name="comments"]', 'Vehicle was exactly as described. Very professional presentation.')
      await page.click('button[type="submit"]')
      
      // Purchase process satisfaction
      await page.click('text="Record Satisfaction Survey"')
      await page.selectOption('[name="touchpoint"]', 'purchase_process')
      await page.selectOption('[name="paperworkEfficiency"]', 'satisfied')
      await page.selectOption('[name="pricingTransparency"]', 'very_satisfied')
      await page.selectOption('[name="negotiationProcess"]', 'satisfied')
      await page.selectOption('[name="overall"]', 'satisfied')
      await page.fill('[name="comments"]', 'Fair pricing and transparent process. Paperwork took a bit longer than expected.')
      await page.click('button[type="submit"]')
      
      // Delivery satisfaction
      await page.click('text="Record Satisfaction Survey"')
      await page.selectOption('[name="touchpoint"]', 'delivery')
      await page.selectOption('[name="deliveryTiming"]', 'very_satisfied')
      await page.selectOption('[name="vehicleCondition"]', 'very_satisfied')
      await page.selectOption('[name="deliveryPersonnel"]', 'very_satisfied')
      await page.selectOption('[name="overall"]', 'very_satisfied')
      await page.fill('[name="comments"]', 'Perfect delivery experience. Vehicle was spotless and exactly as promised.')
      await page.click('button[type="submit"]')
      
      // View satisfaction analytics
      await page.goto(`/admin/analytics/customer-satisfaction`)
      
      // Verify satisfaction metrics
      await expect(page.locator('text="Overall Satisfaction Score"')).toBeVisible()
      await expect(page.locator('text="87.5%"')).toBeVisible() // Average of all touchpoints
      
      // Verify touchpoint breakdown
      await expect(page.locator('text="Initial Inquiry: 83%"')).toBeVisible()
      await expect(page.locator('text="Vehicle Viewing: 100%"')).toBeVisible()
      await expect(page.locator('text="Purchase Process: 83%"')).toBeVisible()
      await expect(page.locator('text="Delivery: 100%"')).toBeVisible()
      
      // Verify customer loyalty indicators
      await expect(page.locator('text="Loyalty Score: High"')).toBeVisible()
      await expect(page.locator('text="Referral Probability: 9/10"')).toBeVisible()
      await expect(page.locator('text="Repeat Purchase Likelihood: High"')).toBeVisible()
    })
  })
})