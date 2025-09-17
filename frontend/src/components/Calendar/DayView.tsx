import React from 'react';
import { format } from 'date-fns';
import { Clock, User, Phone, FileText } from 'lucide-react';
import Badge from '../UI/Badge';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';
import { Appointment, APPOINTMENT_STATUSES } from '../../types';
import { useCalendar } from '../../hooks/useCalendar';

interface DayViewProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, time?: string) => void;
  calendar: ReturnType<typeof useCalendar>;
}

const DayView: React.FC<DayViewProps> = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onSlotClick,
  calendar,
}) => {
  // Group appointments by time
  const appointmentsByTime = React.useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    appointments.forEach((appointment) => {
      const time = format(new Date(appointment.startTime), 'HH:mm');
      if (!grouped[time]) {
        grouped[time] = [];
      }
      grouped[time].push(appointment);
    });

    // Sort appointments by time
    Object.keys(grouped).forEach((time) => {
      grouped[time].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [appointments]);

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

  const handleSlotClick = (time: string) => {
    if (onSlotClick) {
      onSlotClick(calendar.currentDate, time);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dayAppointments = appointments.filter(appointment => 
    calendar.isSameDayAs(new Date(appointment.startTime), calendar.currentDate)
  );

  return (
    <div className="h-full">
      {/* Day header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(calendar.currentDate, 'EEEE, d MMMM yyyy', { locale: require('date-fns/locale/es') })}
            </h3>
            <p className="text-sm text-gray-600">
              {dayAppointments.length} {dayAppointments.length === 1 ? 'turno' : 'turnos'} programados
            </p>
          </div>
          
          {calendar.isToday(calendar.currentDate) && (
            <Badge variant="primary">Hoy</Badge>
          )}
        </div>
      </div>

      {dayAppointments.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Clock}
            title="No hay turnos programados"
            description="No hay turnos programados para este día."
            action={{
              label: "Crear Turno",
              onClick: () => onSlotClick?.(calendar.currentDate),
            }}
          />
        </div>
      ) : (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Time slots with appointments */}
          {calendar.timeSlots.map((slot) => {
            const slotAppointments = appointmentsByTime[slot.time] || [];
            const hasAppointments = slotAppointments.length > 0;

            return (
              <div key={slot.time} className="flex">
                {/* Time column */}
                <div className="w-20 flex-shrink-0 pr-4">
                  <div className="text-sm font-medium text-gray-600 text-right">
                    {slot.time}
                  </div>
                </div>

                {/* Appointments column */}
                <div className="flex-1">
                  {hasAppointments ? (
                    <div className="space-y-2">
                      {slotAppointments.map((appointment) => (
                        <Card
                          key={appointment.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <Card.Body className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Patient info */}
                                <div className="flex items-center space-x-2 mb-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">
                                    {appointment.patient.firstName} {appointment.patient.lastName}
                                  </span>
                                  <Badge variant={getStatusVariant(appointment.status)}>
                                    {APPOINTMENT_STATUSES[appointment.status]}
                                  </Badge>
                                </div>

                                {/* Treatment and professional */}
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-3 h-3" />
                                    <span>{appointment.treatmentType.name}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{appointment.treatmentType.duration} min</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <User className="w-3 h-3" />
                                    <span>
                                      Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                                    </span>
                                  </div>
                                  
                                  {appointment.patient.phone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="w-3 h-3" />
                                      <span>{appointment.patient.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Notes */}
                                {appointment.notes && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                    <strong>Notas:</strong> {appointment.notes}
                                  </div>
                                )}
                              </div>

                              {/* Time range */}
                              <div className="text-right text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {format(new Date(appointment.startTime), 'HH:mm')} - 
                                    {format(new Date(appointment.endTime), 'HH:mm')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      onClick={() => handleSlotClick(slot.time)}
                    >
                      <span className="text-sm text-gray-400">Disponible</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DayView;