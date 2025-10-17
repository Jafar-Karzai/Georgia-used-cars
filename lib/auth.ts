// Simple auth utility for API endpoints
// In a real implementation, this would integrate with your auth provider

export interface User {
  id: string
  email: string
  role: 'super_admin' | 'manager' | 'inventory_manager' | 'finance_manager' | 'sales_agent' | 'viewer'
}

export async function getCurrentUser(): Promise<User | null> {
  // Mock implementation for testing
  // In real app, this would:
  // 1. Extract JWT from Authorization header or cookies
  // 2. Validate the token
  // 3. Return user data from database
  
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'manager'
  }
}

export function hasPermission(role: User['role'], resource: string, action: string): boolean {
  // Define comprehensive role-based permissions matrix
  const permissions = {
    'super_admin': {
      'vehicles': ['create', 'read', 'update', 'delete'],
      'customers': ['create', 'read', 'update', 'delete'],
      'invoices': ['create', 'read', 'update', 'delete'],
      'settings': ['read', 'update'],
      'users': ['create', 'read', 'update', 'delete'],
      'system': ['admin'],
      'backups': ['create', 'read'],
      'logs': ['read']
    },
    'manager': {
      'vehicles': ['create', 'read', 'update', 'delete'],
      'customers': ['create', 'read', 'update', 'delete'],
      'invoices': ['create', 'read', 'update', 'delete'],
      'settings': ['read', 'update']
    },
    'inventory_manager': {
      'vehicles': ['create', 'read', 'update', 'delete'],
      'customers': ['read', 'update'],
      'settings': ['read']
    },
    'finance_manager': {
      'vehicles': ['read', 'update'],
      'customers': ['read', 'update'],
      'invoices': ['create', 'read', 'update', 'delete'],
      'settings': ['read']
    },
    'sales_agent': {
      'vehicles': ['read', 'update'],
      'customers': ['create', 'read', 'update'],
      'invoices': ['read'],
      'settings': ['read']
    },
    'viewer': {
      'vehicles': ['read'],
      'customers': ['read'],
      'invoices': ['read'],
      'settings': ['read']
    }
  }

  const rolePermissions = permissions[role]
  if (!rolePermissions) return false

  const resourcePermissions = rolePermissions[resource]
  if (!resourcePermissions) return false

  return resourcePermissions.includes(action)
}