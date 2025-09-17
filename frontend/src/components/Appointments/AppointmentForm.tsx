import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, FileText, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Alert from '../UI/Alert';
import { useForm } from '../../hooks/useForm';
import { useCreateAppointment, useUpdateAppointment, useAvailableSlots, useCheckSlotAvailability } from '../../hooks/useAppointments';
import { usePatientSearch } from '../../hooks/usePatients';
import { useDebounce } from '../../hooks/useDebounce';
import PatientSearch from '../Patients/PatientSearch';
import { Appointment, CreateAppointmentData, Patient, Professional, TreatmentType } from '../../types';
import toast from 'react-hot-toast';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  initialDate?: Date;
  initialTime?: string;
  professionals: Professional[];
  treatmentTypes: TreatmentType[];
  onSuccess?: (appointment: Appointment) => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  appointment,
  initialDate,
  initialTime,
  professionals,
  treatmentTypes,
  onSuccess,
}) => {
  const isEditing = !!appointment;
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    appointment?.patient ? {
      id: appointment.patient.id,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      phone: appointment.patient.phone,
      email: appointment.patient.email,
      document: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    } : null
  );

  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const checkSlotAvailabilityMutation = useCheckSlotAvailability();
  
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Calculate end time based on treatment duration
  const calculateEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  const form = useForm({
    initialValues: {
      date: appointment 
        ? new Date(appointment.startTime).toISOString().split('T')[0]
        : initialDate?.toISOString().split('T')[0] || '',
      startTime: appointment 
        ? new Date(appointment.startTime).toTimeString().slice(0, 5)
        : initialTime || '',
      endTime: appointment 
        ? new Date(appointment.endTime).toTimeString().slice(0, 5)
        : '',
      professionalId: appointment?.professional.id || '',
      treatmentTypeId: appointment?.treatmentType.id || '',
      notes: appointment?.notes || '',
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
            return 'No se pueden crear turnos en fechas pasadas';
          }
          return null;
        },
      },
      startTime: {
        required: true,
      },
      professionalId: {
        required: true,
      },
      treatmentTypeId: {
        required: true,
      },
    },
    onSubmit: async (values) => {
      if (!selectedPatient) {
        form.setFieldError('patient', 'Debe seleccionar un paciente');
        return;
      }

      try {
        const startDateTime = `${values.date}T${values.startTime}:00`;
        const endDateTime = `${values.date}T${values.endTime}:00`;

        const appointmentData: CreateAppointmentData = {
          startTime: startDateTime,
          endTime: endDateTime,
          patientId: selectedPatient.id,
          professionalId: values.professionalId,
          treatmentTypeId: values.treatmentTypeId,
          notes: values.notes || undefined,
        };

        let response;
        if (isEditing) {
          response = await updateAppointmentMutation.mutateAsync({
            id: appointment.id,
            data: appointmentData,
          });
        } else {
          response = await createAppointmentMutation.mutateAsync(appointmentData);
        }

        if (response.success && response.data) {
          onSuccess?.(response.data);
          handleClose();
        }
      } catch (error) {
        console.error('Error submitting appointment form:', error);
      }
    },
  });

  // Get available slots when date, professional, or treatment type changes
  const { data: availableSlotsData } = useAvailableSlots(
    form.values.date,
    form.values.professionalId,
    form.values.treatmentTypeId,
    !!(form.values.date && form.values.professionalId && form.values.treatmentTypeId)
  );

  const availableSlots = availableSlotsData?.data || [];

  // Update end time when start time or treatment type changes
  useEffect(() => {
    if (form.values.startTime && form.values.treatmentTypeId) {
      const selectedTreatment = treatmentTypes.find(t => t.id === form.values.treatmentTypeId);
      if (selectedTreatment) {
        const endTime = calculateEndTime(form.values.startTime, selectedTreatment.duration);
        form.setFieldValue('endTime', endTime);
      }
    }
  }, [form.values.startTime, form.values.treatmentTypeId, treatmentTypes]);

  // Check for conflicts when key fields change
  useEffect(() => {
    const checkConflicts = async () => {
      if (
        form.values.date &&
        form.values.startTime &&
        form.values.endTime &&
        form.values.professionalId
      ) {
        setIsCheckingAvailability(true);
        setConflictWarning(null);

        try {
          const startDateTime = `${form.values.date}T${form.values.startTime}:00`;
          const endDateTime = `${form.values.date}T${form.values.endTime}:00`;

          const response = await checkSlotAvailabilityMutation.mutateAsync({
            startTime: startDateTime,
            endTime: endDateTime,
            professionalId: form.values.professionalId,
            excludeAppointmentId: appointment?.id,
          });

          if (response.success && response.data) {
            if (!response.data.available && response.data.conflicts?.length) {
              const conflictCount = response.data.conflicts.length;
              setConflictWarning(
                `Hay ${conflictCount} turno${conflictCount > 1 ? 's' : ''} que se superpone${conflictCount > 1 ? 'n' : ''} con este horario.`
              );
            }
          }
        } catch (error) {
          // Silently handle error - don't show toast for availability checks
          console.warn('Error checking availability:', error);
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [form.values.date, form.values.startTime, form.values.endTime, form.values.professionalId, appointment?.id]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        setSelectedPatient({
          id: appointment.patient.id,
          firstName: appointment.patient.firstName,
          lastName: appointment.patient.lastName,
          phone: appointment.patient.phone,
          email: appointment.patient.email,
          document: '',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        });
      } else {
        setSelectedPatient(null);
      }
    }
  }, [isOpen, appointment]);

  const handleClose = () => {
    form.resetForm();
    setSelectedPatient(null);
    onClose();
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const isSubmitting = createAppointmentMutation.isLoading || updateAppointmentMutation.isLoading;

  // Filter treatment types by selected professional
  const filteredTreatmentTypes = form.values.professionalId
    ? treatmentTypes.filter(tt => tt.professionalId === form.values.professionalId)
    : treatmentTypes;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Turno' : 'Nuevo Turno'}
      size="lg"
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {/* Patient Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Paciente
          </h3>
          
          {selectedPatient ? (
            <Card>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Cambiar
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <PatientSearch
              onSelectPatient={handlePatientSelect}
              placeholder="Buscar y seleccionar paciente..."
            />
          )}
        </div>

        {/* Appointment Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Detalles del Turno
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              name="date"
              value={form.values.date}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.date ? form.errors.date : undefined}
              required
            />

            <div>
              <label className="label required">Profesional</label>
              <select
                name="professionalId"
                value={form.values.professionalId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={`input ${form.touched.professionalId && form.errors.professionalId ? 'input-error' : ''}`}
                required
              >
                <option value="">Seleccionar profesional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    Dr. {professional.firstName} {professional.lastName}
                  </option>
                ))}
              </select>
              {form.touched.professionalId && form.errors.professionalId && (
                <p className="form-error">{form.errors.professionalId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label required">Tipo de Tratamiento</label>
            <select
              name="treatmentTypeId"
              value={form.values.treatmentTypeId}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`input ${form.touched.treatmentTypeId && form.errors.treatmentTypeId ? 'input-error' : ''}`}
              required
              disabled={!form.values.professionalId}
            >
              <option value="">Seleccionar tratamiento</option>
              {filteredTreatmentTypes.map((treatmentType) => (
                <option key={treatmentType.id} value={treatmentType.id}>
                  {treatmentType.name} ({treatmentType.duration} min)
                </option>
              ))}
            </select>
            {form.touched.treatmentTypeId && form.errors.treatmentTypeId && (
              <p className="form-error">{form.errors.treatmentTypeId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label required">Hora de Inicio</label>
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
        </div>

        {/* Conflict Warning */}
        {conflictWarning && (
          <Alert variant="warning" className="mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Conflicto de horario detectado</p>
                <p className="text-sm text-yellow-700 mt-1">{conflictWarning}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Puedes continuar si deseas sobrescribir o modificar el horario.
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Availability Check Status */}
        {isCheckingAvailability && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span>Verificando disponibilidad...</span>
          </div>
        )}

        {/* Available Slots Info */}
        {availableSlots.length > 0 && form.values.date && form.values.professionalId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Horarios disponibles para {new Date(form.values.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slice(0, 8).map((slot) => (
                <Badge 
                  key={slot.startTime} 
                  variant="success" 
                  size="sm"
                  className="cursor-pointer hover:bg-green-200"
                  onClick={() => form.setFieldValue('startTime', slot.startTime)}
                >
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

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Observaciones
          </h3>
          
          <div className="space-y-2">
            <label className="label">Notas</label>
            <textarea
              name="notes"
              value={form.values.notes}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className="input min-h-[80px] resize-none"
              placeholder="Observaciones adicionales sobre el turno..."
              rows={3}
            />
            {form.touched.notes && form.errors.notes && (
              <p className="form-error">{form.errors.notes}</p>
            )}
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
            variant={conflictWarning ? "warning" : "primary"}
            loading={isSubmitting}
            disabled={!form.isValid || !selectedPatient || isCheckingAvailability}
            icon={<Save className="w-4 h-4" />}
          >
            {conflictWarning 
              ? `${isEditing ? 'Actualizar' : 'Crear'} con Conflicto`
              : `${isEditing ? 'Actualizar' : 'Crear'} Turno`
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentForm;