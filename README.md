# Georgia Used Cars - Management Platform

A comprehensive web platform for managing salvage vehicle imports and sales operations in the UAE.

## 🚗 Overview

Georgia Used Cars platform is designed to manage the complete lifecycle of importing vehicles from US/Canada salvage auctions to final sale in the UAE market. The system combines a public-facing inventory showcase website with a sophisticated admin panel for business operations management.

## ✨ Features

### Public Website
- Vehicle inventory showcase with advanced search and filtering
- Customer registration and inquiry system
- VIN-based vehicle information display
- Mobile-responsive design with Tesla-inspired UI

### Admin Panel
- **Vehicle Management**: Complete vehicle lifecycle tracking from auction to sale
- **Financial Management**: Expense tracking, invoice generation, profit/loss analysis
- **Customer Management**: Customer profiles, inquiry tracking, communication logs
- **User Management**: Role-based permissions and access control
- **Reporting**: Comprehensive business intelligence and VAT compliance

### Security & Performance
- Role-based access control with granular permissions
- Two-factor authentication for admin users
- Real-time data synchronization
- Optimized performance with caching strategies

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with custom role management
- **UI Framework**: shadcn/ui + Tailwind CSS + Radix UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics
- **File Storage**: Supabase Storage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Environment variables (see .env.example)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd georgia-used-cars
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Set up the database:
```bash
# Run the schema.sql file in your Supabase SQL editor
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
georgia-used-cars/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── auth/              # Authentication pages
│   ├── inventory/         # Public inventory pages
│   └── ...
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ...
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication logic
│   ├── database/        # Database schema and queries
│   └── supabase/        # Supabase configuration
├── types/               # TypeScript type definitions
└── ...
```

## 🔐 User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access
2. **Manager** - Business operations oversight
3. **Inventory Manager** - Vehicle management
4. **Finance Manager** - Financial operations
5. **Sales Agent** - Customer & sales management
6. **Viewer** - Read-only access

### Permission System
The platform uses a granular permission system that controls access to specific features based on user roles. See `types/auth.ts` for detailed permission definitions.

## 📊 Database Schema

The database schema includes comprehensive tables for:
- User profiles and authentication
- Vehicle management and tracking
- Financial operations and expenses
- Customer and inquiry management
- Audit logging and system settings

See `lib/database/schema.sql` for the complete database structure.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Adding New Components

Use the shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```

## 🚀 Deployment

### Production Requirements
- Supabase production project
- Environment variables configured
- Domain setup for custom authentication redirects

### Deployment Steps
1. Build the application: `npm run build`
2. Deploy to your hosting platform (Vercel, Netlify, etc.)
3. Configure environment variables
4. Set up database production schema
5. Configure authentication providers and redirects

## 📈 Roadmap

### Phase 1: Foundation ✅
- Project setup and authentication
- Database schema and basic structure
- User roles and permissions

### Phase 2: Core Features (In Progress)
- Vehicle management system
- Financial tracking and reporting
- Customer management

### Phase 3: Advanced Features
- Public website and inventory showcase
- Advanced analytics and reporting
- Integration with external APIs

### Phase 4: Optimization
- Performance optimization
- Mobile app (PWA)
- Advanced security features

## 🤝 Contributing

This is a private project for Georgia Used Cars. For internal development:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## 📄 License

This project is proprietary and confidential. All rights reserved by Georgia Used Cars.

## 📞 Support

For technical support or questions, contact the development team.

---

**Georgia Used Cars** - Premium salvage vehicles from US and Canada auctions in Sharjah, UAE.