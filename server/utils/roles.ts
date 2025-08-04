import { UserRole } from '~~/shared/enums/roles'

type Action = 'create' | 'read' | 'update' | 'delete'
type Role = UserRole

// Define resource groups for better organization
interface ResourceGroup {
  name: string
  resources: string[]
}

// Define all resource groups
const resourceGroups: Record<string, ResourceGroup> = {
  userManagement: {
    name: 'User Management',
    resources: ['user', 'role', 'profile', 'account', 'permission', 'own_profile'],
  },
  propertyManagement: {
    name: 'Property Management',
    resources: [
      'property',
      'property_info',
      'floor',
      'unit',
      'unit_general',
      'unit_financial',
      'occupation',
      'tenant_assignment',
    ],
  },
  tenantManagement: {
    name: 'Tenant Management',
    resources: [
      'tenant',
      'tenant_details',
      'tenant_lease',
      'tenant_billing',
      'tenant_history',
      'tenant_documents',
      'lease_agreement',
      'tenant_notes',
    ],
  },
  financialManagement: {
    name: 'Financial Management',
    resources: [
      'payment',
      'invoice',
      'invoice_create',
      'invoice_view',
      'invoice_update',
      'invoice_void',
      'invoice_refund',
      'transaction',
      'rent',
      'deposit',
    ],
  },
  maintenanceManagement: {
    name: 'Maintenance Management',
    resources: ['maintenance', 'repair', 'inspection', 'request', 'schedule'],
  },
  NotificationManagement: {
    name: 'Notification Management',
    resources: ['notification', 'alert', 'reminder'],
  },
  ExpenseManagement: {
    name: 'Expense Management',
    resources: [
      'expense',
      'expense_create',
      'expense_view',
      'expense_update',
      'expense_delete',
      'expense_category',
      'expense_report',
    ],
  },
}

// Flat list of all resources for validation
const allResources = Object.values(resourceGroups)
  .flatMap(group => group.resources)

// Define role hierarchy for inheritance
const roleHierarchy: Partial<Record<Role, Role>> = {
  [UserRole.DEVELOPER]: undefined,
  [UserRole.UNIT_OWNER]: undefined,
  [UserRole.CARETAKER]: undefined,
  [UserRole.TENANT]: undefined,
}

// Role-specific permissions with wildcards support
const rolePermissions: Record<Role, Record<Action, (string | '*' | RegExp)[]>> = {
  [UserRole.ADMIN]: {
    create: ['*'],
    read: ['*'],
    update: ['*'],
    delete: ['*'],
  },
  [UserRole.DEVELOPER]: {
    create: [
      'propertyManagement:*',
      'tenantManagement:*',
      'financialManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'expenseManagement:*',
      'userManagement:user',
      'userManagement:role',
    ],
    read: [
      'userManagement:own_profile',
      'userManagement:user',
      'userManagement:role',
      'propertyManagement:*',
      'tenantManagement:*',
      'financialManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'expenseManagement:*',
    ],
    update: [
      'userManagement:own_profile',
      'userManagement:user',
      'userManagement:role',
      'propertyManagement:*',
      'tenantManagement:*',
      'financialManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'expenseManagement:*',
    ],
    delete: [
      'propertyManagement:*',
      'tenantManagement:*',
      'financialManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'expenseManagement:*',
      'userManagement:user',
    ],
  },
  [UserRole.UNIT_OWNER]: {
    create: [
      'propertyManagement:property',
      'propertyManagement:unit',
      'propertyManagement:floor',
      'tenantManagement:tenant',
      'financialManagement:invoice_create',
      'maintenanceManagement:request',
      'expenseManagement:expense_create',
    ],
    read: [
      'userManagement:own_profile',
      'propertyManagement:*',
      'tenantManagement:*',
      'financialManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'expenseManagement:*',
    ],
    update: [
      'userManagement:own_profile',
      'propertyManagement:*',
      'tenantManagement:tenant',
      'tenantManagement:tenant_details',
      'tenantManagement:tenant_lease',
      'financialManagement:invoice_update',
      'maintenanceManagement:request',
      'maintenanceManagement:schedule',
      'expenseManagement:expense_update',
    ],
    delete: [
      'propertyManagement:unit',
      'tenantManagement:tenant',
      'financialManagement:invoice_void',
      'financialManagement:invoice_refund',
      'expenseManagement:expense_delete',
    ],
  },
  [UserRole.CARETAKER]: {
    create: [
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'tenantManagement:tenant',
      'tenantManagement:tenant_notes',
      'financialManagement:invoice_create',
      'expenseManagement:expense_create',
      'financialManagement:payment',
    ],
    read: [
      'userManagement:own_profile',
      'propertyManagement:*',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'tenantManagement:*',
      'financialManagement:payment',
      'financialManagement:invoice',
      'financialManagement:invoice_view',
      'financialManagement:rent',
    ],
    update: [
      'userManagement:own_profile',
      'maintenanceManagement:*',
      'NotificationManagement:*',
      'propertyManagement:unit_general',
      'propertyManagement:occupation',
      'propertyManagement:floor',
      'propertyManagement:unit',
      'tenantManagement:tenant',
      'tenantManagement:tenant_notes',
      'tenantManagement:tenant_details',
      'financialManagement:invoice_update',
    ],
    delete: [],
  },
  [UserRole.TENANT]: {
    create: [
      'maintenanceManagement:request',
      'NotificationManagement:notification',
      'financialManagement:invoice_create',
    ],
    read: [
      'userManagement:own_profile',
      'userManagement:profile',
      'propertyManagement:property',
      'propertyManagement:unit',
      'financialManagement:payment',
      'financialManagement:invoice_view',
      'NotificationManagement:notification',
      'tenantManagement:tenant_details',
      'tenantManagement:tenant_lease',
      'tenantManagement:tenant_billing',
    ],
    update: [
      'userManagement:own_profile',
      'userManagement:profile',
      'NotificationManagement:notification',
      'NotificationManagement:alert',
      'NotificationManagement:reminder',
    ],
    delete: [],
  },
  [UserRole.NORMAL]: {
    create: [],
    read: [],
    update: [],
    delete: [],
  },
}

