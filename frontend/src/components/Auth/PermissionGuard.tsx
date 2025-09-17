import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: User['role'];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
  showFallback = true,
}) => {
  const { user } = useAuth();

  // Check if user is authenticated
  if (!user) {
    return showFallback ? (
      fallback || (
        <div className="text-center py-8">
          <p className="text-gray-600">Debes iniciar sesión para ver este contenido.</p>
        </div>
      )
    ) : null;
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return showFallback ? (
      fallback || (
        <div className="text-center py-8">
          <p className="text-gray-600">No tienes permisos para ver este contenido.</p>
        </div>
      )
    ) : null;
  }

  // Check specific permissions (for future use)
  if (requiredPermissions.length > 0) {
    // This would be implemented when we have a more granular permission system
    // For now, we'll just check if user is admin for any specific permissions
    const hasPermissions = user.role === 'ADMIN';
    
    if (!hasPermissions) {
      return showFallback ? (
        fallback || (
          <div className="text-center py-8">
            <p className="text-gray-600">No tienes los permisos necesarios.</p>
          </div>
        )
      ) : null;
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;