import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Edit,
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  MessageSquare
} from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Card from '../UI/Card';
import { 
  useUpdateAppointmentStatus, 
  useDeleteAppointment, 
  useRescheduleAppointment 
} from '../../hooks/useAppointments';
import { Appointment, APPOINTMENT_STATUSES } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onEdit?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onReschedule,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const updateStatusMutation = useUpdateAppointmentStatus();
  const deleteAppointmentMutation = useDeleteAppointment();

  if (!appointment) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'SCHEDULED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      case 'COMPLETED':
        return 'primary';
      case 'NO_SHOW':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      id: appointment.id,
      status: newStatus,
    });
    onClose();
  };

  const handleCancel = async () => {
    await updateStatusMutation.mutateAsync({
      id: appointment.id,
      status: 'CANCELLED',
    });
    setShowCancelConfirm(false);
    setCancelReason('');
    onClose();
  };

  const handleDelete = async () => {
    await deleteAppointmentMutation.mutateAsync(appointment.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canConfirm = appointment.status === 'SCHEDULED';
  const canCancel = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canComplete = appointment.status === 'CONFIRMED';
  const canMarkNoShow = appointment.status === 'CONFIRMED';

  const appointmentDate = new Date(appointment.startTime);
  const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isPast = appointmentDate < new Date();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Turno"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <Badge 
                  variant={getStatusVariant(appointment.status)}
                  dot
                >
                  {APPOINTMENT_STATUSES[appointment.status]}
                </Badge>
                {isToday && (
                  <Badge variant="info">Hoy</Badge>
                )}
                {isPast && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                  <Badge variant="warning">Vencido</Badge>
                )}
              </div>
            </div>
          </div>

          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit?.(appointment)}
              icon={<Edit className="w-4 h-4" />}
            >
              Editar
            </Button>
          )}
        </div>

        {/* Appointment Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date and Time */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Fecha y Hora
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fecha</p>
                    <p className="text-sm text-gray-600">
                      {format(appointmentDate, 'EEEE, d MMMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Horario</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(appointment.startTime), 'HH:mm')} - 
                      {format(new Date(appointment.endTime), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Patient Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Información del Paciente
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paciente</p>
                    <p className="text-sm text-gray-600">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <p className="text-sm text-gray-600">{appointment.patient.phone}</p>
                  </div>
                </div>

                {appointment.patient.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Treatment and Professional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Tratamiento
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tipo</p>
                    <p className="text-sm text-gray-600">{appointment.treatmentType.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duración</p>
                    <p className="text-sm text-gray-600">{appointment.treatmentType.duration} minutos</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Profesional
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Doctor</p>
                  <p className="text-sm text-gray-600">
                    Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Notas
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Observations */}
        {appointment.observations && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">
                Observaciones
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 whitespace-pre-wrap">
                  {appointment.observations}
                </p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-6 border-t">
          {canConfirm && (
            <Button
              variant="success"
              onClick={() => handleStatusChange('CONFIRMED')}
              loading={updateStatusMutation.isLoading}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Confirmar
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              onClick={() => handleStatusChange('COMPLETED')}
              loading={updateStatusMutation.isLoading}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Completar
            </Button>
          )}

          {canMarkNoShow && (
            <Button
              variant="warning"
              onClick={() => handleStatusChange('NO_SHOW')}
              loading={updateStatusMutation.isLoading}
              icon={<XCircle className="w-4 h-4" />}
            >
              No se presentó
            </Button>
          )}

          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => onReschedule?.(appointment)}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reprogramar
            </Button>
          )}

          {canCancel && (
            <Button
              variant="danger"
              onClick={() => setShowCancelConfirm(true)}
              icon={<XCircle className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Cerrar
          </Button>

          {/* Delete button for admins */}
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 ml-auto"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar
          </Button>
        </div>

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Cancelación
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que quieres cancelar este turno? Esta acción enviará una notificación al paciente.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación (opcional)"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                rows={3}
              />
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  loading={updateStatusMutation.isLoading}
                >
                  Confirmar Cancelación
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Eliminación
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que quieres eliminar este turno permanentemente? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleteAppointmentMutation.isLoading}
                >
                  Eliminar Permanentemente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AppointmentDetailsModal;