import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Users, 
  MessageSquare, 
  Settings,
  BarChart3,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineMode } from '../../hooks/useOfflineMode';

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  children?: NavigationItem[];
}

const ResponsiveNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isOnline, queueSize } = useOfflineMode();

  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard',
    },
    {
      key: 'appointments',
      label: 'Turnos',
      icon: <Calendar className="w-5 h-5" />,
      path: '/appointments',
      badge: 3, // Example badge
    },
    {
      key: 'patients',
      label: 'Pacientes',
      icon: <Users className="w-5 h-5" />,
      path: '/patients',
    },
    {
      key: 'notifications',
      label: 'Notificaciones',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/notifications',
      badge: queueSize > 0 ? queueSize : undefined,
    },
    {
      key: 'admin',
      label: 'Administración',
      icon: <Settings className="w-5 h-5" />,
      path: '/admin',
      children: [
        {
          key: 'professionals',
          label: 'Profesionales',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/professionals',
        },
        {
          key: 'reports',
          label: 'Reportes',
          icon: <BarChart3 className="w-4 h-4" />,
          path: '/admin/reports',
        },
        {
          key: 'settings',
          label: 'Configuración',
          icon: <Settings className="w-4 h-4" />,
          path: '/admin/settings',
        },
      ],
    },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
      if (!target.closest('.user-menu') && !target.closest('.user-menu-button')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = isActiveRoute(item.path);
    const isExpanded = expandedItems.includes(item.key);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.key}>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${level > 0 ? 'ml-4' : ''}`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="danger" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
          ) : (
            <Link
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${level > 0 ? 'ml-4' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="danger" size="sm">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Clínica Dental</h1>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-3 py-4 space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>

          {/* Connection Status */}
          <div className="px-3 py-2 border-t border-gray-200">
            <div className={`flex items-center space-x-2 text-xs ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
              {queueSize > 0 && (
                <Badge variant="warning" size="sm">
                  {queueSize} pendientes
                </Badge>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Clínica Dental</h1>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`flex items-center space-x-1 ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {queueSize > 0 && (
                <Badge variant="warning" size="sm">
                  {queueSize}
                </Badge>
              )}
            </div>

            {/* User Menu Button */}
            <div className="relative user-menu">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="user-menu-button flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4" />
                      <span>Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" />
            <div className="mobile-menu fixed top-16 inset-x-0 bottom-0 bg-white overflow-y-auto">
              <div className="px-4 py-4 space-y-1">
                {navigationItems.map(item => renderNavigationItem(item))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4 gap-1">
          {navigationItems.slice(0, 4).map(item => (
            <Link
              key={item.key}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors ${
                isActiveRoute(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: 'w-5 h-5'
                })}
                {item.badge && (
                  <Badge 
                    variant="danger" 
                    size="sm" 
                    className="absolute -top-2 -right-2 min-w-[16px] h-4 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default ResponsiveNavigation;