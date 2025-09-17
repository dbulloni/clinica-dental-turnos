import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Plus
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import AppointmentConfirmationModal from './AppointmentConfirmationModal';
import AppointmentAdvancedFilters from './AppointmentAdvancedFilters';
import AppointmentNotifications from './AppointmentNotifications';
import QuickReschedule from './QuickReschedule';
import { 
  Appointment, 
  AppointmentFilters, 
  Professional, 
  TreatmentType 
} from '../../types';

// Mock data for demonstration
const mockProfessionals: Professional[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@clinica.com',
    phone: '123456789',
    license: 'LIC123',
    specialties: ['Odontología General', 'Endodoncia'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria@clinica.com',
    phone: '987654321',
    license: 'LIC456',
    specialties: ['Ortodoncia', 'Periodoncia'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockTreatmentTypes: TreatmentType[] = [
  {
    id: '1',
    name: 'Consulta General',
    description: 'Consulta odontológica general',
    duration: 30,
    price: 5000,
    color: '#3B82F6',
    isActive: true,
    professionalId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Limpieza Dental',
    description: 'Profilaxis y limpieza dental',
    duration: 45,
    price: 8000,
    color: '#10B981',
    isActive: true,
    professionalId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    name: 'Ortodoncia',
    description: 'Consulta de ortodoncia',
    duration: 60,
    price: 12000,
    color: '#F59E0B',
    isActive: true,
    professionalId: '2',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockAppointment: Appointment = {
  id: '1',
  startTime: '2024-12-20T09:00:00',
  endTime: '2024-12-20T09:30:00',
  status: 'SCHEDULED',
  notes: 'Primera consulta del paciente',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  patient: {
    id: '1',
    firstName: 'María',
    lastName: 'García',
    phone: '987654321',
    email: 'maria@test.com',
  },
  professional: {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
  },
  treatmentType: {
    id: '1',
    name: 'Consulta General',
    duration: 30,
    color: '#3B82F6',
  },
  createdBy: {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
  },
};

const AppointmentManagementExample: React.FC = () => {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showQuickReschedule, setShowQuickReschedule] = useState(false);
  
  // Selected appointment and action
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [confirmationAction, setConfirmationAction] = useState<'cancel' | 'delete' | 'confirm' | 'complete' | 'no-show'>('cancel');
  
  // Filters
  const [filters, setFilters] = useState<AppointmentFilters>({});

  // Demo functions
  const handleCreateAppointment = () => {
    setShowCreateModal(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleConfirmationAction = (appointment: Appointment, action: typeof confirmationAction) => {
    setSelectedAppointment(appointment);
    setConfirmationAction(action);
    setShowConfirmationModal(true);
  };

  const handleQuickReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowQuickReschedule(true);
  };

  const handleAppointmentSuccess = (appointment: Appointment, action?: string) => {
    // Demo success handling with enhanced notifications
    switch (action) {
      case 'created':
        AppointmentNotifications.appointmentCreated(appointment);
        break;
      case 'confirmed':
        AppointmentNotifications.appointmentConfirmed(appointment);
        break;
      case 'cancelled':
        AppointmentNotifications.appointmentCancelled(appointment, 'Reagendado por el paciente');
        break;
      case 'completed':
        AppointmentNotifications.appointmentCompleted(appointment);
        break;
      case 'rescheduled':
        AppointmentNotifications.appointmentRescheduled(
          appointment,
          '2024-12-20T09:00:00',
          '2024-12-21T10:00:00'
        );
        break;
      default:
        AppointmentNotifications.success('Acción completada exitosamente');
    }
    
    // Close modals
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setShowConfirmationModal(false);
    setShowQuickReschedule(false);
  };

  const handleConfirmationSubmit = async (data: any) => {
    if (!selectedAppointment) return;

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    handleAppointmentSuccess(selectedAppointment, confirmationAction);
  };

  const handleFiltersChange = (newFilters: AppointmentFilters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    AppointmentNotifications.loading('Preparando exportación...');
    
    setTimeout(() => {
      AppointmentNotifications.dismissLoading();
      AppointmentNotifications.success('Archivo exportado exitosamente');
    }, 2000);
  };

  // Demo notification functions
  const showDemoNotifications = () => {
    AppointmentNotifications.appointmentCreated(mockAppointment);
    
    setTimeout(() => {
      AppointmentNotifications.scheduleConflict(2);
    }, 1000);
    
    setTimeout(() => {
      AppointmentNotifications.whatsappError('María García');
    }, 2000);
    
    setTimeout(() => {
      AppointmentNotifications.reminder(mockAppointment);
    }, 3000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Demo: Gestión Avanzada de Turnos
          </h1>
          <p className="text-gray-600 mt-1">
            Demostración de todas las funcionalidades implementadas
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={showDemoNotifications}
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            Demo Notificaciones
          </Button>
          
          <Button
            variant="primary"
            onClick={handleCreateAppointment}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Gestión Completa</h3>
                <p className="text-sm text-gray-600">Crear, editar, cancelar turnos</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Validaciones</h3>
                <p className="text-sm text-gray-600">Conflictos y disponibilidad</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Reprogramación</h3>
                <p className="text-sm text-gray-600">Rápida y fácil</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Notificaciones</h3>
                <p className="text-sm text-gray-600">WhatsApp automático</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Advanced Filters Demo */}
      <AppointmentAdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        professionals={mockProfessionals}
        treatmentTypes={mockTreatmentTypes}
        onExport={handleExport}
      />

      {/* Demo Actions */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            Acciones de Demostración
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              onClick={() => handleViewAppointment(mockAppointment)}
              icon={<Calendar className="w-4 h-4" />}
              className="w-full"
            >
              Ver Detalles
            </Button>

            <Button
              variant="success"
              onClick={() => handleConfirmationAction(mockAppointment, 'confirm')}
              icon={<CheckCircle className="w-4 h-4" />}
              className="w-full"
            >
              Confirmar Turno
            </Button>

            <Button
              variant="warning"
              onClick={() => handleQuickReschedule(mockAppointment)}
              icon={<RotateCcw className="w-4 h-4" />}
              className="w-full"
            >
              Reprogramar
            </Button>

            <Button
              variant="danger"
              onClick={() => handleConfirmationAction(mockAppointment, 'cancel')}
              icon={<XCircle className="w-4 h-4" />}
              className="w-full"
            >
              Cancelar Turno
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Sample Appointment Card */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            Turno de Ejemplo
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {mockAppointment.patient.firstName} {mockAppointment.patient.lastName}
                </h4>
                <p className="text-sm text-gray-600">
                  {mockAppointment.treatmentType.name} - Dr. {mockAppointment.professional.firstName} {mockAppointment.professional.lastName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    20/12/2024 - 09:00 a 09:30
                  </span>
                  <Badge variant="info">Programado</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewAppointment(mockAppointment)}
                icon={<Calendar className="w-4 h-4" />}
              >
                Ver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleConfirmationAction(mockAppointment, 'confirm')}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Modals */}
      <AppointmentForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        professionals={mockProfessionals}
        treatmentTypes={mockTreatmentTypes}
        onSuccess={(appointment) => handleAppointmentSuccess(appointment, 'created')}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        onEdit={() => {}}
        onReschedule={() => handleQuickReschedule(selectedAppointment!)}
      />

      <AppointmentConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmationSubmit}
        appointment={selectedAppointment}
        action={confirmationAction}
      />

      {showQuickReschedule && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <QuickReschedule
              appointment={selectedAppointment}
              onSuccess={(appointment) => handleAppointmentSuccess(appointment, 'rescheduled')}
              onCancel={() => setShowQuickReschedule(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagementExample;