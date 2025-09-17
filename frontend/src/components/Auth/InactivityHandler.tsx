import React, { useEffect } from 'react';
import { useInactivityTimer } from '../../hooks/useInactivityTimer';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const InactivityHandler: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();

  useInactivityTimer({
    timeout: 30 * 60 * 1000, // 30 minutes
    enabled: isAuthenticated,
    onTimeout: () => {
      toast.error('Tu sesión ha expirado por inactividad');
      logout();
    },
  });

  return null; // This component doesn't render anything
};

export default InactivityHandler;