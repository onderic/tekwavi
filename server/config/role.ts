export enum UserRole {
  SUPERADMIN = 'admin',
  ADMIN = 'developer',
  CARETAKER = 'caretaker',
  TENANT = 'tenant',
}

export const ROLE_HIERARCHY = {
  [UserRole.SUPERADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.CARETAKER]: 2,
  [UserRole.TENANT]: 1,
}

// Helper to check if a role has higher or equal privilege than another
export function hasHigherOrEqualPrivilege(userRole: UserRole, requiredRole: UserRole): boolean {
  const userPrivilege = ROLE_HIERARCHY[userRole] || 0
  const requiredPrivilege = ROLE_HIERARCHY[requiredRole] || 0
  return userPrivilege >= requiredPrivilege
}
