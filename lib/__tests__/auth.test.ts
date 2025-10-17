import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCurrentUser, hasPermission, type User } from '../auth'

describe('Authentication and Authorization', () => {
  describe('getCurrentUser', () => {
    it('should return user for valid session', async () => {
      const user = await getCurrentUser()
      
      expect(user).toBeDefined()
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('role')
    })

    it('should return user with valid role', async () => {
      const user = await getCurrentUser()
      
      const validRoles = ['super_admin', 'manager', 'inventory_manager', 'finance_manager', 'sales_agent', 'viewer']
      expect(validRoles).toContain(user?.role)
    })

    it('should return consistent user data', async () => {
      const user1 = await getCurrentUser()
      const user2 = await getCurrentUser()
      
      expect(user1).toEqual(user2)
    })
  })

  describe('hasPermission', () => {
    const createUser = (role: User['role']): User => ({
      id: 'test-user',
      email: 'test@example.com',
      role
    })

    describe('super_admin role', () => {
      const user = createUser('super_admin')

      it('should have all permissions', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'create')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'read')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'settings', 'read')).toBe(true)
        expect(hasPermission(user.role, 'settings', 'update')).toBe(true)
        expect(hasPermission(user.role, 'users', 'create')).toBe(true)
        expect(hasPermission(user.role, 'users', 'update')).toBe(true)
        expect(hasPermission(user.role, 'users', 'delete')).toBe(true)
      })

      it('should have admin-specific permissions', () => {
        expect(hasPermission(user.role, 'system', 'admin')).toBe(true)
        expect(hasPermission(user.role, 'backups', 'create')).toBe(true)
        expect(hasPermission(user.role, 'logs', 'read')).toBe(true)
      })
    })

    describe('manager role', () => {
      const user = createUser('manager')

      it('should have most permissions except admin functions', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'create')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'read')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'settings', 'read')).toBe(true)
        expect(hasPermission(user.role, 'settings', 'update')).toBe(true)
      })

      it('should not have admin-specific permissions', () => {
        expect(hasPermission(user.role, 'system', 'admin')).toBe(false)
        expect(hasPermission(user.role, 'backups', 'create')).toBe(false)
        expect(hasPermission(user.role, 'users', 'create')).toBe(false)
        expect(hasPermission(user.role, 'users', 'update')).toBe(false)
        expect(hasPermission(user.role, 'users', 'delete')).toBe(false)
      })
    })

    describe('inventory_manager role', () => {
      const user = createUser('inventory_manager')

      it('should have vehicle-focused permissions', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(true)
      })

      it('should not have financial permissions', () => {
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(false)
      })

      it('should not have admin permissions', () => {
        expect(hasPermission(user.role, 'settings', 'update')).toBe(false)
        expect(hasPermission(user.role, 'users', 'create')).toBe(false)
        expect(hasPermission(user.role, 'system', 'admin')).toBe(false)
      })
    })

    describe('finance_manager role', () => {
      const user = createUser('finance_manager')

      it('should have financial permissions', () => {
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'read')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(true)
      })

      it('should not have inventory management permissions', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(false)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'create')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(false)
      })

      it('should not have admin permissions', () => {
        expect(hasPermission(user.role, 'settings', 'update')).toBe(false)
        expect(hasPermission(user.role, 'users', 'create')).toBe(false)
        expect(hasPermission(user.role, 'system', 'admin')).toBe(false)
      })
    })

    describe('sales_agent role', () => {
      const user = createUser('sales_agent')

      it('should have customer-focused permissions', () => {
        expect(hasPermission(user.role, 'customers', 'create')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'read')).toBe(true)
      })

      it('should not have creation/deletion permissions for vehicles and invoices', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(false)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(false)
      })

      it('should not have admin permissions', () => {
        expect(hasPermission(user.role, 'settings', 'update')).toBe(false)
        expect(hasPermission(user.role, 'users', 'create')).toBe(false)
        expect(hasPermission(user.role, 'system', 'admin')).toBe(false)
      })
    })

    describe('viewer role', () => {
      const user = createUser('viewer')

      it('should only have read permissions', () => {
        expect(hasPermission(user.role, 'vehicles', 'read')).toBe(true)
        expect(hasPermission(user.role, 'customers', 'read')).toBe(true)
        expect(hasPermission(user.role, 'invoices', 'read')).toBe(true)
        expect(hasPermission(user.role, 'settings', 'read')).toBe(true)
      })

      it('should not have any write permissions', () => {
        expect(hasPermission(user.role, 'vehicles', 'create')).toBe(false)
        expect(hasPermission(user.role, 'vehicles', 'update')).toBe(false)
        expect(hasPermission(user.role, 'vehicles', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'create')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'update')).toBe(false)
        expect(hasPermission(user.role, 'customers', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'create')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'update')).toBe(false)
        expect(hasPermission(user.role, 'invoices', 'delete')).toBe(false)
        expect(hasPermission(user.role, 'settings', 'update')).toBe(false)
      })

      it('should not have admin permissions', () => {
        expect(hasPermission(user.role, 'users', 'create')).toBe(false)
        expect(hasPermission(user.role, 'system', 'admin')).toBe(false)
        expect(hasPermission(user.role, 'backups', 'create')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle invalid role gracefully', () => {
        // @ts-expect-error - testing invalid role
        expect(hasPermission('invalid_role', 'vehicles', 'read')).toBe(false)
      })

      it('should handle invalid resource gracefully', () => {
        expect(hasPermission('manager', 'invalid_resource', 'read')).toBe(false)
      })

      it('should handle invalid action gracefully', () => {
        expect(hasPermission('manager', 'vehicles', 'invalid_action')).toBe(false)
      })

      it('should be case sensitive for roles', () => {
        // @ts-expect-error - testing case sensitivity
        expect(hasPermission('MANAGER', 'vehicles', 'read')).toBe(false)
        // @ts-expect-error - testing case sensitivity
        expect(hasPermission('Manager', 'vehicles', 'read')).toBe(false)
      })

      it('should be case sensitive for resources', () => {
        expect(hasPermission('manager', 'VEHICLES', 'read')).toBe(false)
        expect(hasPermission('manager', 'Vehicles', 'read')).toBe(false)
      })

      it('should be case sensitive for actions', () => {
        expect(hasPermission('manager', 'vehicles', 'READ')).toBe(false)
        expect(hasPermission('manager', 'vehicles', 'Read')).toBe(false)
      })
    })
  })

  describe('Permission inheritance and hierarchy', () => {
    it('should maintain proper role hierarchy for vehicles', () => {
      const roles: Array<{ role: User['role'], canDelete: boolean }> = [
        { role: 'super_admin', canDelete: true },
        { role: 'manager', canDelete: true },
        { role: 'inventory_manager', canDelete: true },
        { role: 'finance_manager', canDelete: false },
        { role: 'sales_agent', canDelete: false },
        { role: 'viewer', canDelete: false }
      ]

      roles.forEach(({ role, canDelete }) => {
        expect(hasPermission(role, 'vehicles', 'delete')).toBe(canDelete)
      })
    })

    it('should maintain proper role hierarchy for customers', () => {
      const roles: Array<{ role: User['role'], canCreate: boolean }> = [
        { role: 'super_admin', canCreate: true },
        { role: 'manager', canCreate: true },
        { role: 'inventory_manager', canCreate: false },
        { role: 'finance_manager', canCreate: false },
        { role: 'sales_agent', canCreate: true },
        { role: 'viewer', canCreate: false }
      ]

      roles.forEach(({ role, canCreate }) => {
        expect(hasPermission(role, 'customers', 'create')).toBe(canCreate)
      })
    })

    it('should maintain proper role hierarchy for invoices', () => {
      const roles: Array<{ role: User['role'], canUpdate: boolean }> = [
        { role: 'super_admin', canUpdate: true },
        { role: 'manager', canUpdate: true },
        { role: 'inventory_manager', canUpdate: false },
        { role: 'finance_manager', canUpdate: true },
        { role: 'sales_agent', canUpdate: false },
        { role: 'viewer', canUpdate: false }
      ]

      roles.forEach(({ role, canUpdate }) => {
        expect(hasPermission(role, 'invoices', 'update')).toBe(canUpdate)
      })
    })
  })

  describe('Resource-specific permissions', () => {
    it('should have correct permissions for user management', () => {
      expect(hasPermission('super_admin', 'users', 'create')).toBe(true)
      expect(hasPermission('super_admin', 'users', 'update')).toBe(true)
      expect(hasPermission('super_admin', 'users', 'delete')).toBe(true)
      
      expect(hasPermission('manager', 'users', 'create')).toBe(false)
      expect(hasPermission('inventory_manager', 'users', 'create')).toBe(false)
      expect(hasPermission('finance_manager', 'users', 'create')).toBe(false)
      expect(hasPermission('sales_agent', 'users', 'create')).toBe(false)
      expect(hasPermission('viewer', 'users', 'create')).toBe(false)
    })

    it('should have correct permissions for system administration', () => {
      expect(hasPermission('super_admin', 'system', 'admin')).toBe(true)
      expect(hasPermission('manager', 'system', 'admin')).toBe(false)
      expect(hasPermission('inventory_manager', 'system', 'admin')).toBe(false)
      expect(hasPermission('finance_manager', 'system', 'admin')).toBe(false)
      expect(hasPermission('sales_agent', 'system', 'admin')).toBe(false)
      expect(hasPermission('viewer', 'system', 'admin')).toBe(false)
    })

    it('should have correct permissions for settings management', () => {
      const rolesWithSettingsUpdate = ['super_admin', 'manager']
      const rolesWithoutSettingsUpdate = ['inventory_manager', 'finance_manager', 'sales_agent', 'viewer']

      rolesWithSettingsUpdate.forEach(role => {
        expect(hasPermission(role as User['role'], 'settings', 'update')).toBe(true)
      })

      rolesWithoutSettingsUpdate.forEach(role => {
        expect(hasPermission(role as User['role'], 'settings', 'update')).toBe(false)
      })

      // All roles should be able to read settings
      const allRoles: User['role'][] = ['super_admin', 'manager', 'inventory_manager', 'finance_manager', 'sales_agent', 'viewer']
      allRoles.forEach(role => {
        expect(hasPermission(role, 'settings', 'read')).toBe(true)
      })
    })
  })

  describe('Complex permission scenarios', () => {
    it('should handle multiple permission checks correctly', () => {
      const salesAgent: User['role'] = 'sales_agent'
      
      // Sales agent can work with customers but has limited vehicle access
      expect(hasPermission(salesAgent, 'customers', 'create')).toBe(true)
      expect(hasPermission(salesAgent, 'customers', 'read')).toBe(true)
      expect(hasPermission(salesAgent, 'customers', 'update')).toBe(true)
      expect(hasPermission(salesAgent, 'vehicles', 'read')).toBe(true)
      expect(hasPermission(salesAgent, 'vehicles', 'update')).toBe(true)
      
      // But cannot delete customers or create/delete vehicles
      expect(hasPermission(salesAgent, 'customers', 'delete')).toBe(false)
      expect(hasPermission(salesAgent, 'vehicles', 'create')).toBe(false)
      expect(hasPermission(salesAgent, 'vehicles', 'delete')).toBe(false)
    })

    it('should handle workflow-based permissions', () => {
      // Inventory manager workflow: can manage vehicles and read customers for context
      const inventoryManager: User['role'] = 'inventory_manager'
      expect(hasPermission(inventoryManager, 'vehicles', 'create')).toBe(true)
      expect(hasPermission(inventoryManager, 'vehicles', 'update')).toBe(true)
      expect(hasPermission(inventoryManager, 'vehicles', 'delete')).toBe(true)
      expect(hasPermission(inventoryManager, 'customers', 'read')).toBe(true)
      expect(hasPermission(inventoryManager, 'customers', 'update')).toBe(true)
      
      // But cannot handle financial aspects
      expect(hasPermission(inventoryManager, 'invoices', 'create')).toBe(false)
      expect(hasPermission(inventoryManager, 'customers', 'delete')).toBe(false)
    })

    it('should handle read-only access correctly', () => {
      const viewer: User['role'] = 'viewer'
      const resources = ['vehicles', 'customers', 'invoices', 'settings']
      const writeActions = ['create', 'update', 'delete']
      
      // Viewer can read everything
      resources.forEach(resource => {
        expect(hasPermission(viewer, resource, 'read')).toBe(true)
      })
      
      // But cannot perform any write operations
      resources.forEach(resource => {
        writeActions.forEach(action => {
          expect(hasPermission(viewer, resource, action)).toBe(false)
        })
      })
    })
  })

  describe('Performance and consistency', () => {
    it('should be performant for repeated permission checks', () => {
      const start = performance.now()
      
      // Perform many permission checks
      for (let i = 0; i < 1000; i++) {
        hasPermission('manager', 'vehicles', 'read')
        hasPermission('sales_agent', 'customers', 'create')
        hasPermission('viewer', 'invoices', 'delete')
        hasPermission('super_admin', 'system', 'admin')
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete 4000 permission checks in reasonable time
      expect(duration).toBeLessThan(100) // Less than 100ms
    })

    it('should return consistent results for the same input', () => {
      // Test consistency across multiple calls
      const testCases = [
        { role: 'manager' as const, resource: 'vehicles', action: 'create' },
        { role: 'sales_agent' as const, resource: 'customers', action: 'delete' },
        { role: 'viewer' as const, resource: 'invoices', action: 'read' },
        { role: 'super_admin' as const, resource: 'system', action: 'admin' }
      ]
      
      testCases.forEach(({ role, resource, action }) => {
        const results = Array.from({ length: 10 }, () => 
          hasPermission(role, resource, action)
        )
        
        // All results should be identical
        const firstResult = results[0]
        results.forEach(result => {
          expect(result).toBe(firstResult)
        })
      })
    })
  })
})