/**
 * Checks if a role can perform an action on a resource
 * Supports direct permissions, wildcards, regex patterns, and role inheritance
 */
export function canPerform(role: Role, action: Action, resource: string): boolean {
  // First check direct permissions
  if (checkDirectPermission(role, action, resource)) {
    return true
  }

  // Then try inherited permissions
  const parentRole = roleHierarchy[role]
  if (parentRole) {
    return canPerform(parentRole, action, resource)
  }

  return false
}

/**
 * Helper to check direct permissions without inheritance
 */
function checkDirectPermission(role: Role, action: Action, resource: string): boolean {
  const permissions = rolePermissions[role]?.[action]
  if (!permissions) return false

  // Format resource to check against pattern matching
  let resourceToCheck = resource

  // Support for group:resource pattern
  if (!resource.includes(':')) {
    // Try to find which group this resource belongs to
    for (const [groupKey, group] of Object.entries(resourceGroups)) {
      if (group.resources.includes(resource)) {
        resourceToCheck = `${groupKey}:${resource}`
        break
      }
    }
  }

  // Check against patterns
  return permissions.some((pattern) => {
    // Wildcard match
    if (pattern === '*') return true

    // Direct string match
    if (typeof pattern === 'string') {
      // Exact match
      if (pattern === resourceToCheck) return true

      // Group wildcard (e.g., "propertyManagement:*")
      if (pattern.endsWith(':*')) {
        const groupPrefix = pattern.split(':')[0]
        return resourceToCheck.startsWith(`${groupPrefix}:`)
      }
    }

    // Regex match
    if (pattern instanceof RegExp) {
      return pattern.test(resourceToCheck)
    }

    return false
  })
}

/**
 * Helper to validate if a resource exists in our system
 */
export function isValidResource(resource: string): boolean {
  if (resource.includes(':')) {
    const [group, res] = resource.split(':')
    return !!resourceGroups[group]?.resources.includes(res)
  }
  return allResources.includes(resource)
}

/**
 * Get all resources a role can perform a specific action on
 */
export function getAccessibleResources(role: Role, action: Action): string[] {
  const accessible: string[] = []

  // Get resources from current role and all parent roles
  const rolesToCheck: Role[] = [role]
  let currentRole: Role | null = role

  while (currentRole) {
    const parentRole: Role | undefined = roleHierarchy[currentRole]
    if (parentRole) {
      rolesToCheck.push(parentRole)
      currentRole = parentRole
    }
    else {
      currentRole = null
    }
  }

  // Check permissions from all applicable roles
  for (const roleToCheck of rolesToCheck) {
    const permissions = rolePermissions[roleToCheck]?.[action]
    if (!permissions) continue

    // Process each permission pattern
    for (const pattern of permissions) {
      if (pattern === '*') {
        // Add all resources
        accessible.push(...allResources)
        break
      }
      else if (typeof pattern === 'string' && pattern.endsWith(':*')) {
        // Add all resources from a group
        const groupName = pattern.split(':')[0]
        const group = resourceGroups[groupName]
        if (group) {
          accessible.push(...group.resources)
        }
      }
      else if (typeof pattern === 'string') {
        // Add specific resource
        if (pattern.includes(':')) {
          const [_, res] = pattern.split(':')
          accessible.push(res)
        }
        else {
          accessible.push(pattern)
        }
      }
      // Skip regex patterns for listing resources
    }
  }

  // Remove duplicates
  return [...new Set(accessible)]
}
