import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  Stethoscope,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Pacientes',
    href: '/patients',
    icon: Users,
  },
  {
    name: 'Turnos',
    href: '/appointments',
    icon: Calendar,
  },
  {
    name: 'Profesionales',
    href: '/professionals',
    icon: UserCheck,
    adminOnly: true,
  },
  {
    name: 'Tratamientos',
    href: '/treatment-types',
    icon: Stethoscope,
    adminOnly: true,
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    adminOnly: true,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                Sistema Turnos
              </h1>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'sidebar-link group',
                    isActive 
                      ? 'sidebar-link-active' 
                      : 'sidebar-link-inactive'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      'flex-shrink-0 w-5 h-5',
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  
                  {!collapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'ADMIN' ? 'Administrador' : 'Secretaria'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;