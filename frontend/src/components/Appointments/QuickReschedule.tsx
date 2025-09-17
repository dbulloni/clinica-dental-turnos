import React, { useState, useEffect } from 'react';
import { RotateCcw, Clock, Calendar, CheckCircle, X } from 'lucide-react';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Card from '../UI/Card';
import { useAvailableSlots, useRescheduleAppointment } from '../../hooks/useAppointments';
import { Appointment } from '../../types';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface QuickRescheduleProps {
  appointment: Appointment;
  onSuccess?: (appointment: Appointment) => void;
  onCancel?: () => void;
  className?: string;
}

const QuickReschedule: React.FC<QuickRescheduleProps> = ({
  appointment,
  onSuccess,
  onCancel,
  className,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);

  const rescheduleAppointmentMutation = useRescheduleAppointment();

  // Generate suggested dates (next 7 days excluding today)
  useEffect(() => {
    const dates: string[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    
    setSuggestedDates(dates);
    setSelectedDate(dates[0]); // Default to tomorrow
  }, []);

  // Get available slots for selected date
  const { data: availableSlotsData, isLoading: isLoadingSlots } = useAvailableSlots(
    selectedDate,
    appointment.professional.id,
    appointment.treatmentType.id,
    !!selectedDate
  );

  const availableSlots = availableSlotsData?.data || [];

  const calculateEndTime = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error('Por favor selecciona un horario');
      return;
    }

    try {
      const endTime = calculateEndTime(selectedSlot, appointment.treatmentType.duration);
      const newStartTime = `${selectedDate}T${selectedSlot}:00`;
      const newEndTime = `${selectedDate}T${endTime}:00`;

      const response = await rescheduleAppointmentMutation.mutateAsync({
        id: appointment.id,
        newStartTime,
        newEndTime,
      });

      if (response.success && response.data) {
        toast.success('Turno reprogramado exitosamente');
        onSuccess?.(response.data);
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    }
  };

  const isSubmitting = rescheduleAppointmentMutation.isLoading;

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center space-x-2">
          <RotateCcw className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Reprogramación Rápida
          </h3>
        </div>
      </Card.Header>
      
      <Card.Body>
        <div className="space-y-4">
          {/* Current Appointment Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Turno actual:</div>
            <div className="font-medium text-gray-900">
              {format(new Date(appointment.startTime), 'EEEE, d MMMM yyyy - HH:mm', { locale: es })}
            </div>
            <div className="text-sm text-gray-600">
              {appointment.patient.firstName} {appointment.patient.lastName} - {appointment.treatmentType.name}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="label">Nueva Fecha</label>
            <div className="grid grid-cols-2 gap-2">
              {suggestedDates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(''); // Reset slot selection
                  }}
                  className="justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {format(new Date(date), 'EEE d/M', { locale: es })}
                    </div>
                    <div className="text-xs opacity-75">
                      {format(new Date(date), 'EEEE', { locale: es })}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <label className="label">Horario Disponible</label>
              
              {isLoadingSlots ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>Cargando horarios disponibles...</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.startTime}
                      variant={selectedSlot === slot.startTime ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className="text-center"
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay horarios disponibles para esta fecha</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Intenta con otra fecha
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Nuevo horario seleccionado
                </span>
              </div>
              <div className="text-sm text-green-700">
                <div className="font-medium">
                  {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: es })}
                </div>
                <div>
                  {selectedSlot} - {calculateEndTime(selectedSlot, appointment.treatmentType.duration)}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              icon={<X className="w-4 h-4" />}
            >
              Cancelar
            </Button>
            
            <Button
              variant="primary"
              onClick={handleReschedule}
              loading={isSubmitting}
              disabled={!selectedSlot}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reprogramar
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default QuickReschedule;