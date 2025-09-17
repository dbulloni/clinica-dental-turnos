import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Filter, 
  RefreshCw,
  Users,
  Clock
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import CalendarView from '../components/Calendar/CalendarView';
import AppointmentForm from '../components/Appointments/AppointmentForm';
import { useAppointmentsByDateRange } from '../hooks/useAppointments';
import { useQuery } from 'react-query';
import { api } from '../services/api/client';
import { Appointment, AppointmentFilters, Professional, TreatmentType } from '../types';

const AppointmentsPage: React.FC = () => {
  // State management
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: undefined,
    professionalId: undefined,
  });
  
  // Modal states
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const [initialTime, setInitialTime] = useState<string | undefined>();

  // Fetch appointments for calendar
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch } = useAppointmentsByDateRange(
    dateRange.start,
    dateRange.end,
    filters,
    !!(dateRange.start && dateRange.end)
  );

  // Fetch professionals and treatment types
  const { data: professionalsData } = useQuery(
    'professionals',
    () => api.get('/professionals').then(res => res.data),
    { staleTime: 10 * 60 * 1000 }
  );

  const { data: treatmentTypesData } = useQuery(
    'treatmentTypes',
    () => api.get('/treatment-types').then(res => res.data),
    { staleTime: 10 * 60 * 1000 }
  );

  const appointments = appointmentsData?.data || [];
  const professionals: Professional[] = professionalsData?.data || [];
  const treatmentTypes: TreatmentType[] = treatmentTypesData?.data || [];

  // Event handlers
  const handleNewAppointment = (date?: Date, time?: string) => {
    setSelectedAppointment(null);
    setInitialDate(date);
    setInitialTime(time);
    setAppointmentFormOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setInitialDate(undefined);
    setInitialTime(undefined);
    setAppointmentFormOpen(true);
  };

  const handleAppointmentFormSuccess = () => {
    refetch();
    setAppointmentFormOpen(false);
    setSelectedAppointment(null);
    setInitialDate(undefined);
    setInitialTime(undefined);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleFilterChange = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      professionalId: undefined,
    });
  };

  const hasActiveFilters = filters.status || filters.professionalId;

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const byStatus = appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      scheduled: byStatus.SCHEDULED || 0,
      confirmed: byStatus.CONFIRMED || 0,
      cancelled: byStatus.CANCELLED || 0,
      completed: byStatus.COMPLETED || 0,
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Turnos</h1>
          <p className="text-gray-600">
            Gestiona los turnos y citas de los pacientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
            loading={appointmentsLoading}
          >
            Actualizar
          </Button>
          
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleNewAppointment()}
          >
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <Card.Body className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <div className="text-sm text-gray-600">Programados</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmados</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelados</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completados</div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <select
                value={filters.status || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    status: value === 'all' ? undefined : value as any,
                  });
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los estados</option>
                <option value="SCHEDULED">Programados</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="COMPLETED">Completados</option>
                <option value="NO_SHOW">No se presentó</option>
              </select>

              <select
                value={filters.professionalId || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    professionalId: value === 'all' ? undefined : value,
                  });
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los profesionales</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    Dr. {professional.firstName} {professional.lastName}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {appointments.length} {appointments.length === 1 ? 'turno' : 'turnos'}
                </span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Calendar */}
      <CalendarView
        appointments={appointments}
        loading={appointmentsLoading}
        onAppointmentClick={handleEditAppointment}
        onSlotClick={handleNewAppointment}
        onDateRangeChange={handleDateRangeChange}
        filters={filters}
      />

      {/* Appointment Form Modal */}
      <AppointmentForm
        isOpen={appointmentFormOpen}
        onClose={() => {
          setAppointmentFormOpen(false);
          setSelectedAppointment(null);
          setInitialDate(undefined);
          setInitialTime(undefined);
        }}
        appointment={selectedAppointment}
        initialDate={initialDate}
        initialTime={initialTime}
        professionals={professionals}
        treatmentTypes={treatmentTypes}
        onSuccess={handleAppointmentFormSuccess}
      />
    </div>
  );
};

export default AppointmentsPage;