import React, { useEffect, useState } from 'react';
import { Calendar, Clock, RotateCcw, Save, X } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { useForm } from '../../hooks/useForm';
import { useRescheduleAppointment, useAvailableSlots } from '../../hooks/useAppointments';
import { Appointment } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: (appointment: Appointment) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const rescheduleAppointmentMutation = useRescheduleAppointment();

  const form = useForm({
    initialValues: {
      date: appointment 
        ? new Date(appointment.startTime).toISOString().split('T')[0]
        : '',
      startTime: appointment 
        ? new Date(appointment.startTime).toTimeString().slice(0, 5)
        : '',
      endTime: appointment 
        ? new Date(appointment.endTime).toTimeString().slice(0, 5)
        : '',
    },
    validationRules: {
      date: {
        required: true,
        custom: (value: string) => {
          if (!value) return 'La fecha es requerida';
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            return 'No se pueden programar turnos en fechas pasadas';
          }
          return null;
        },
      },
      startTime: {
        required: true,
      },
    },
    onSubmit: async (values) => {
      if (!appointment) return;

      try {
        const newStartTime = `${values.date}T${values.startTime}:00`;
        const newEndTime = `${values.date}T${values.endTime}:00`;

        const response = await rescheduleAppointmentMutation.mutateAsync({
          id: appointment.id,
          newStartTime,
          newEndTime,
        });

        if (response.success && response.data) {
          onSuccess?.(response.data);
          handleClose();
        }
      } catch (error) {
        console.error('Error rescheduling appointment:', error);
      }
    },
  });

  // Get available slots when date changes
  const { data: availableSlotsData } = useAvailableSlots(
    form.values.date,
    appointment?.professional.id || '',
    appointment?.treatmentType.id || '',
    !!(form.values.date && appointment)
  );

  const availableSlots = availableSlotsData?.data || [];

  // Calculate end time based on treatment duration
  const calculateEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  // Update end time when start time changes
  useEffect(() => {
    if (form.values.startTime && appointment) {
      const endTime = calculateEndTime(form.values.startTime, appointment.treatmentType.duration);
      form.setFieldValue('endTime', endTime);
    }
  }, [form.values.startTime, appointment]);

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      form.setFieldValue('date', new Date(appointment.startTime).toISOString().split('T')[0]);
      form.setFieldValue('startTime', new Date(appointment.startTime).toTimeString().slice(0, 5));
      form.setFieldValue('endTime', new Date(appointment.endTime).toTimeString().slice(0, 5));
    }
  }, [appointment, isOpen]);

  const handleClose = () => {
    form.resetForm();
    onClose();
  };

  if (!appointment) return null;

  const isSubmitting = rescheduleAppointmentMutation.isLoading;
  const originalDate = new Date(appointment.startTime);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reprogramar Turno"
      size="md"
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Current Appointment Info */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">
              Turno Actual
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Paciente:</span>
                <span className="text-sm font-medium text-gray-900">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profesional:</span>
                <span className="text-sm font-medium text-gray-900">
                  Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tratamiento:</span>
                <span className="text-sm font-medium text-gray-900">
                  {appointment.treatmentType.name}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fecha actual:</span>
                <Badge variant="info">
                  {format(originalDate, 'dd/MM/yyyy HH:mm', { locale: es })}
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* New Date and Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Nueva Fecha y Hora
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nueva Fecha"
              type="date"
              name="date"
              value={form.values.date}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.date ? form.errors.date : undefined}
              required
            />

            <div>
              <label className="label required">Nueva Hora de Inicio</label>
              {availableSlots.length > 0 ? (
                <select
                  name="startTime"
                  value={form.values.startTime}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={`input ${form.touched.startTime && form.errors.startTime ? 'input-error' : ''}`}
                  required
                >
                  <option value="">Seleccionar hora</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="time"
                  name="startTime"
                  value={form.values.startTime}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.startTime ? form.errors.startTime : undefined}
                  required
                />
              )}
              {form.touched.startTime && form.errors.startTime && (
                <p className="form-error">{form.errors.startTime}</p>
              )}
            </div>
          </div>

          <Input
            label="Hora de Fin"
            type="time"
            name="endTime"
            value={form.values.endTime}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.touched.endTime ? form.errors.endTime : undefined}
            disabled
            helperText="Se calcula automáticamente según la duración del tratamiento"
          />
        </div>

        {/* Available Slots Info */}
        {availableSlots.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Horarios disponibles para {format(new Date(form.values.date), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slice(0, 8).map((slot) => (
                <Badge key={slot.startTime} variant="success" size="sm">
                  {slot.startTime}
                </Badge>
              ))}
              {availableSlots.length > 8 && (
                <Badge variant="secondary" size="sm">
                  +{availableSlots.length - 8} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Calendar className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Importante:</p>
              <p>
                Al reprogramar este turno, se enviará automáticamente una notificación 
                al paciente con la nueva fecha y hora.
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            icon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!form.isValid}
            icon={<Save className="w-4 h-4" />}
          >
            Reprogramar Turno
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RescheduleModal;