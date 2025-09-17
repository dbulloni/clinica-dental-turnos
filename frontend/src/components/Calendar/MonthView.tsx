import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User } from 'lucide-react';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Appointment, APPOINTMENT_STATUSES } from '../../types';
import { useCalendar } from '../../hooks/useCalendar';

interface MonthViewProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, time?: string) => void;
  calendar: ReturnType<typeof useCalendar>;
}

const MonthView: React.FC<MonthViewProps> = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onSlotClick,
  calendar,
}) => {
  // Group appointments by date
  const appointmentsByDate = React.useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    appointments.forEach((appointment) => {
      const date = format(new Date(appointment.startTime), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });

    // Sort appointments by time for each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => 
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

  const handleDayClick = (date: Date) => {
    if (onSlotClick) {
      onSlotClick(date);
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
    <div className="h-full">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 h-full">
        {calendar.calendarDays.map((day, index) => {
          const dayAppointments = appointmentsByDate[day.dateString] || [];
          const isClickable = day.isCurrentMonth;

          return (
            <div
              key={index}
              className={`
                min-h-[120px] border-r border-b border-gray-200 p-2 
                ${isClickable ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-25'}
                ${day.isToday ? 'bg-blue-50' : ''}
              `}
              onClick={() => isClickable && handleDayClick(day.date)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                  `}
                >
                  {format(day.date, 'd')}
                </span>
                
                {dayAppointments.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              {/* Appointments */}
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={(e) => handleAppointmentClick(e, appointment)}
                    className={`
                      text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity
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
                    <div className="flex items-center space-x-1 mb-0.5">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">
                        {format(new Date(appointment.startTime), 'HH:mm')}
                      </span>
                      <Badge 
                        variant={getStatusVariant(appointment.status)}
                        size="sm"
                        className="ml-auto"
                      >
                        {appointment.status === 'SCHEDULED' ? 'P' : 
                         appointment.status === 'CONFIRMED' ? 'C' :
                         appointment.status === 'CANCELLED' ? 'X' :
                         appointment.status === 'COMPLETED' ? '✓' : '?'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 truncate">
                      {appointment.treatmentType.name}
                    </div>
                  </div>
                ))}
                
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{dayAppointments.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;