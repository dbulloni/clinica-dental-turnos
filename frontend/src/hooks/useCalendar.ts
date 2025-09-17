import { useState, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks, 
  addMonths, 
  format, 
  isSameDay, 
  isSameMonth, 
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';

export type CalendarView = 'month' | 'week' | 'day';

interface UseCalendarOptions {
  initialDate?: Date;
  initialView?: CalendarView;
}

export const useCalendar = (options: UseCalendarOptions = {}) => {
  const [currentDate, setCurrentDate] = useState(options.initialDate || new Date());
  const [view, setView] = useState<CalendarView>(options.initialView || 'month');

  // Navigation functions
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, -1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
    }
  };

  const goToNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
    }
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  // Date range calculations
  const dateRange = useMemo(() => {
    switch (view) {
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        
        return {
          start: calendarStart,
          end: calendarEnd,
          viewStart: monthStart,
          viewEnd: monthEnd,
        };
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        return {
          start: weekStart,
          end: weekEnd,
          viewStart: weekStart,
          viewEnd: weekEnd,
        };
      }
      case 'day': {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);
        
        return {
          start: dayStart,
          end: dayEnd,
          viewStart: dayStart,
          viewEnd: dayEnd,
        };
      }
    }
  }, [currentDate, view]);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    if (view !== 'month') return [];

    const days = [];
    let day = dateRange.start;

    while (day <= dateRange.end) {
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
        dateString: format(day, 'yyyy-MM-dd'),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [dateRange, currentDate, view]);

  // Generate week days for week view
  const weekDays = useMemo(() => {
    if (view !== 'week') return [];

    const days = [];
    let day = dateRange.start;

    while (day <= dateRange.end) {
      days.push({
        date: day,
        isToday: isToday(day),
        dateString: format(day, 'yyyy-MM-dd'),
        dayName: format(day, 'EEEE', { locale: es }),
        dayNumber: format(day, 'd'),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [dateRange, view]);

  // Generate time slots for day/week view
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          hour,
          minute,
        });
      }
    }

    return slots;
  }, []);

  // Format functions
  const formatters = {
    title: () => {
      switch (view) {
        case 'month':
          return format(currentDate, 'MMMM yyyy', { locale: es });
        case 'week':
          return `${format(dateRange.start, 'd MMM', { locale: es })} - ${format(dateRange.end, 'd MMM yyyy', { locale: es })}`;
        case 'day':
          return format(currentDate, 'EEEE, d MMMM yyyy', { locale: es });
      }
    },
    
    dateString: (date: Date) => format(date, 'yyyy-MM-dd'),
    
    timeString: (date: Date) => format(date, 'HH:mm'),
    
    dateTimeString: (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss"),
  };

  // Utility functions
  const isDateInCurrentView = (date: Date) => {
    return date >= dateRange.viewStart && date <= dateRange.viewEnd;
  };

  const isSameDayAs = (date1: Date, date2: Date) => {
    return isSameDay(date1, date2);
  };

  const getDateFromString = (dateString: string) => {
    return parseISO(dateString);
  };

  return {
    // State
    currentDate,
    view,
    dateRange,
    
    // Navigation
    goToToday,
    goToPrevious,
    goToNext,
    goToDate,
    setView,
    
    // Calendar data
    calendarDays,
    weekDays,
    timeSlots,
    
    // Formatters
    formatters,
    
    // Utilities
    isDateInCurrentView,
    isSameDayAs,
    getDateFromString,
    isToday: (date: Date) => isToday(date),
  };
};