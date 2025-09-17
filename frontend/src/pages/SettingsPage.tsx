import React from 'react';
import { Settings, Building, Clock, MessageSquare, Users } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acceso Restringido
        </h2>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">
          Configura los parámetros generales del sistema
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Information */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Información de la Clínica
              </h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <Input
                label="Nombre de la Clínica"
                placeholder="Mi Clínica Dental"
                defaultValue=""
              />
              <Input
                label="Dirección"
                placeholder="Calle Principal 123"
                defaultValue=""
              />
              <Input
                label="Teléfono"
                placeholder="+54 11 1234-5678"
                defaultValue=""
              />
              <Input
                label="Email"
                type="email"
                placeholder="contacto@clinica.com"
                defaultValue=""
              />
            </div>
          </Card.Body>
          <Card.Footer>
            <Button variant="primary">
              Guardar Cambios
            </Button>
          </Card.Footer>
        </Card>

        {/* Working Hours */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Horarios Generales
              </h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hora de Apertura"
                  type="time"
                  defaultValue="08:00"
                />
                <Input
                  label="Hora de Cierre"
                  type="time"
                  defaultValue="18:00"
                />
              </div>
              <Input
                label="Duración de Turno (minutos)"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
              <Input
                label="Tiempo entre Turnos (minutos)"
                type="number"
                placeholder="5"
                defaultValue="5"
              />
            </div>
          </Card.Body>
          <Card.Footer>
            <Button variant="primary">
              Guardar Horarios
            </Button>
          </Card.Footer>
        </Card>

        {/* WhatsApp Configuration */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Configuración WhatsApp
              </h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <Input
                label="Token de API"
                type="password"
                placeholder="••••••••••••••••"
                helperText="Token de WhatsApp Business API"
              />
              <Input
                label="Número de Teléfono"
                placeholder="+54 11 1234-5678"
                helperText="Número desde el cual se enviarán los mensajes"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="whatsapp-enabled"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="whatsapp-enabled" className="text-sm text-gray-700">
                  Habilitar notificaciones WhatsApp
                </label>
              </div>
            </div>
          </Card.Body>
          <Card.Footer>
            <div className="flex space-x-3">
              <Button variant="secondary">
                Probar Conexión
              </Button>
              <Button variant="primary">
                Guardar Configuración
              </Button>
            </div>
          </Card.Footer>
        </Card>

        {/* User Management */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Gestión de Usuarios
              </h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Usuarios Activos</p>
                  <p className="text-sm text-gray-600">1 administrador, 0 secretarias</p>
                </div>
                <Button variant="secondary" size="sm">
                  Ver Todos
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-logout"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  defaultChecked
                />
                <label htmlFor="auto-logout" className="text-sm text-gray-700">
                  Cerrar sesión automáticamente después de 30 minutos de inactividad
                </label>
              </div>
            </div>
          </Card.Body>
          <Card.Footer>
            <Button variant="primary">
              Agregar Usuario
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;