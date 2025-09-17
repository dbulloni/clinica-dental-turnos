import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import NotificationMonitor from './NotificationMonitor';
import MessageTemplates from './MessageTemplates';
import NotificationSettings from './NotificationSettings';
import { useNotificationStats } from '../../hooks/useNotifications';

type NotificationView = 'monitor' | 'templates' | 'settings';

const NotificationCenter: React.FC = () => {
  const [activeView, setActiveView] = useState<NotificationView>('monitor');
  const { stats, loading } = useNotificationStats();

  const navigationItems = [
    {
      key: 'monitor' as const,
      label: 'Monitor',
      icon: <Activity className="w-5 h-5" />,
      description: 'Seguimiento de notificaciones',
    },
    {
      key: 'templates' as const,
      label: 'Plantillas',
      icon: <FileText className="w-5 h-5" />,
      description: 'Gestión de plantillas',
    },
    {
      key: 'settings' as const,
      label: 'Configuración',
      icon: <Settings className="w-5 h-5" />,
      description: 'Configuración del sistema',
    },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'templates':
        return <MessageTemplates />;
      case 'settings':
        return <NotificationSettings />;
      default:
        return <NotificationMonitor />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestión completa del sistema de notificaciones WhatsApp y Email
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <Card.Body className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Hoy</p>
                  <p className="text-lg font-bold text-gray-900">{stats?.today || 0}</p>
                </div>
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Entregados</p>
                  <p className="text-lg font-bold text-green-600">{stats?.delivered || 0}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Fallidos</p>
                  <p className="text-lg font-bold text-red-600">{stats?.failed || 0}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pendientes</p>
                  <p className="text-lg font-bold text-yellow-600">{stats?.pending || 0}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === item.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* System Status Alert */}
      {stats?.systemStatus && stats.systemStatus !== 'healthy' && (
        <Card>
          <Card.Body>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Estado del Sistema de Notificaciones
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  {stats.systemStatus === 'degraded' && (
                    <p>
                      El sistema está funcionando con limitaciones. Algunas notificaciones pueden 
                      experimentar retrasos en la entrega.
                    </p>
                  )}
                  {stats.systemStatus === 'down' && (
                    <p>
                      El sistema de notificaciones no está disponible. Las notificaciones se 
                      enviarán automáticamente cuando el servicio se restablezca.
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <Button variant="secondary" size="sm">
                    Ver detalles del estado
                  </Button>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Recent Alerts */}
      {stats?.recentAlerts && stats.recentAlerts.length > 0 && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {stats.recentAlerts.slice(0, 3).map((alert: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                  </div>
                  <Badge 
                    variant={
                      alert.type === 'error' ? 'danger' :
                      alert.type === 'warning' ? 'warning' : 'primary'
                    }
                    size="sm"
                  >
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Main Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default NotificationCenter;