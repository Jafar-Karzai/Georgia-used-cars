Implementation Steps

  1. Database Schema Updates

  Add to prisma/schema.prisma:
  model Reservation {
    id, vehicleId, customerId, userId (Supabase auth)
    reservationAmount (5% of vehicle price)
    remainingAmount (95%)
    paymentIntentId (from payment gateway)
    status: pending_payment → paid_deposit → awaiting_balance → completed → cancelled
    depositPaidAt, balancePaymentMethod, balancePaidAt
    expiresAt (reservation expiry - e.g., 7 days)
    Relations: Vehicle, Customer, Invoice, Payments
  }

  2. Public User Authentication

  - Add registration page: /app/auth/register/page.tsx (using Supabase Auth)
  - Link Customer ↔ Supabase User: Add userId field to Customer model
  - Auth flow: Register → Email verification → Auto-login
  - Customer dashboard: /app/dashboard/* (view reservations, payments, vehicles)

  3. Payment Gateway Integration

  - Install Stripe SDK (best for UAE, supports AED)
  - API routes:
    - POST /api/reservations/create-payment-intent → creates Stripe checkout
    - POST /api/reservations/confirm → handles webhook after payment
  - Embed Stripe Elements in reservation modal

  4. Vehicle Details Page Updates (/app/(site)/inventory/[id]/page.tsx)

  Add "Reserve Now" button (visible only if):
  - ✅ vehicle.isPublic === true
  - ✅ vehicle.salePrice > 0
  - ✅ Not already reserved

  Button click flow:
  1. Check if user logged in → if not, redirect to /auth/register?redirect=/inventory/{id}&action=reserve
  2. Show reservation modal with:
    - Vehicle summary
    - Total price & 5% deposit calculation
    - Payment form (Stripe Elements)
    - Terms & conditions
  3. On payment success → Create reservation → Show instructions for remaining 95%

  5. Post-Reservation Customer Experience

  Redirect to: /dashboard/reservations/{id} showing:
  - ✅ Deposit paid confirmation
  - 📋 Payment instructions for remaining 95%:
    - Bank transfer details (account name, IBAN, SWIFT, reference number)
    - Cash deposit machine instructions
    - Physical visit option (showroom address, hours)
    - Email for receipt upload: finance@georgiausedcars.com
  - ⏰ Reservation expiry countdown
  - 📄 Download receipt button

  Email notifications:
  - Immediate: "Reservation confirmed" + payment instructions
  - Reminder at day 3, 5 if balance unpaid
  - Expiry warning at day 6

  6. Admin Panel Updates

  Sales Tab (/app/admin/sales/* - create if doesn't exist):
  - New "Reservations" section showing all reservations with filters (pending, paid, completed)
  - Each reservation shows:
    - Customer details
    - Vehicle info
    - Deposit amount paid
    - Remaining balance due
    - Payment method selected
    - Status timeline

  Update /admin/invoices:
  - Auto-create invoice when reservation is made
  - Two line items: "Reservation Deposit (Paid)" + "Balance Due"
  - Link invoice to reservation

  Update /admin/vehicles/[id]:
  - Show "RESERVED" badge if vehicle has active reservation
  - Prevent making vehicle public if reserved
  - Add "Reservations" tab showing all reservations for this vehicle

  Notifications:
  - Dashboard alert when new reservation created
  - Alert when customer uploads balance payment receipt

  7. Additional Features

  - Reservation expiry cron job: Run daily to auto-cancel expired reservations
  - Email service: Use Resend or SendGrid for transactional emails
  - Receipt upload: Add to customer dashboard (file upload → stores in Supabase Storage)
  - Admin receipt review: In /admin/reservations/{id}, show uploaded receipts with approve/reject actions

  ---
  Technical Architecture

  Frontend:
  - Reservation modal component (reusable)
  - Stripe checkout form
  - Customer dashboard layout

  Backend:
  - /api/reservations/* - CRUD operations
  - /api/payments/stripe/* - Stripe integration
  - /api/payments/* - Payment history and details ✨ NEW
  - /api/favorites/* - Add/remove/list favorites ✨ NEW
  - Webhook handler for Stripe events
  - Email service integration

  Database Flow:
  1. User reserves → Creates Reservation (status: pending_payment)
  2. Stripe payment success → Updates to paid_deposit + creates Payment record
  3. Creates Invoice with two line items
  4. Admin receives notification
  5. Customer by default has 7 days pay balance → Uploads receipt → Admin approves → Status: completed
  6. Vehicle marked as sold

  ---
  Key Files to Create/Modify

  New files (~15 files):
  - prisma/schema.prisma (add Reservation model)
  - app/auth/register/page.tsx
  - app/dashboard/** (customer area)
  - app/api/reservations/**
  - app/api/payments/stripe/**
  - components/reservations/ReservationModal.tsx
  - lib/services/reservations.ts
  - lib/stripe.ts

  Modify:
  - app/(site)/inventory/[id]/page.tsx (add Reserve button)
  - app/admin/vehicles/[id]/page.tsx (add Reservations tab)
  - Customer model (add userId link)



  ✅ Completed Frontend Components

  1. Reservation Flow (Public Website)

  📄 ReservationModal Component (/components/reservations/ReservationModal.tsx)
  - Multi-step reservation process: Confirm → Payment → Processing → Success
  - Shows 5% deposit calculation with payment breakdown
  - Mock Stripe payment form with card validation
  - Terms & conditions acceptance
  - Auto-redirects to register page if user not authenticated

  🚗 Vehicle Details Page (/app/(site)/inventory/[id]/page.tsx)
  - Added "Reserve This Vehicle" button (only shows if vehicle is public & has price)
  - Displays "Secure your vehicle with just 5% deposit" tagline
  - Integrates with ReservationModal

  ---
  2. Customer Authentication (Mock)

  ✍️ Registration Page (/app/auth/register/page.tsx)
  - Full name, email, phone, password fields
  - Password strength validation (min 8 characters)
  - Terms & conditions checkbox
  - Marketing consent option
  - Redirects to login after registration

  🔑 Login Page (/app/auth/customer-login/page.tsx)
  - Email & password fields
  - "Remember me" option
  - Shows success message if coming from registration
  - Links to register page
  - Social login buttons (Google, GitHub - disabled for now)

  ---
  3. Customer Dashboard (/my-account/*)

  🏠 Dashboard Home (/my-account/page.tsx)
  - Stats cards: Active Reservations, Pending Payments, Favorites, Completed Purchases
  - Recent reservations with urgency alerts (days remaining)
  - Payment summaries with deposit/balance breakdown
  - Quick action cards for browsing vehicles and help

  📋 Reservations List (/my-account/reservations/page.tsx)
  - Tabs: All, Active, Completed, Expired
  - Each reservation shows vehicle image, status badges, payment info
  - Urgency warnings for expiring reservations
  - "View Details" button for each reservation

  💳 Reservation Details (/my-account/reservations/[id]/page.tsx)
  - Payment summary with deposit paid & remaining balance
  - Countdown timer showing days until expiration
  - 3 payment methods with detailed instructions:
    a. Bank Transfer: Bank details with copy-to-clipboard for IBAN, account number, SWIFT
    b. Cash Deposit: Step-by-step CDM instructions
    c. Showroom Visit: Address, hours, contact info, what to bring
  - Upload receipt section with drag-drop area
  - Need Help card with contact options
  - All bank details fully specified (Emirates NBD, IBAN, etc.)

  🎨 Dashboard Layout (/my-account/layout.tsx)
  - Side navigation with icons & badges
  - Top navbar with notifications & user menu
  - Mobile-responsive with hamburger menu
  - Links to: Dashboard, Reservations, Payments, Favorites, Profile, Settings

  ---
  4. Admin Panel

  📊 Reservations Management (/admin/reservations/page.tsx)
  - Statistics: Total reservations, active, completed, total revenue
  - Search by reservation ID, customer, or vehicle
  - Filter by status (All, Active, Deposit Paid, Awaiting Balance, etc.)
  - Table view with:
    - Customer name & email
    - Vehicle details & VIN
    - Deposit paid (green) & balance due
    - Status badges
    - Expiration countdown with urgency alerts
    - View details button
  - Export functionality

  ---

  📁 Files Created

  Components:
  - /components/reservations/ReservationModal.tsx

  Pages:
  - /app/auth/register/page.tsx
  - /app/auth/customer-login/page.tsx
  - /app/my-account/layout.tsx
  - /app/my-account/page.tsx
  - /app/my-account/reservations/page.tsx
  - /app/my-account/reservations/[id]/page.tsx
  - /app/my-account/payments/page.tsx ✨ NEW
  - /app/my-account/payments/[id]/page.tsx ✨ NEW
  - /app/my-account/favorites/page.tsx ✨ NEW
  - /app/my-account/profile/page.tsx ✨ NEW
  - /app/my-account/settings/page.tsx ✨ NEW
  - /app/admin/reservations/page.tsx

  💰 Payments List (/my-account/payments/page.tsx)
  - Stats cards: Total paid, pending verification, total transactions
  - Search by payment ID, transaction ID, or vehicle
  - Filter tabs: All, Completed, Pending, Failed
  - Payment cards showing:
    - Vehicle information
    - Payment type badges (Deposit/Balance)
    - Amount, payment method, transaction IDs
    - Status badges with icons
    - Receipt upload status
    - Download receipt button (for completed payments)
  - Help section with finance team contact

  💳 Payment Details (/my-account/payments/[id]/page.tsx)
  - Large payment summary display
  - Detailed payment information grid (method, card details, dates, IDs)
  - Billing information section
  - Related vehicle section with links to reservation and vehicle pages
  - Payment timeline showing progression
  - Actions sidebar (download receipt, email receipt, download invoice)
  - Security info card

  ❤️ Favorites List (/my-account/favorites/page.tsx)
  - Stats cards: Total favorites, available vehicles, average price
  - Advanced search and filtering
  - Filter by vehicle type (sedan, SUV, truck, coupe, hatchback)
  - Sort options (recently added, price, year)
  - Grid/List view toggle
  - Vehicle cards with:
    - High-quality images (Next.js Image optimization)
    - Featured/Sold badges
    - Remove from favorites (with confirmation dialog)
    - Vehicle specs (mileage, fuel type, transmission)
    - View details and Reserve buttons
    - Added date timestamp
  - Empty states for no favorites or no matches

  👤 Profile Page (/my-account/profile/page.tsx)
  - Profile overview card with avatar and verification badge
  - Account information (member since, Emirates ID)
  - Editable personal information:
    - Full name, email, phone
    - Date of birth, nationality
    - Emirates ID number
  - Address information for vehicle delivery:
    - Street address, city, emirate
    - Country, postal code
  - Edit mode toggle with save/cancel
  - Privacy notice
  - Syncs with localStorage (mock data)

  ⚙️ Settings Page (/my-account/settings/page.tsx)
  - Notification Preferences:
    - Email notifications (reservations, payments, reminders, promotions, newsletter)
    - SMS notifications (critical alerts only)
    - Individual toggles for each notification type
  - Security:
    - Change password with show/hide toggle
    - Current, new, and confirm password fields
  - Privacy Settings:
    - Profile visibility toggle
    - Analytics data sharing
    - Marketing communications opt-in/out
  - Language & Region:
    - Language selection (English, Arabic)
    - Currency preference (AED, USD, EUR)
  - Danger Zone:
    - Delete account with confirmation dialog
    - Warning about data deletion

  ---

  📋 Backend APIs Needed for Profile & Settings:

  See BACKEND-API-IMPLEMENTATION.md sections 11-12 for full details:

  Profile:
  - GET/PUT /api/profile - Read/update customer profile
  - Emirates ID validation, email/phone verification

  Settings:
  - GET/PUT /api/settings/* - Notification, privacy, preferences
  - POST /api/settings/password - Change password
  - DELETE /api/account - Account deletion with confirmation

  Database:
  - Update Customer model (add address fields, emiratesId, etc.)
  - Create UserSettings model for preferences

  Modified:
  - /app/(site)/inventory/[id]/page.tsx (added Reserve Now button)
  - /next.config.js (added images.unsplash.com domain for Next.js Image)