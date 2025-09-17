import React, { useState } from 'react';
import { 
  Activity,
  Stethoscope,
  Palette,
  BarChart3,
  Settings,
  Users,
  Shield,
  FileText,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Dashboard from './Dashboard';
import ProfessionalManagement from './ProfessionalManagement';
import TreatmentTypeManagement from './TreatmentTypeManagement';
import ReportsAndAnalytics from './ReportsAndAnalytics';
import SystemConfiguration from './SystemConfiguration';

type AdminView = 'dashboard' | 'professionals' | 'treatments' | 'reports' | 'settings' | 'users';

interface AdminMenuItem {
  key: AdminView;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const AdminPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenuItems: AdminMenuItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <Activity className="w-5 h-5" />,
      description: 'Resumen general y estadísticas',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      key: 'professionals',
      label: 'Profesionales',
      icon: <Stethoscope className="w-5 h-5" />,
      description: 'Gestión de médicos y especialistas',
      color: 'text-green-600 bg-green-100'
    },
    {
      key: 'treatments',
      label: 'Tratamientos',
      icon: <Palette className="w-5 h-5" />,
      description: 'Tipos de tratamientos y servicios',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      key: 'reports',
      label: 'Reportes',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Análisis y reportes detallados',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      key: 'users',
      label: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
      description: 'Gestión de usuarios del sistema',
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: <Settings className="w-5 h-5" />,
      description: 'Configuración del sistema',
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  const getCurrentMenuItem = () => {
    return adminMenuItems.find(item => item.key === activeView);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'professionals':
        return <ProfessionalManagement />;
      case 'treatments':
        return <TreatmentTypeManagement />;
      case 'reports':
        return <ReportsAndAnalytics />;
      case 'settings':
        return <SystemConfiguration />;
      case 'users':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Usuarios</h3>
              <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Administración</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-2">
          {adminMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveView(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors ${
                activeView === item.key
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                activeView === item.key ? item.color : 'text-gray-400 bg-gray-100'
              }`}>
                {item.icon}
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Quick Stats in Sidebar */}
      <div className="mt-8 px-3">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Sistema</div>
              <div className="text-lg font-semibold">Activo</div>
            </div>
            <Shield className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-3 text-xs opacity-90">
            Última actualización: Hoy
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCurrentMenuItem()?.color}`}>
                  {getCurrentMenuItem()?.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {getCurrentMenuItem()?.label}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {getCurrentMenuItem()?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {activeView !== 'dashboard' && (
                <Button
                  variant="ghost"
                  onClick={() => setActiveView('dashboard')}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Volver al Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;