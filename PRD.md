# Product Requirements Document (PRD)
## Georgia Used Cars - Salvage Vehicle Management Platform

### Project Overview

**Product Name**: Georgia Used Cars Platform
**Version**: 1.0
**Date**: October 2025
**Project Type**: Web Application + Admin Panel

### Executive Summary

Georgia Used Cars is a comprehensive web platform designed for a salvage vehicle dealership in Sharjah, UAE. The platform manages the complete lifecycle of importing vehicles from US/Canada salvage auctions (Copart, IAAI, Impact Auto) to final sale in the UAE market. The system combines a public-facing inventory showcase website with a sophisticated admin panel for business operations management.

### Business Objectives

1. **Streamline Operations**: Digitize and automate vehicle lifecycle tracking from auction to sale
2. **Improve Customer Experience**: Provide a modern, Tesla-inspired vehicle browsing experience
3. **Financial Transparency**: Track all expenses and generate detailed profit/loss reports per vehicle
4. **Compliance**: Ensure VAT filing compliance with UAE FTA regulations
5. **Scalability**: Support business growth with efficient inventory and financial management

### Target Users

#### External Users
- **Potential Buyers**: Individuals and businesses looking for salvage vehicles
- **Registered Customers**: Users receiving early alerts and special offers

#### Internal Users
- **Super Admin**: Complete system access and configuration
- **Manager**: Business operations oversight
- **Inventory Manager**: Vehicle management and status updates
- **Finance Manager**: Financial operations and reporting
- **Sales Agent**: Customer management and sales operations
- **Viewer**: Read-only access for stakeholders

### Technical Requirements

#### Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: NextAuth.js with Supabase integration
- **UI Framework**: shadcn/ui + Tailwind CSS + Radix UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics and reporting
- **File Storage**: Supabase Storage for vehicle images and documents
- **PDF Generation**: React-PDF for invoices and reports
- **Email**: Resend for transactional emails

#### Performance Requirements
- **Page Load Time**: < 2 seconds initial load, < 500ms subsequent navigation
- **Mobile Performance**: Lighthouse score > 90
- **Uptime**: 99.9% availability
- **Database Response**: < 100ms for standard queries
- **Image Loading**: Progressive loading with WebP format optimization

#### Security Requirements
- **Authentication**: Two-factor authentication for admin users
- **Data Encryption**: AES-256 encryption at rest, TLS 1.3 in transit
- **Access Control**: Role-based permissions with granular controls
- **Audit Logging**: Complete user action tracking
- **Data Backup**: Automated daily backups with point-in-time recovery
- **GDPR Compliance**: Privacy controls and data export capabilities

### Functional Requirements

#### 1. User Management & Authentication

##### 1.1 User Roles & Permissions
- **Super Admin**
  - Full system access
  - User management (create, edit, delete, assign roles)
  - System configuration and settings
  - Audit log access
  - Data export/import capabilities

- **Manager**
  - Business overview dashboards
  - All vehicle and financial data access
  - Report generation and export
  - Customer relationship overview
  - Team performance monitoring

- **Inventory Manager**
  - Add/edit/delete vehicles
  - Update vehicle status and location
  - Manage vehicle photos and documents
  - Track vehicle expenses
  - Generate vehicle reports

- **Finance Manager**
  - Manage all financial transactions
  - Create and send invoices
  - Track payments and expenses
  - Generate financial reports
  - VAT filing and compliance

- **Sales Agent**
  - Customer management
  - Inquiry tracking and response
  - Invoice creation (view-only financial data)
  - Customer communication logs
  - Lead management

- **Viewer**
  - Read-only access to assigned data
  - Dashboard viewing
  - Report viewing (no export)

##### 1.2 Authentication Features
- Email/password authentication
- Two-factor authentication (TOTP)
- Single sign-on (SSO) ready
- Password reset functionality
- Session management and timeout
- Device tracking and management

#### 2. Vehicle Management System

##### 2.1 Vehicle Information Management
- **Basic Information**
  - VIN (unique identifier, validated)
  - Year, Make, Model, Trim
  - Engine specifications
  - Mileage
  - Color (exterior/interior)
  - Transmission type
  - Fuel type
  - Body style

- **Auction Information**
  - Auction house (Copart, IAAI, Impact Auto, etc.)
  - Auction location
  - Sale date
  - Lot number
  - Original listing details

- **Damage Assessment**
  - Primary damage
  - Secondary damage
  - Damage description
  - Repair requirements
  - Estimated repair costs

