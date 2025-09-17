import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import Button from '../UI/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-2 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="ml-4 lg:ml-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2 relative"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </Button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Secretaria'}
              </p>
            </div>
          </Button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <button
                onClick={() => setShowUserMenu(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                Mi Perfil
              </button>
              
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </button>
              )}
              
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Helper function to get page title based on current route
const getPageTitle = (): string => {
  const path = window.location.pathname;
  
  if (path.startsWith('/dashboard')) return 'Dashboard';
  if (path.startsWith('/patients')) return 'Pacientes';
  if (path.startsWith('/appointments')) return 'Turnos';
  if (path.startsWith('/professionals')) return 'Profesionales';
  if (path.startsWith('/treatment-types')) return 'Tipos de Tratamiento';
  if (path.startsWith('/notifications')) return 'Notificaciones';
  if (path.startsWith('/settings')) return 'Configuración';
  
  return 'Sistema de Turnos';
};

export default Header;