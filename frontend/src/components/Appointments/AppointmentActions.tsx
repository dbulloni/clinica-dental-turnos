import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Edit, 
  Trash2,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import { 
  useUpdateAppointmentStatus, 
  useDeleteAppointment,
  useCancelAppointment 
} from '../../hooks/useAppointments';
import { Appointment } from '../../types';

interface AppointmentActionsProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  compact?: boolean;
  className?: string;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  onEdit,
  onReschedule,
  onView,
  compact = false,
  className,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const updateStatusMutation = useUpdateAppointmentStatus();
  const cancelAppointmentMutation = useCancelAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const canConfirm = appointment.status === 'SCHEDULED';
  const canComplete = appointment.status === 'CONFIRMED';
  const canCancel = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canMarkNoShow = appointment.status === 'CONFIRMED';

  const handleStatusChange = async (newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      id: appointment.id,
      status: newStatus,
    });
  };

  const handleCancel = async () => {
    await cancelAppointmentMutation.mutateAsync({
      id: appointment.id,
      reason: cancelReason || undefined,
    });
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleDelete = async () => {
    await deleteAppointmentMutation.mutateAsync(appointment.id);
    setShowDeleteModal(false);
  };

  const isLoading = updateStatusMutation.isLoading || 
                   cancelAppointmentMutation.isLoading || 
                   deleteAppointmentMutation.isLoading;

  if (compact) {
    return (
      <>
        <div className={`flex items-center space-x-1 ${className || ''}`}>
          {canConfirm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange('CONFIRMED')}
              loading={isLoading}
              className="p-1 text-green-600 hover:text-green-700"
              title="Confirmar"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}

          {canComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange('COMPLETED')}
              loading={isLoading}
              className="p-1 text-blue-600 hover:text-blue-700"
              title="Completar"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}

          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(appointment)}
              className="p-1"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReschedule?.(appointment)}
              className="p-1 text-orange-600 hover:text-orange-700"
              title="Reprogramar"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}

          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="p-1 text-red-600 hover:text-red-700"
              title="Cancelar"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Turno"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres cancelar este turno? Se enviará una notificación al paciente.
            </p>
            
            <div>
              <label className="label">Motivo de cancelación (opcional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input min-h-[80px] resize-none"
                placeholder="Describe el motivo de la cancelación..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={isLoading}
                icon={<XCircle className="w-4 h-4" />}
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className={`space-y-3 ${className || ''}`}>
        {/* Primary Actions */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button
              variant="success"
              onClick={() => handleStatusChange('CONFIRMED')}
              loading={isLoading}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Confirmar Turno
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              onClick={() => handleStatusChange('COMPLETED')}
              loading={isLoading}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Completar Turno
            </Button>
          )}

          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit?.(appointment)}
              icon={<Edit className="w-4 h-4" />}
            >
              Editar
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
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-wrap gap-2">
          {canMarkNoShow && (
            <Button
              variant="warning"
              onClick={() => handleStatusChange('NO_SHOW')}
              loading={isLoading}
              icon={<XCircle className="w-4 h-4" />}
            >
              No se presentó
            </Button>
          )}

          {canCancel && (
            <Button
              variant="danger"
              onClick={() => setShowCancelModal(true)}
              icon={<XCircle className="w-4 h-4" />}
            >
              Cancelar Turno
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => console.log('Send notification')}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            Enviar Notificación
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:text-red-700"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar Turno"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Cancelar Turno</p>
                <p>
                  Se enviará automáticamente una notificación de cancelación al paciente 
                  por WhatsApp con el motivo especificado.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="label">Motivo de cancelación</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Describe el motivo de la cancelación (se incluirá en la notificación al paciente)..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={isLoading}
              icon={<XCircle className="w-4 h-4" />}
            >
              Confirmar Cancelación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Turno"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Eliminar Permanentemente</p>
                <p>
                  Esta acción eliminará el turno permanentemente del sistema. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isLoading}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppointmentActions;