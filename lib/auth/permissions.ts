import type { UserRole, Permission } from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function canAccessAdminPanel(userRole: UserRole): boolean {
  // All roles except viewer can access admin panel with different permissions
  return userRole !== 'viewer'
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, 'manage_users')
}

export function canViewFinances(userRole: UserRole): boolean {
  return hasPermission(userRole, 'view_finances')
}

export function canManageVehicles(userRole: UserRole): boolean {
  return hasPermission(userRole, 'manage_vehicles')
}

export function canCreateInvoices(userRole: UserRole): boolean {
  return hasPermission(userRole, 'create_invoices')
}

export function canExportData(userRole: UserRole): boolean {
  return hasPermission(userRole, 'export_data')
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    manager: 'Manager',
    inventory_manager: 'Inventory Manager',
    finance_manager: 'Finance Manager',
    sales_agent: 'Sales Agent',
    viewer: 'Viewer'
  }
  
  return roleNames[role]
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    super_admin: 'Full system access with user management capabilities',
    manager: 'Business oversight with read access to all data',
    inventory_manager: 'Vehicle management and inventory operations',
    finance_manager: 'Financial operations and invoice management',
    sales_agent: 'Customer management and sales operations',
    viewer: 'Read-only access to basic information'
  }
  
  return descriptions[role]
}