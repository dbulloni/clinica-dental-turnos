import React from 'react';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Appointment } from '../../types';
import { useCalendar } from '../../hooks/useCalendar';

interface WeekViewProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, time?: string) => void;
  calendar: ReturnType<typeof useCalendar>;
}

const WeekView: React.FC<WeekViewProps> = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onSlotClick,
  calendar,
}) => {
  // Group appointments by date and time
  const appointmentsByDateTime = React.useMemo(() => {
    const grouped: Record<string, Record<string, Appointment[]>> = {};
    
    appointments.forEach((appointment) => {
      const date = format(new Date(appointment.startTime), 'yyyy-MM-dd');
      const time = format(new Date(appointment.startTime), 'HH:mm');
      
      if (!grouped[date]) {
        grouped[date] = {};
      }
      if (!grouped[date][time]) {
        grouped[date][time] = [];
      }
      grouped[date][time].push(appointment);
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

  const handleSlotClick = (date: Date, time: string) => {
    if (onSlotClick) {
      onSlotClick(date, time);
    }
  };

  const handleAppointmentClick = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation();
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

  return (
    <div className="h-full overflow-auto">
      {/* Header with days */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="grid grid-cols-8">
          {/* Time column header */}
          <div className="p-3 border-r border-gray-200 bg-gray-50">
            <span className="text-sm font-medium text-gray-500">Hora</span>
          </div>
          
          {/* Day headers */}
          {calendar.weekDays.map((day) => (
            <div
              key={day.dateString}
              className={`
                p-3 text-center border-r border-gray-200 bg-gray-50
                ${day.isToday ? 'bg-blue-50' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-900">
                {day.dayName}
              </div>
              <div
                className={`
                  text-lg font-semibold mt-1
                  ${day.isToday 
                    ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                    : 'text-gray-700'
                  }
                `}
              >
                {day.dayNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-8">
        {calendar.timeSlots.map((slot) => (
          <React.Fragment key={slot.time}>
            {/* Time label */}
            <div className="p-2 border-r border-b border-gray-200 bg-gray-50 text-center">
              <span className="text-xs text-gray-600">{slot.time}</span>
            </div>
            
            {/* Day columns */}
            {calendar.weekDays.map((day) => {
              const dayAppointments = appointmentsByDateTime[day.dateString]?.[slot.time] || [];
              
              return (
                <div
                  key={`${day.dateString}-${slot.time}`}
                  className="min-h-[60px] border-r border-b border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSlotClick(day.date, slot.time)}
                >
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={(e) => handleAppointmentClick(e, appointment)}
                      className={`
                        text-xs p-2 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity
                        ${appointment.treatmentType.color 
                          ? `bg-${appointment.treatmentType.color}-100 text-${appointment.treatmentType.color}-800 border border-${appointment.treatmentType.color}-200`
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }
                      `}
                      style={{
                        backgroundColor: appointment.treatmentType.color 
                          ? `${appointment.treatmentType.color}20` 
                          : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">
                            {format(new Date(appointment.startTime), 'HH:mm')}
                          </span>
                        </div>
                        <Badge 
                          variant={getStatusVariant(appointment.status)}
                          size="sm"
                        >
                          {appointment.status === 'SCHEDULED' ? 'P' : 
                           appointment.status === 'CONFIRMED' ? 'C' :
                           appointment.status === 'CANCELLED' ? 'X' :
                           appointment.status === 'COMPLETED' ? '✓' : '?'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-1">
                        <User className="w-3 h-3" />
                        <span className="truncate font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 truncate">
                        {appointment.treatmentType.name}
                      </div>
                      
                      <div className="text-xs text-gray-500 truncate">
                        Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekView;