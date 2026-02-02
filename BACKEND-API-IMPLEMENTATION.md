# Backend API Implementation Notes

This document outlines the backend API endpoints and database changes needed for the customer dashboard features (Payments, Favorites, Profile & Settings).

---

## 8. Payment History & Details API

### Database Schema Updates

Add to `prisma/schema.prisma`:

```prisma
model Payment {
  id                String   @id @default(cuid())
  reservationId     String
  reservation       Reservation @relation(fields: [reservationId], references: [id])
  customerId        String
  customer          Customer @relation(fields: [customerId], references: [id])

  type              String   // "deposit" or "balance"
  amount            Decimal  @db.Decimal(10, 2)
  currency          String   @default("AED")

  paymentMethod     String   // "Credit Card", "Bank Transfer", "Cash"
  cardLast4         String?  // Last 4 digits of card (if card payment)
  cardBrand         String?  // Visa, Mastercard, etc.

  status            String   // "completed", "pending", "failed", "processing"

  // Transaction IDs
  transactionId     String   @unique
  stripePaymentId   String?  // Stripe payment intent ID

  // Receipt tracking
  receiptUrl        String?
  receiptNumber     String?  @unique
  receiptUploaded   Boolean  @default(false)
  receiptStatus     String?  // "under_review", "approved", "rejected"

  // Billing details
  billingName       String
  billingEmail      String
  billingPhone      String
  billingAddress    String?

  // Timestamps
  paidAt            DateTime?
  processedAt       DateTime?
  failureReason     String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([customerId])
  @@index([reservationId])
  @@index([status])
  @@index([transactionId])
}
```

### API Endpoints

#### 1. GET /api/payments
**Description**: Get payment history for the authenticated customer

**Query Parameters**:
- `status` (optional): Filter by status (completed, pending, failed)
- `type` (optional): Filter by type (deposit, balance)
- `search` (optional): Search by transaction ID or vehicle details
- `page` (optional): Pagination page number
- `limit` (optional): Items per page

**Response**:
```json
{
  "payments": [
    {
      "id": "PAY-001234",
      "reservationId": "...",
      "vehicle": {
        "year": 2021,
        "make": "Toyota",
        "model": "Camry",
        "trim": "XLE"
      },
      "type": "deposit",
      "amount": 2500,
      "currency": "AED",
      "paymentMethod": "Credit Card",
      "cardLast4": "4242",
      "cardBrand": "Visa",
      "status": "completed",
      "transactionId": "TXN-2024-001234",
      "paidAt": "2024-01-01T10:00:00Z",
      "receiptUrl": "/receipts/PAY-001234.pdf"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "stats": {
    "totalPaid": 150000,
    "pendingCount": 2,
    "completedCount": 8
  }
}
```

#### 2. GET /api/payments/[id]
**Description**: Get detailed information about a specific payment

**Response**:
```json
{
  "id": "PAY-001234",
  "reservationId": "...",
  "vehicle": { ... },
  "type": "deposit",
  "amount": 2500,
  "currency": "AED",
  "paymentMethod": "Credit Card",
  "cardLast4": "4242",
  "cardBrand": "Visa",
  "status": "completed",
  "transactionId": "TXN-2024-001234",
  "stripePaymentId": "pi_...",
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+971501234567",
    "address": "Dubai, UAE"
  },
  "paidAt": "2024-01-01T10:00:00Z",
  "processedAt": "2024-01-01T10:00:05Z",
  "receiptUrl": "/receipts/PAY-001234.pdf",
  "receiptNumber": "RCP-2024-001234"
}
```

#### 3. POST /api/payments/[id]/receipt
**Description**: Upload payment receipt for balance payments

**Request Body** (multipart/form-data):
- `receipt`: File (image or PDF)

**Response**:
```json
{
  "success": true,
  "receiptUrl": "https://...",
  "receiptStatus": "under_review",
  "message": "Receipt uploaded successfully. Our team will review it within 24 hours."
}
```

#### 4. GET /api/payments/[id]/receipt/download
**Description**: Download payment receipt PDF

**Response**: PDF file download

---

## 9. Favorites API

### Database Schema Updates

Add to `prisma/schema.prisma`:

```prisma
model Favorite {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  addedAt     DateTime @default(now())

  @@unique([customerId, vehicleId])
  @@index([customerId])
  @@index([vehicleId])
}
```

### API Endpoints

#### 1. GET /api/favorites
**Description**: Get all favorite vehicles for the authenticated customer

**Query Parameters**:
- `type` (optional): Filter by vehicle type (sedan, suv, truck, etc.)
- `available` (optional): Filter by availability (true/false)
- `sortBy` (optional): Sort by (newest, price-low, price-high, year-new, year-old)
- `search` (optional): Search by make, model, year

**Response**:
```json
{
  "favorites": [
    {
      "id": "fav-123",
      "vehicleId": "vehicle-456",
      "vehicle": {
        "id": "vehicle-456",
        "year": 2021,
        "make": "Toyota",
        "model": "Camry",
        "trim": "XLE",
        "price": 50000,
        "currency": "AED",
        "type": "sedan",
        "mileage": 35000,
        "fuelType": "Petrol",
        "transmission": "Automatic",
        "images": ["..."],
        "isAvailable": true,
        "featured": true
      },
      "addedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "stats": {
    "total": 5,
    "available": 4,
    "avgPrice": 75000
  }
}
```

#### 2. POST /api/favorites
**Description**: Add a vehicle to favorites

**Request Body**:
```json
{
  "vehicleId": "vehicle-456"
}
```

**Response**:
```json
{
  "success": true,
  "favoriteId": "fav-123",
  "message": "Vehicle added to favorites"
}
```

#### 3. DELETE /api/favorites/[vehicleId]
**Description**: Remove a vehicle from favorites

**Response**:
```json
{
  "success": true,
  "message": "Vehicle removed from favorites"
}
```

#### 4. GET /api/favorites/check/[vehicleId]
**Description**: Check if a vehicle is in user's favorites

**Response**:
```json
{
  "isFavorite": true,
  "favoriteId": "fav-123"
}
```

---

## 10. Additional Vehicle API Updates

### Update existing Vehicle endpoints to include favorite status

#### GET /api/vehicles (Inventory listing)
Add `isFavorite` boolean to each vehicle in the response when user is authenticated.

#### GET /api/vehicles/[id] (Vehicle details)
Add `isFavorite` boolean to the response when user is authenticated.

**Example Response**:
```json
{
  "id": "vehicle-456",
  "year": 2021,
  "make": "Toyota",
  "model": "Camry",
  "isFavorite": true,
  "favoriteId": "fav-123",
  // ... other vehicle fields
}
```

---

## Integration Tasks

### 1. Payment History Integration
- [ ] Create Payment model in Prisma schema
- [ ] Run database migration
- [ ] Create `/api/payments` route
- [ ] Create `/api/payments/[id]` route
- [ ] Create `/api/payments/[id]/receipt` route for uploads
- [ ] Create `/api/payments/[id]/receipt/download` route
- [ ] Configure Supabase Storage bucket for receipt uploads
- [ ] Update Stripe webhook to create Payment records on successful payment
- [ ] Generate PDF receipts for payments

### 2. Favorites Integration
- [ ] Create Favorite model in Prisma schema
- [ ] Run database migration
- [ ] Create `/api/favorites` GET route
- [ ] Create `/api/favorites` POST route
- [ ] Create `/api/favorites/[vehicleId]` DELETE route
- [ ] Create `/api/favorites/check/[vehicleId]` GET route
- [ ] Update vehicle listing API to include `isFavorite` status
- [ ] Update vehicle details API to include `isFavorite` status
- [ ] Add favorite toggle button to vehicle cards
- [ ] Add favorite toggle button to vehicle details page
- [ ] Add favorite toggle to featured vehicle carousel

### 3. Frontend-Backend Connection
**Payments Pages**:
- Replace mock data in `/app/my-account/payments/page.tsx` with API call to `/api/payments`
- Replace mock data in `/app/my-account/payments/[id]/page.tsx` with API call to `/api/payments/[id]`
- Connect receipt upload to `/api/payments/[id]/receipt`
- Connect receipt download to `/api/payments/[id]/receipt/download`

