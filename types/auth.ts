import { UserRole as DatabaseUserRole } from './database'

// Re-export UserRole from database for convenience
export type UserRole = DatabaseUserRole

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

export type Permission = 
  | 'view_dashboard'
  | 'manage_vehicles'
  | 'view_vehicles'
  | 'create_vehicles'
  | 'edit_vehicles'
  | 'delete_vehicles'
  | 'manage_finances'
  | 'view_finances'
  | 'create_invoices'
  | 'manage_customers'
  | 'view_customers'
  | 'manage_inquiries'
  | 'view_inquiries'
  | 'view_reports'
  | 'export_data'
  | 'manage_users'
  | 'manage_settings'
  | 'system_admin'

// Export ROLE_PERMISSIONS for use in auth utilities
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_vehicles',
    'view_vehicles',
    'create_vehicles',
    'edit_vehicles',
    'delete_vehicles',
    'manage_finances',
    'view_finances',
    'create_invoices',
    'manage_customers',
    'view_customers',
    'manage_inquiries',
    'view_inquiries',
    'view_reports',
    'export_data',
    'manage_users',
    'manage_settings',
    'system_admin'
  ],
  manager: [
    'view_dashboard',
    'view_vehicles',
    'view_finances',
    'view_customers',
    'view_reports',
    'export_data',
    'manage_inquiries',
    'view_inquiries'
  ],
  inventory_manager: [
    'view_dashboard',
    'manage_vehicles',
    'view_vehicles',
    'create_vehicles',
    'edit_vehicles',
    'view_finances'
  ],
  finance_manager: [
    'view_dashboard',
    'manage_finances',
    'view_finances',
    'create_invoices',
    'view_vehicles',
    'view_customers',
    'view_reports',
    'export_data'
  ],
  sales_agent: [
    'view_dashboard',
    'view_vehicles',
    'manage_customers',
    'view_customers',
    'manage_inquiries',
    'view_inquiries',
    'create_invoices'
  ],
  viewer: [
    'view_dashboard',
    'view_vehicles',
    'view_customers'
  ]
}