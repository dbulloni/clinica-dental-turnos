import React, { useState } from 'react';
import { Bug, X, User, Database, Wifi } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';

const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const systemInfo = {
    environment: process.env.NODE_ENV,
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    version: '1.0.0',
    buildTime: new Date().toISOString(),
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Abrir herramientas de desarrollo"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="shadow-xl border-gray-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Dev Tools</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* User Info */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Usuario</span>
            </div>
            {user ? (
              <div className="text-xs space-y-1">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Rol:</strong> <Badge variant="primary" size="sm">{user.role}</Badge></p>
                <p><strong>Activo:</strong> {user.isActive ? '✅' : '❌'}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No autenticado</p>
            )}
          </div>

          {/* System Info */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Sistema</span>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>Entorno:</strong> <Badge variant="info" size="sm">{systemInfo.environment}</Badge></p>
              <p><strong>API URL:</strong> {systemInfo.apiUrl}</p>
              <p><strong>Versión:</strong> {systemInfo.version}</p>
            </div>
          </div>

          {/* Connection Status */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Wifi className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Conexión</span>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>Estado:</strong> <Badge variant="success" size="sm">Conectado</Badge></p>
              <p><strong>Token:</strong> {localStorage.getItem('accessToken') ? '✅ Presente' : '❌ Ausente'}</p>
            </div>
          </div>

          {/* Local Storage */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Local Storage</span>
            </div>
            <div className="text-xs space-y-1">
              {Object.keys(localStorage).filter(key => 
                key.startsWith('access') || key.startsWith('refresh') || key.startsWith('user')
              ).map(key => (
                <p key={key}>
                  <strong>{key}:</strong> {localStorage.getItem(key) ? '✅' : '❌'}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Limpiar Storage
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => {
                console.log('User:', user);
                console.log('System Info:', systemInfo);
                console.log('Local Storage:', localStorage);
              }}
            >
              Log Info
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DevTools;