**Favorites Page**:
- Replace mock data in `/app/my-account/favorites/page.tsx` with API call to `/api/favorites`
- Connect remove button to DELETE `/api/favorites/[vehicleId]`
- Add favorite toggle button to vehicle cards (inventory, featured carousel)
- Add favorite toggle button to vehicle details page
- Connect toggle to POST/DELETE `/api/favorites`

---

## Email Notifications

### Payment Receipt Uploaded
**Trigger**: Customer uploads balance payment receipt
**To**: finance@georgiausedcars.com
**Subject**: New Payment Receipt - Reservation [ID]
**Content**:
- Customer name and email
- Reservation ID
- Vehicle details
- Payment amount
- Link to admin panel to review receipt

### Payment Receipt Approved
**Trigger**: Admin approves payment receipt
**To**: Customer email
**Subject**: Payment Confirmed - Your Vehicle is Ready!
**Content**:
- Confirmation that balance payment was received
- Next steps for vehicle delivery/pickup
- Contact information

### Payment Receipt Rejected
**Trigger**: Admin rejects payment receipt
**To**: Customer email
**Subject**: Payment Receipt Needs Attention
**Content**:
- Reason for rejection
- Instructions to upload a new receipt
- Contact information for assistance

---

## Security Considerations

1. **Authentication**: All `/api/payments/*` and `/api/favorites/*` endpoints must verify user authentication
2. **Authorization**: Users can only access their own payments and favorites
3. **Receipt Uploads**:
   - Validate file types (images, PDFs only)
   - Limit file size (max 5MB)
   - Scan for malware
   - Store in secure Supabase Storage bucket
4. **PCI Compliance**: Never store full credit card numbers; only last 4 digits and brand
5. **Rate Limiting**: Implement rate limiting on favorite add/remove operations

---

## Admin Panel Updates

### Admin Payments Management Page
Create `/app/admin/payments/page.tsx`:
- View all payment transactions
- Filter by status, type, customer
- Search by transaction ID
- Review uploaded receipts
- Approve/reject balance payment receipts
- Export payment reports
- View payment analytics

### Admin Favorites Analytics
Add section to admin dashboard:
- Most favorited vehicles
- Favorite conversion rate (favorites → reservations)
- Trending vehicle types
- Help identify hot inventory

---

## 11. Profile Management API

### Database Schema Updates

Update existing `Customer` model in `prisma/schema.prisma`:

```prisma
model Customer {
  id            String   @id @default(cuid())
  userId        String   @unique  // Link to Supabase Auth user

  // Personal Information
  name          String
  email         String   @unique
  phone         String
  emiratesId    String?
  dateOfBirth   DateTime?
  nationality   String?

  // Address
  street        String?
  city          String?
  emirate       String?
  country       String   @default("UAE")
  postalCode    String?

  // Account
  verified      Boolean  @default(false)
  joinedDate    DateTime @default(now())

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  reservations  Reservation[]
  payments      Payment[]
  favorites     Favorite[]
}
```

### API Endpoints

#### 1. GET /api/profile
**Description**: Get authenticated user's profile information

**Response**:
```json
{
  "id": "cust-123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+971501234567",
  "emiratesId": "784-1234-1234567-1",
  "dateOfBirth": "1990-01-15",
  "nationality": "United Arab Emirates",
  "address": {
    "street": "Sheikh Zayed Road",
    "city": "Dubai",
    "emirate": "Dubai",
    "country": "UAE",
    "postalCode": "00000"
  },
  "verified": true,
  "joinedDate": "2024-01-15T10:00:00Z"
}
```

