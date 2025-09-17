import React from 'react';
import { Stethoscope, Plus, Clock } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { useAuth } from '../contexts/AuthContext';

const TreatmentTypesPage: React.FC = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Tratamiento</h1>
          <p className="text-gray-600">
            Gestiona los tipos de tratamiento y sus duraciones
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Nuevo Tratamiento
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Tratamientos Activos</h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Duración Promedio</h3>
                <p className="text-2xl font-bold text-green-600">-- min</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Content */}
      <Card>
        <Card.Body>
          <EmptyState
            icon={Stethoscope}
            title="No hay tipos de tratamiento configurados"
            description="Define los tipos de tratamiento disponibles y sus duraciones para organizar mejor los turnos."
            action={{
              label: "Crear Tipo de Tratamiento",
              onClick: () => console.log("Crear tratamiento"),
            }}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default TreatmentTypesPage;