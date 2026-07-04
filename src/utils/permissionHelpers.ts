import { useAuth } from '../context/AuthContext';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string | number;
  school_id: number | null;
  permissions?: string[];
  roles?: string[];
}

/**
 * Checks if a user has a specific permission.
 * Includes bypass logic for school admin and super admin.
 */
export const checkUserPermission = (user: User | null, permissionName: string): boolean => {
  if (!user) return false;

  // Let's check if the user is a super admin or school admin
  // Super Admin: usually user_type alias "super_admin" or numeric ID 1
  // School Admin: usually user_type alias "school_admin" or numeric ID 2
  const isAdmin = 
    user.user_type === 'super_admin' || 
    user.user_type === 'school_admin' ||
    user.user_type === 1 || 
    user.user_type === 2 || 
    (user.roles && (user.roles.includes('super_admin') || user.roles.includes('school_admin')));

  if (isAdmin) {
    return true;
  }

  // Check if permission is in permissions list
  if (user.permissions && user.permissions.includes(permissionName)) {
    return true;
  }

  return false;
};

/**
 * Custom hook to check permission in React functional components.
 */
export const usePermission = (permissionName: string): boolean => {
  const { user } = useAuth();
  return checkUserPermission(user as any, permissionName);
};

/**
 * Custom hook to check if user has any of the specified permissions.
 */
export const useAnyPermission = (permissionNames: string[]): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  return permissionNames.some(pName => checkUserPermission(user as any, pName));
};