- **Documentation**
  - Title status
  - Keys available
  - Run and drive status
  - Photos (multiple angles)
  - Auction sheet/report
  - Title documents

##### 2.2 Vehicle Status Tracking
**Status Workflow:**
1. **Auction Won** - Vehicle successfully purchased at auction
2. **Payment Processing** - Paying auction fees and handling paperwork
3. **Pickup Scheduled** - Arranging vehicle pickup from auction
4. **In Transit to Port** - Vehicle being transported to shipping port
5. **At Port** - Vehicle at port awaiting shipment
6. **Shipped** - Vehicle on ship to UAE
7. **In Transit** - Vehicle in international shipping
8. **At UAE Port** - Vehicle arrived at UAE port
9. **Customs Clearance** - Going through customs process
10. **Released from Customs** - Customs clearance completed
11. **In Transit to Yard** - Vehicle being transported to dealership
12. **At Yard** - Vehicle at dealership facility
13. **Under Enhancement** - Vehicle being repaired/improved
14. **Ready for Sale** - Vehicle listed and available
15. **Reserved** - Vehicle held for specific customer
16. **Sold** - Vehicle sold to customer
17. **Delivered** - Transaction completed

**Status Tracking Features:**
- Automated status updates via integrations
- Manual status updates with notes
- Timestamp tracking for each status change
- Days in each status calculation
- Alert system for delayed vehicles
- Status history and audit trail

##### 2.3 Location Tracking
- GPS coordinates for precise tracking
- Facility/location names
- Port tracking
- Shipping vessel information
- Last known location updates
- Location history

##### 2.4 VIN Decoder Integration
- Automatic vehicle data population
- NHTSA vPIC API integration
- Vehicle specification lookup
- Validation of VIN accuracy
- Historical recall information

#### 3. Financial Management System

##### 3.1 Vehicle-Specific Expense Tracking

**Acquisition Costs:**
- Final bid amount
- Auction fees (buyer's premium)
- Documentation fees
- Late payment penalties
- Storage fees
- Gate fees

**Transportation Costs:**
- Towing from auction to port
- Loading/unloading fees
- Port storage fees
- Shipping costs (ocean freight)
- Insurance during transit

**Import Costs:**
- Customs duty
- Customs clearance fees
- Port handling charges
- Local transportation to yard
- Documentation fees

**Enhancement Costs:**
- Parts and materials
- Labor costs
- Paint and bodywork
- Mechanical repairs
- Cleaning and detailing
- Accessories and upgrades

**Marketing Costs:**
- Professional photography
- Listing fees
- Advertising expenses
- Marketing materials

##### 3.2 Operational Expense Management

**Fixed Expenses:**
- Rent and utilities
- Staff salaries and benefits
- Insurance premiums
- Software subscriptions
- Equipment leases

**Variable Expenses:**
- Marketing and advertising
- Professional services
- Maintenance and repairs
- Travel and transportation
- Office supplies

**Categorization Features:**
- Expense categories and subcategories
- Department allocation
- Project/vehicle assignment
- Tax categorization
- Vendor management

##### 3.3 Financial Features
- Multi-currency support (USD, CAD, AED)
- Real-time exchange rate integration
- Receipt upload and management
- Expense approval workflows
- Budget tracking and alerts
- Cost center allocation
- Financial dashboards and reporting

#### 4. Customer Management System

##### 4.1 Customer Types & Profiles

**Website Visitors (Anonymous)**
- Browse inventory
- View vehicle details
- Submit contact forms
- Save favorites (session-based)

**Registered Customers**
- Create account and profile
- Save vehicle searches and favorites
- Receive early inventory alerts
- Access special offers
- Communication preferences
- Purchase history

**Walk-in Customers**
- Manual entry by sales staff
- Complete profile creation
- Visit tracking and notes
- Interest recording

**Repeat Customers**
- Purchase history tracking
- Preferred vehicle types
- Credit and payment terms
- Special pricing arrangements

##### 4.2 Inquiry Management System

**Inquiry Sources:**
- Website contact forms
- Phone calls
- Walk-in customers
- Social media
- Referrals
- Email inquiries

**Inquiry Tracking:**
- Customer contact information
- Inquiry date and time
- Source of inquiry
- Vehicle(s) of interest
- Budget range
- Communication preferences
- Sales agent assigned

**Communication Management:**
- Complete communication history
- Email templates
- Follow-up scheduling
- Response time tracking
- Communication preferences
- Multi-channel support (phone, email, WhatsApp)

##### 4.3 Lead Management
- Lead scoring and prioritization
- Conversion tracking
- Pipeline management
- Follow-up automation
- Performance analytics
- Customer lifecycle tracking

#### 5. Sales & Invoice Management

##### 5.1 Invoice Creation & Management

**Invoice Features:**
- Professional invoice templates
- Automated calculations (VAT, totals)
- Multiple currency support
- Payment terms configuration
- Due date tracking
- Invoice numbering system

**Invoice Components:**
- Vehicle details and VIN
- Sale price and breakdown
- VAT calculations (5% UAE rate)
- Payment terms
- Company branding
- Legal disclaimers

**Invoice Status Tracking:**
- Draft
- Sent
- Viewed by customer
- Partially paid
- Fully paid
- Overdue
- Cancelled

##### 5.2 Payment Tracking
- Payment method recording
- Partial payment support
- Payment date tracking
- Outstanding balance calculation
- Payment reminders
- Late fee calculation

##### 5.3 Sales Reporting
- Sales performance by agent
- Monthly/quarterly sales reports
- Customer acquisition cost
- Average sale price
- Conversion rates
- Payment collection efficiency

#### 6. Reporting & Analytics System

##### 6.1 Vehicle Profit/Loss Reporting

**Comprehensive Vehicle Report:**
- Complete cost breakdown
- Sale price and terms
- Profit/loss calculation
- ROI percentage
- Days in inventory
- Total expenses by category
- Timeline and status history

**Cost Components Tracked:**
- All acquisition costs
- All transportation and shipping
- All customs and import fees
- All enhancement and repair costs
- All marketing and listing costs
- Overhead allocation (optional)

##### 6.2 Business Intelligence Dashboards

**Executive Dashboard:**
- Key performance indicators
- Financial overview
- Inventory summary
- Sales performance
- Alerts and notifications

**Inventory Dashboard:**
- Total vehicles by status
- Aging analysis
- Location distribution
- Value by category
- Slow-moving inventory alerts

**Financial Dashboard:**
- Revenue and expense trends
- Profit margins
- Cash flow analysis
- Budget vs. actual
- Outstanding receivables

**Sales Dashboard:**
- Sales pipeline
- Customer acquisition
- Conversion rates
- Team performance
- Customer satisfaction

##### 6.3 Specialized Reports

**VAT Filing Reports:**
- Input VAT calculations
- Output VAT calculations
- VAT return preparation
- FTA-compliant reporting
- Audit trail documentation

**Operational Reports:**
- Inventory aging report
- Vehicle status report
- Expense analysis by category
- Vendor performance report
- Customer inquiry report

**Financial Reports:**
- Profit and loss statement
- Cash flow statement
- Balance sheet view
- Budget variance report
- Cost analysis report

#### 7. Public Website Features

##### 7.1 Inventory Showcase

**Vehicle Listings:**
- Grid and list view options
- High-quality image galleries
- Vehicle specification display
- Damage information transparency
- Price display (if enabled)
- Availability status

**Search & Filtering:**
- Make and model filters
- Year range selection
- Price range (if enabled)
- Damage type filters
- Location filters
- Keyword search

**Vehicle Detail Pages:**
- Comprehensive vehicle information
- Photo gallery with zoom
- VIN decoder information
- Damage assessment details
- Contact forms
- Share functionality

##### 7.2 Customer Features

**User Registration:**
- Simple signup process
- Email verification
- Profile management
- Preference settings

**Alerts & Notifications:**
- New inventory alerts
- Price drop notifications
- Special offers
- Saved search updates

**Favorites & Saved Searches:**
- Save favorite vehicles
- Create custom searches
- Email alerts for matches
- Share favorites

##### 7.3 Contact & Inquiry System
- Multiple contact methods
- Inquiry forms with vehicle context
- Callback requests
- Live chat integration (future)
- Location and contact information

#### 8. Integration Requirements

##### 8.1 Third-Party Integrations

**VIN Decoder APIs:**
- NHTSA vPIC API (free)
- Commercial VIN decoder services
- Specification data population
- Recall information

**Currency Exchange:**
- Real-time exchange rates
- Historical rate tracking
- Multi-currency calculations
- Rate alerts and notifications

**Shipping & Logistics:**
- Tracking integration with shipping companies
- Port status updates
- Customs status tracking
- Delivery confirmation

**Payment Processing:**
- Secure payment gateways
- Multiple payment methods
- Payment status webhooks
- Fraud protection

**Communication Services:**
- Email service integration (Resend)
- SMS notifications
- WhatsApp Business API
- Push notifications

##### 8.2 Data Import/Export
- Excel/CSV import for bulk operations
- Data export for reporting
- Backup and restore functionality
- API endpoints for integrations

### Non-Functional Requirements

#### Performance Requirements
- Page load time < 2 seconds
- Database queries < 100ms
- 99.9% uptime availability
- Support for 1000+ concurrent users
- Mobile-responsive design
- Progressive Web App capabilities

#### Security Requirements
- HTTPS/TLS 1.3 encryption
- Data encryption at rest
- Role-based access control
- Audit logging
- Regular security updates
- GDPR compliance
- Data backup and recovery

#### Scalability Requirements
- Horizontal scaling capability
- CDN integration for static assets
- Database optimization
- Caching strategies
- Load balancing ready

#### Usability Requirements
- Intuitive user interface
- Mobile-first design
- Accessibility compliance (WCAG 2.1 AA)
- Multi-language support (English/Arabic)
- Offline functionality for core features

### User Interface Design Requirements

#### Design Philosophy
- **Tesla-inspired minimalism**: Clean, spacious layouts
- **Apple Human Interface Guidelines**: Intuitive interactions
- **Mobile-first responsive**: Progressive enhancement
- **Accessibility-first**: WCAG 2.1 AA compliance

#### Design System
- **Color Palette**: Professional, trustworthy colors
- **Typography**: Clear, readable font system
- **Spacing**: Consistent spacing scale
- **Components**: Reusable component library
- **Icons**: Consistent icon system
- **Photography**: High-quality vehicle imagery

#### Key UI Components
- **Vehicle Cards**: Clean design with essential information
- **Data Tables**: Advanced filtering and sorting
- **Forms**: Multi-step wizards for complex operations
- **Dashboards**: Information-dense but readable
- **Navigation**: Intuitive menu structure
- **Search**: Advanced search with filters

### Development Phases

#### Phase 1: Foundation (Weeks 1-4)
- Project setup and configuration
- Database design and setup
- Authentication system
- Basic UI components
- User management

#### Phase 2: Vehicle Management (Weeks 5-8)
- Vehicle CRUD operations
- Status tracking system
- Photo management
- VIN decoder integration
- Basic reporting

#### Phase 3: Financial Management (Weeks 9-12)
- Expense tracking
- Invoice system
- Payment tracking
- Financial reporting
- Multi-currency support

#### Phase 4: Customer & Sales (Weeks 13-16)
- Customer management
- Inquiry tracking
- Public website
- Sales pipeline
- Communication tools

#### Phase 5: Advanced Features (Weeks 17-20)
- Advanced reporting
- Analytics dashboards
- VAT compliance
- Integration APIs
- Performance optimization

#### Phase 6: Launch Preparation (Weeks 21-24)
- Security audit
- Performance testing
- User training
- Documentation
- Production deployment

### Success Metrics

#### Business Metrics
- Reduction in vehicle processing time by 50%
- Improved profit visibility per vehicle
- Increased customer inquiries by 30%
- Faster invoice processing and payment collection
- Accurate VAT filing and compliance

#### Technical Metrics
- 99.9% system uptime
- < 2 second page load times
- Mobile performance score > 90
- Zero security incidents
- User satisfaction score > 4.5/5

#### User Adoption Metrics
- 100% staff adoption within 2 months
- < 2 hours training time per user
- Reduced data entry errors by 80%
- Improved report generation efficiency

### Risk Assessment & Mitigation

#### Technical Risks
- **Data Migration**: Plan careful migration strategy with backups
- **Performance**: Implement caching and optimization early
- **Security**: Regular security audits and penetration testing
- **Integration**: Thorough testing of third-party APIs

#### Business Risks
- **User Adoption**: Comprehensive training and change management
- **Data Accuracy**: Validation rules and data quality checks
- **Compliance**: Legal review of VAT and business requirements
- **Scalability**: Architecture designed for growth

### Conclusion

The Georgia Used Cars platform represents a comprehensive digital transformation for salvage vehicle dealership operations. By combining modern web technologies with industry-specific requirements, the platform will streamline operations, improve customer experience, and provide valuable business insights for growth and profitability.

The phased development approach ensures deliverable milestones while maintaining focus on core business requirements. The emphasis on performance, security, and user experience will create a competitive advantage in the UAE salvage vehicle market.