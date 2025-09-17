import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Appointment } from '../../types';

interface NotificationOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

export class AppointmentNotifications {
  /**
   * Notificación de turno creado exitosamente
   */
  static appointmentCreated(appointment: Appointment, options?: NotificationOptions) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno creado exitosamente</p>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.patient.firstName} {appointment.patient.lastName} - 
              {new Date(appointment.startTime).toLocaleDateString()} a las {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Notificación WhatsApp enviada</span>
            </div>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: options?.position || 'top-right',
        id: `appointment-created-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de turno actualizado
   */
  static appointmentUpdated(appointment: Appointment, options?: NotificationOptions) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno actualizado</p>
            <p className="text-sm text-gray-600 mt-1">
              Los cambios han sido guardados y el paciente ha sido notificado
            </p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: options?.position || 'top-right',
        id: `appointment-updated-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de turno confirmado
   */
  static appointmentConfirmed(appointment: Appointment, options?: NotificationOptions) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno confirmado</p>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.patient.firstName} {appointment.patient.lastName} - Confirmación enviada por WhatsApp
            </p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: options?.position || 'top-right',
        id: `appointment-confirmed-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de turno cancelado
   */
  static appointmentCancelled(appointment: Appointment, reason?: string, options?: NotificationOptions) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno cancelado</p>
            <p className="text-sm text-gray-600 mt-1">
              El paciente ha sido notificado de la cancelación
            </p>
            {reason && (
              <p className="text-xs text-gray-500 mt-1">Motivo: {reason}</p>
            )}
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: options?.position || 'top-right',
        id: `appointment-cancelled-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de turno reprogramado
   */
  static appointmentRescheduled(
    appointment: Appointment, 
    oldDateTime: string, 
    newDateTime: string, 
    options?: NotificationOptions
  ) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno reprogramado</p>
            <div className="text-sm text-gray-600 mt-1 space-y-1">
              <p>
                <span className="text-red-500 line-through">
                  {new Date(oldDateTime).toLocaleDateString()} - {new Date(oldDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p>
                <span className="text-green-600 font-medium">
                  {new Date(newDateTime).toLocaleDateString()} - {new Date(newDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Notificación de cambio enviada</span>
            </div>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: options?.position || 'top-right',
        id: `appointment-rescheduled-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de turno completado
   */
  static appointmentCompleted(appointment: Appointment, options?: NotificationOptions) {
    toast.success(
      (t) => (
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Turno completado</p>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.treatmentType.name} - {appointment.patient.firstName} {appointment.patient.lastName}
            </p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: options?.position || 'top-right',
        id: `appointment-completed-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de conflicto de horario
   */
  static scheduleConflict(conflictCount: number, options?: NotificationOptions) {
    toast.error(
      (t) => (
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Conflicto de horario detectado</p>
            <p className="text-sm text-gray-600 mt-1">
              Hay {conflictCount} turno{conflictCount > 1 ? 's' : ''} que se superpone{conflictCount > 1 ? 'n' : ''} con este horario
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Puedes continuar si deseas sobrescribir el horario
            </p>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: options?.position || 'top-right',
        id: 'schedule-conflict',
      }
    );
  }

  /**
   * Notificación de error en WhatsApp
   */
  static whatsappError(patientName: string, options?: NotificationOptions) {
    toast.error(
      (t) => (
        <div className="flex items-start space-x-3">
          <Phone className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Error al enviar WhatsApp</p>
            <p className="text-sm text-gray-600 mt-1">
              No se pudo enviar la notificación a {patientName}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Mail className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Intentando envío por email...</span>
            </div>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: options?.position || 'top-right',
        id: `whatsapp-error-${patientName}`,
      }
    );
  }

  /**
   * Notificación de validación de formulario
   */
  static validationError(message: string, options?: NotificationOptions) {
    toast.error(
      (t) => (
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Error de validación</p>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: options?.position || 'top-right',
        id: 'validation-error',
      }
    );
  }

  /**
   * Notificación informativa
   */
  static info(title: string, message: string, options?: NotificationOptions) {
    toast(
      (t) => (
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: options?.position || 'top-right',
        id: `info-${title}`,
      }
    );
  }

  /**
   * Notificación de recordatorio
   */
  static reminder(appointment: Appointment, options?: NotificationOptions) {
    toast(
      (t) => (
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Recordatorio de turno</p>
            <p className="text-sm text-gray-600 mt-1">
              {appointment.patient.firstName} {appointment.patient.lastName} - 
              {new Date(appointment.startTime).toLocaleDateString()} a las {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Recordatorio enviado 24h antes
            </p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: options?.position || 'top-right',
        id: `reminder-${appointment.id}`,
      }
    );
  }

  /**
   * Notificación de carga de datos
   */
  static loading(message: string = 'Cargando...') {
    return toast.loading(
      (t) => (
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">{message}</span>
        </div>
      ),
      {
        id: 'loading-toast',
      }
    );
  }

  /**
   * Dismissar notificación de carga
   */
  static dismissLoading() {
    toast.dismiss('loading-toast');
  }

  /**
   * Notificación de éxito genérica
   */
  static success(message: string, options?: NotificationOptions) {
    toast.success(message, {
      duration: 4000,
      position: options?.position || 'top-right',
    });
  }

  /**
   * Notificación de error genérica
   */
  static error(message: string, options?: NotificationOptions) {
    toast.error(message, {
      duration: 5000,
      position: options?.position || 'top-right',
    });
  }
}

export default AppointmentNotifications;