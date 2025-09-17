import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  User,
  Calendar,
  FileText,
  X
} from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { Appointment } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  appointment: Appointment | null;
  action: 'cancel' | 'delete' | 'confirm' | 'complete' | 'no-show' | 'reschedule';
  loading?: boolean;
}

const AppointmentConfirmationModal: React.FC<AppointmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  action,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  if (!appointment) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'cancel':
        return {
          title: 'Cancelar Turno',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          iconBg: 'bg-red-100',
          message: '¿Estás seguro de que quieres cancelar este turno?',
          description: 'Esta acción enviará una notificación automática al paciente informando sobre la cancelación.',
          confirmText: 'Cancelar Turno',
          confirmVariant: 'danger' as const,
          showReason: true,
          showNotification: true,
        };
      case 'delete':
        return {
          title: 'Eliminar Turno',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          iconBg: 'bg-red-100',
          message: '¿Estás seguro de que quieres eliminar este turno permanentemente?',
          description: 'Esta acción no se puede deshacer. El turno será eliminado completamente del sistema.',
          confirmText: 'Eliminar Permanentemente',
          confirmVariant: 'danger' as const,
          showReason: false,
          showNotification: false,
        };
      case 'confirm':
        return {
          title: 'Confirmar Turno',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          iconBg: 'bg-green-100',
          message: '¿Confirmar este turno?',
          description: 'Se enviará una notificación de confirmación al paciente por WhatsApp.',
          confirmText: 'Confirmar Turno',
          confirmVariant: 'success' as const,
          showReason: false,
          showNotification: true,
        };
      case 'complete':
        return {
          title: 'Completar Turno',
          icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
          iconBg: 'bg-blue-100',
          message: '¿Marcar este turno como completado?',
          description: 'El turno se marcará como finalizado y se podrán agregar observaciones del tratamiento.',
          confirmText: 'Completar Turno',
          confirmVariant: 'primary' as const,
          showReason: false,
          showNotification: false,
          showObservations: true,
        };
      case 'no-show':
        return {
          title: 'Marcar como No Se Presentó',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          message: '¿Marcar que el paciente no se presentó?',
          description: 'El turno se marcará como "No se presentó" y se liberará el horario.',
          confirmText: 'Marcar como No Show',
          confirmVariant: 'warning' as const,
          showReason: true,
          showNotification: false,
        };
      default:
        return {
          title: 'Confirmar Acción',
          icon: <AlertTriangle className="w-8 h-8 text-gray-600" />,
          iconBg: 'bg-gray-100',
          message: '¿Estás seguro de que quieres realizar esta acción?',
          description: '',
          confirmText: 'Confirmar',
          confirmVariant: 'primary' as const,
          showReason: false,
          showNotification: false,
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    const data: any = {};
    
    if (config.showReason && reason.trim()) {
      data.reason = reason.trim();
    }
    
    if (config.showObservations && observations.trim()) {
      data.observations = observations.trim();
    }
    
    if (config.showNotification) {
      data.sendNotification = sendNotification;
    }

    onConfirm(data);
  };

  const handleClose = () => {
    setReason('');
    setObservations('');
    setSendNotification(true);
    onClose();
  };

  const appointmentDate = new Date(appointment.startTime);
  const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isPast = appointmentDate < new Date();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={config.title}
      size="md"
    >
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-center">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
            {config.icon}
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {config.message}
          </h3>
          {config.description && (
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          )}
        </div>

        {/* Appointment Details */}
        <Card>
          <Card.Header>
            <h4 className="text-md font-medium text-gray-900">
              Detalles del Turno
            </h4>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Paciente:</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Fecha:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {format(appointmentDate, 'dd/MM/yyyy HH:mm')}
                  </span>
                  {isToday && <Badge variant="info" size="sm">Hoy</Badge>}
                  {isPast && <Badge variant="warning" size="sm">Vencido</Badge>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Tratamiento:</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {appointment.treatmentType.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Profesional:</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Estado:</span>
                </div>
                <Badge 
                  variant={
                    appointment.status === 'CONFIRMED' ? 'success' :
                    appointment.status === 'SCHEDULED' ? 'info' :
                    appointment.status === 'CANCELLED' ? 'danger' :
                    appointment.status === 'COMPLETED' ? 'primary' : 'secondary'
                  }
                >
                  {appointment.status === 'CONFIRMED' ? 'Confirmado' :
                   appointment.status === 'SCHEDULED' ? 'Programado' :
                   appointment.status === 'CANCELLED' ? 'Cancelado' :
                   appointment.status === 'COMPLETED' ? 'Completado' :
                   appointment.status === 'NO_SHOW' ? 'No se presentó' : appointment.status}
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Reason Input */}
        {config.showReason && (
          <div className="space-y-2">
            <label className="label">
              {action === 'cancel' ? 'Motivo de cancelación' : 'Motivo'} (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder={
                action === 'cancel' 
                  ? 'Ej: Reagendado por el paciente, emergencia médica, etc.'
                  : 'Describe el motivo...'
              }
              rows={3}
            />
          </div>
        )}

        {/* Observations Input */}
        {config.showObservations && (
          <div className="space-y-2">
            <label className="label">Observaciones del tratamiento (opcional)</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder="Ej: Tratamiento completado satisfactoriamente, próxima cita recomendada en 6 meses..."
              rows={3}
            />
          </div>
        )}

        {/* Notification Toggle */}
        {config.showNotification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Notificar al paciente
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Se enviará un mensaje por WhatsApp al paciente
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning for past appointments */}
        {isPast && action !== 'delete' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Turno vencido</p>
                <p className="mt-1">
                  Este turno corresponde a una fecha pasada. Asegúrate de que la acción sea correcta.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            icon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            icon={config.icon}
          >
            {config.confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AppointmentConfirmationModal;