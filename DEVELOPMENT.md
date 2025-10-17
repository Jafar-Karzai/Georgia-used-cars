# Development Guide - Georgia Used Cars

## 🏗️ Architecture Overview

The Georgia Used Cars platform follows a modern, scalable architecture designed for performance and maintainability.

### Frontend Architecture
- **Next.js 14+** with App Router for optimal performance and SEO
- **TypeScript** for type safety and developer experience
- **Tailwind CSS + shadcn/ui** for consistent, accessible components
- **Zustand** for lightweight state management
- **React Query** for server state management and caching

### Backend Architecture
- **Supabase** as Backend-as-a-Service providing:
  - PostgreSQL database with real-time subscriptions
  - Authentication and authorization
  - File storage for vehicle images and documents
  - Edge functions for serverless compute

### Database Design
- **PostgreSQL** with comprehensive schema for business operations
- **Row Level Security (RLS)** for data protection
- **Audit logging** for compliance and tracking
- **Optimized indexes** for performance

## 🛠️ Development Setup

### Local Development Environment

1. **Install dependencies:**
```bash
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

3. **Database setup:**
- Run the SQL schema in your Supabase project
- Configure Row Level Security policies
- Set up storage buckets for file uploads

4. **Start development server:**
```bash
npm run dev
```

### Code Quality Tools

The project includes several tools to maintain code quality:

```bash
# TypeScript checking
npm run typecheck

# Linting
npm run lint

# Formatting (if configured)
npm run format
```

## 📁 Detailed Project Structure

```
georgia-used-cars/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth route group
│   │   └── login/               # Login page
│   ├── admin/                   # Admin panel
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── vehicles/            # Vehicle management
│   │   ├── customers/           # Customer management
│   │   ├── finances/            # Financial management
│   │   ├── reports/             # Reporting
│   │   └── settings/            # System settings
│   ├── inventory/               # Public inventory
│   ├── api/                     # API routes
│   │   ├── vehicles/            # Vehicle API endpoints
│   │   ├── customers/           # Customer API endpoints
│   │   └── auth/                # Authentication endpoints
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── auth/                    # Authentication components
│   │   ├── login-form.tsx
│   │   ├── protected-route.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   ├── dashboard/               # Dashboard components
│   ├── vehicles/                # Vehicle components
│   ├── customers/               # Customer components
│   └── forms/                   # Form components
├── lib/                         # Utility libraries
│   ├── auth/                    # Authentication logic
│   │   ├── context.tsx          # Auth context provider
│   │   ├── permissions.ts       # Permission utilities
│   │   └── hooks.ts             # Auth hooks
│   ├── database/                # Database utilities
│   │   ├── schema.sql           # Database schema
│   │   ├── queries.ts           # Database queries
│   │   └── types.ts             # Database types
│   ├── supabase/                # Supabase configuration
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── middleware.ts        # Auth middleware
│   ├── utils.ts                 # General utilities
│   └── constants.ts             # Application constants
├── types/                       # TypeScript definitions
│   ├── database.ts              # Database types
│   ├── auth.ts                  # Authentication types
│   └── api.ts                   # API types
├── hooks/                       # Custom React hooks
│   ├── use-vehicles.ts          # Vehicle data hooks
│   ├── use-customers.ts         # Customer data hooks
│   └── ...
└── utils/                       # Utility functions
    ├── validators.ts            # Zod schemas
    ├── formatters.ts            # Data formatters
    └── helpers.ts               # Helper functions
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. User submits credentials via login form
2. Supabase Auth validates credentials
3. User profile is fetched from `profiles` table
4. Role and permissions are loaded
5. Auth context is updated

### Role-Based Access Control (RBAC)
```typescript
// Example permission check
const { hasPermission } = useAuth()

if (hasPermission('manage_vehicles')) {
  // Show vehicle management UI
}
```

### Protected Routes
```typescript
// Protect entire route
<ProtectedRoute requiredRoles={['inventory_manager']}>
  <VehicleManagement />
</ProtectedRoute>

// Protect with specific permissions
<ProtectedRoute requiredPermissions={['view_finances']}>
  <FinancialReports />
</ProtectedRoute>
```

## 🗄️ Database Development

### Schema Management
- All schema changes should be tracked in `lib/database/schema.sql`
- Use migrations for production deployments
- Test schema changes in development environment first

### Query Patterns
```typescript
// Example vehicle query with RLS
const { data: vehicles } = await supabase
  .from('vehicles')
  .select(`
    *,
    vehicle_photos(url, is_primary),
    expenses(amount, category)
  `)
  .eq('current_status', 'ready_for_sale')
  .order('created_at', { ascending: false })
```

### Real-time Subscriptions
```typescript
// Listen for vehicle updates
const subscription = supabase
  .channel('vehicles')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'vehicles'
  }, handleVehicleChange)
  .subscribe()
```

## 🎨 UI/UX Development

### Design System
- Use shadcn/ui components as base
- Customize via CSS variables in `globals.css`
- Maintain consistency with design tokens

### Component Development
```typescript
// Example component structure
interface VehicleCardProps {
  vehicle: Vehicle
  onEdit?: (vehicle: Vehicle) => void
  className?: string
}

export function VehicleCard({ vehicle, onEdit, className }: VehicleCardProps) {
  // Component implementation
}
```

### Responsive Design
- Mobile-first approach
- Test across different screen sizes
- Use Tailwind responsive utilities

## 🧪 Testing Strategy

### Unit Testing
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

### Integration Testing
- Test API endpoints
- Test database operations
- Test authentication flows

### E2E Testing
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=prod_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
NEXTAUTH_URL=https://georgiaused.com
NEXTAUTH_SECRET=secure_production_secret
```

### Build Process
```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Static assets optimized
- [ ] Performance tested
- [ ] Security headers configured
- [ ] Monitoring setup

## 📊 Performance Optimization

### Frontend Optimization
- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Caching strategies for API calls
- Bundle size monitoring

### Database Optimization
- Query optimization with proper indexes
- Connection pooling
- Read replicas for heavy read operations
- Query caching

### Monitoring
- Performance metrics tracking
- Error logging and alerting
- User experience monitoring
- Database performance monitoring

## 🔒 Security Best Practices

### Frontend Security
- Input validation with Zod schemas
- XSS prevention
- CSRF protection
- Secure authentication handling

### Backend Security
- Row Level Security policies
- API rate limiting
- Input sanitization
- Audit logging

### Data Protection
- Encryption at rest and in transit
- PII data handling
- Backup and recovery procedures
- GDPR compliance measures

## 🐛 Debugging

### Common Issues
1. **Supabase Connection Issues**
   - Check environment variables
   - Verify project URL and keys
   - Check network connectivity

2. **Authentication Problems**
   - Verify RLS policies
   - Check user roles and permissions
   - Debug auth context state

3. **Performance Issues**
   - Analyze database queries
   - Check for unnecessary re-renders
   - Monitor bundle size

### Debug Tools
- Next.js DevTools
- React Developer Tools
- Supabase Dashboard
- Network tab analysis

## 📝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run quality checks
4. Submit pull request
5. Code review and approval
6. Merge to main

### Code Standards
- Follow TypeScript best practices
- Use consistent naming conventions
- Write self-documenting code
- Include proper error handling
- Add comments for complex logic

### Commit Guidelines
```bash
# Conventional commit format
feat: add vehicle status tracking
fix: resolve authentication redirect issue
docs: update API documentation
style: format code with prettier
refactor: optimize database queries
test: add unit tests for vehicle service
```

## 📞 Support

For development questions or issues:
- Check existing documentation
- Search through project issues
- Contact the development team
- Use debugging tools and logs

---

**Happy coding!** 🚗💻