#### 2. PUT /api/profile
**Description**: Update user profile information

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+971501234567",
  "emiratesId": "784-1234-1234567-1",
  "dateOfBirth": "1990-01-15",
  "nationality": "United Arab Emirates",
  "address": {
    "street": "Sheikh Zayed Road",
    "city": "Dubai",
    "emirate": "Dubai",
    "country": "UAE",
    "postalCode": "00000"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": { /* updated profile data */ }
}
```

**Validation Rules**:
- Emirates ID format: XXX-XXXX-XXXXXXX-X
- Phone format: +971XXXXXXXXX
- Email change requires verification

---

## 12. Settings & Preferences API

### Database Schema Updates

Add new `UserSettings` model to `prisma/schema.prisma`:

```prisma
model UserSettings {
  id          String   @id @default(cuid())
  userId      String   @unique

  // Notifications
  emailReservations     Boolean @default(true)
  emailPayments         Boolean @default(true)
  emailReminders        Boolean @default(true)
  emailPromotions       Boolean @default(false)
  emailNewsletter       Boolean @default(true)

  smsReservations       Boolean @default(true)
  smsPayments           Boolean @default(true)
  smsReminders          Boolean @default(true)

  // Privacy
  profilePublic         Boolean @default(false)
  shareAnalytics        Boolean @default(false)
  marketingConsent      Boolean @default(false)

  // Preferences
  language              String  @default("en")
  currency              String  @default("AED")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### API Endpoints

#### 1. GET /api/settings
**Description**: Get user settings and preferences

**Response**:
```json
{
  "notifications": {
    "email": {
      "reservations": true,
      "payments": true,
      "reminders": true,
      "promotions": false,
      "newsletter": true
    },
    "sms": {
      "reservations": true,
      "payments": true,
      "reminders": true
    }
  },
  "privacy": {
    "profilePublic": false,
    "shareAnalytics": false,
    "marketingConsent": false
  },
  "preferences": {
    "language": "en",
    "currency": "AED"
  }
}
```

#### 2. PUT /api/settings/notifications
**Description**: Update notification preferences

**Request Body**:
```json
{
  "email": {
    "reservations": true,
    "payments": true,
    "reminders": true,
    "promotions": false,
    "newsletter": true
  },
  "sms": {
    "reservations": true,
    "payments": true,
    "reminders": true
  }
}
```

#### 3. PUT /api/settings/privacy
**Description**: Update privacy settings

**Request Body**:
```json
{
  "profilePublic": false,
  "shareAnalytics": false,
  "marketingConsent": false
}
```

#### 4. PUT /api/settings/preferences
**Description**: Update language and currency preferences

**Request Body**:
```json
{
  "language": "en",
  "currency": "AED"
}
```

#### 5. POST /api/settings/password
**Description**: Change user password

**Request Body**:
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Validation**:
- Current password must be correct
- New password minimum 8 characters
- Must include uppercase, lowercase, number

#### 6. DELETE /api/account
**Description**: Delete user account and all data

**Request Body**:
```json
{
  "password": "user_password",
  "confirmation": "DELETE"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Actions on deletion**:
- Cancel all active reservations
- Anonymize payment records (keep for legal compliance)
- Delete favorites
- Delete user settings
- Delete Supabase Auth user
- Send confirmation email

---

## Integration Tasks - Profile & Settings

### 1. Profile Page Integration
- [ ] Create Customer profile update endpoint
- [ ] Validate Emirates ID format
- [ ] Handle email change with verification
- [ ] Handle phone change with SMS verification (optional)
- [ ] Sync with Supabase Auth user metadata
- [ ] Replace mock localStorage data with API calls

### 2. Settings Page Integration
- [ ] Create UserSettings model and table
- [ ] Auto-create default settings on user registration
- [ ] Create settings CRUD endpoints
- [ ] Implement password change with Supabase Auth
- [ ] Implement account deletion workflow
- [ ] Add email verification for sensitive changes
- [ ] Replace mock state with API calls

### 3. Email Notifications
When user updates notification preferences, update email service subscriptions accordingly.

### 4. Security Considerations
- Require password confirmation for:
  - Email changes
  - Password changes
  - Account deletion
- Rate limit password change attempts
- Log all security-related actions
- Send email notifications for:
  - Profile email changed
  - Password changed
  - New login from different device
  - Account deletion initiated
