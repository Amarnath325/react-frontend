import React from 'react';
import { usePermission } from '../utils/permissionHelpers';

interface CanProps {
  perform: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has the required permission.
 * 
 * Example:
 * <Can perform="collect_fees" fallback={<p>Not authorized</p>}>
 *   <button>Collect Fee</button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({ perform, fallback = null, children }) => {
  const isAllowed = usePermission(perform);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
