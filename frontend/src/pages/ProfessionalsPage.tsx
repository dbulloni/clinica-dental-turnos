import React from 'react';
import { UserCheck, Plus, Settings, Calendar } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { useAuth } from '../contexts/AuthContext';

const ProfessionalsPage: React.FC = () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profesionales</h1>
          <p className="text-gray-600">
            Gestiona los profesionales y sus horarios de trabajo
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Nuevo Profesional
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover className="cursor-pointer">
          <Card.Body className="text-center">
            <UserCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Gestionar Profesionales</h3>
            <p className="text-sm text-gray-600">Agregar, editar o desactivar profesionales</p>
          </Card.Body>
        </Card>
        
        <Card hover className="cursor-pointer">
          <Card.Body className="text-center">
            <Settings className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Horarios de Trabajo</h3>
            <p className="text-sm text-gray-600">Configurar horarios y disponibilidad</p>
          </Card.Body>
        </Card>
        
        <Card hover className="cursor-pointer">
          <Card.Body className="text-center">
            <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Bloqueos de Horario</h3>
            <p className="text-sm text-gray-600">Gestionar vacaciones y ausencias</p>
          </Card.Body>
        </Card>
      </div>

      {/* Content */}
      <Card>
        <Card.Body>
          <EmptyState
            icon={UserCheck}
            title="No hay profesionales registrados"
            description="Comienza agregando profesionales para poder asignar turnos."
            action={{
              label: "Agregar Profesional",
              onClick: () => console.log("Agregar profesional"),
            }}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfessionalsPage;