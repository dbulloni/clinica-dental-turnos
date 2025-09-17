import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { useCalendar, CalendarView as ViewType } from '../../hooks/useCalendar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import { Appointment, AppointmentFilters } from '../../types';

interface CalendarViewProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, time?: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  filters?: AppointmentFilters;
  className?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onSlotClick,
  onDateRangeChange,
  filters,
  className,
}) => {
  const calendar = useCalendar({
    initialView: 'month',
  });

  // Notify parent of date range changes
  React.useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(
        calendar.formatters.dateString(calendar.dateRange.start),
        calendar.formatters.dateString(calendar.dateRange.end)
      );
    }
  }, [calendar.dateRange, onDateRangeChange]);

  const viewOptions: { value: ViewType; label: string }[] = [
    { value: 'month', label: 'Mes' },
    { value: 'week', label: 'Semana' },
    { value: 'day', label: 'Día' },
  ];

  const renderCalendarContent = () => {
    const commonProps = {
      appointments,
      loading,
      onAppointmentClick,
      onSlotClick,
      calendar,
    };

    switch (calendar.view) {
      case 'month':
        return <MonthView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'day':
        return <DayView {...commonProps} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Calendar Header */}
      <Card>
        <Card.Body>
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={calendar.goToToday}
                icon={<CalendarIcon className="w-4 h-4" />}
              >
                Hoy
              </Button>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={calendar.goToPrevious}
                  icon={<ChevronLeft className="w-4 h-4" />}
                  className="p-2"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={calendar.goToNext}
                  icon={<ChevronRight className="w-4 h-4" />}
                  className="p-2"
                />
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px]">
                {calendar.formatters.title()}
              </h2>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2">
              {viewOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={calendar.view === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => calendar.setView(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Calendar Content */}
      <Card>
        <Card.Body className="p-0">
          {renderCalendarContent()}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CalendarView;