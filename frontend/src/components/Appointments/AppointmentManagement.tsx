import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  Search,
  Clock,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import AppointmentList from './AppointmentList';
import AppointmentForm from './AppointmentForm';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import RescheduleModal from './RescheduleModal';
import AppointmentAdvancedFilters from './AppointmentAdvancedFilters';
import AppointmentConfirmationModal from './AppointmentConfirmationModal';
import AppointmentNotifications from './AppointmentNotifications';
import { 
  useAppointments, 
  useAppointmentStats,
  useTodayAppointments 
} from '../../hooks/useAppointments';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Appointment, 
  AppointmentFilters, 
  Professional, 
  TreatmentType,
  APPOINTMENT_STATUSES 
} from '../../types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface AppointmentManagementProps {
  professionals: Professional[];
  treatmentTypes: TreatmentType[];
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  professionals,
  treatmentTypes,
}) => {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'cancel' | 'delete' | 'confirm' | 'complete' | 'no-show'>('cancel');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: undefined,
    professionalId: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick filter states
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'pending'>('all');

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query parameters based on quick filter
  const getQueryParams = () => {
    const baseParams = {
      page: 1,
      limit: 20,
      sortBy: 'startTime',
      sortOrder: 'desc' as const,
      ...filters,
      ...(debouncedSearch && { search: debouncedSearch }),
    };

    const today = new Date();
    
    switch (quickFilter) {
      case 'today':
        return {
          ...baseParams,
          startDate: format(startOfDay(today), 'yyyy-MM-dd'),
          endDate: format(endOfDay(today), 'yyyy-MM-dd'),
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return {
          ...baseParams,
          startDate: format(startOfDay(weekStart), 'yyyy-MM-dd'),
          endDate: format(endOfDay(weekEnd), 'yyyy-MM-dd'),
        };
      case 'pending':
        return {
          ...baseParams,
          status: 'SCHEDULED' as const,
        };
      default:
        return baseParams;
    }
  };

  const queryParams = getQueryParams();
  const { data: appointmentsData, isLoading, refetch } = useAppointments(queryParams);
  const { data: todayAppointmentsData } = useTodayAppointments();
  const { data: statsData } = useAppointmentStats();

  const appointments = appointmentsData?.data?.data || [];
  const todayAppointments = todayAppointmentsData?.data || [];
  const stats = statsData?.data;

  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setShowCreateModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleAppointmentSuccess = (appointment: Appointment, action?: string) => {
    refetch();
    
    // Use enhanced notifications
    switch (action) {
      case 'created':
        AppointmentNotifications.appointmentCreated(appointment);
        break;
      case 'updated':
        AppointmentNotifications.appointmentUpdated(appointment);
        break;
      case 'confirmed':
        AppointmentNotifications.appointmentConfirmed(appointment);
        break;
      case 'cancelled':
        AppointmentNotifications.appointmentCancelled(appointment);
        break;
      case 'completed':
        AppointmentNotifications.appointmentCompleted(appointment);
        break;
      case 'rescheduled':
        AppointmentNotifications.appointmentRescheduled(
          appointment, 
          appointment.startTime, 
          appointment.startTime
        );
        break;
      default:
        toast.success('Turno gestionado exitosamente');
    }
  };

  const handleConfirmationAction = (appointment: Appointment, action: typeof confirmationAction) => {
    setSelectedAppointment(appointment);
    setConfirmationAction(action);
    setShowConfirmationModal(true);
  };

  const handleConfirmationSubmit = async (data: any) => {
    if (!selectedAppointment) return;

    try {
      // Handle different confirmation actions here
      // This would typically call the appropriate API endpoints
      console.log('Confirmation action:', confirmationAction, 'Data:', data);
      
      handleAppointmentSuccess(selectedAppointment, confirmationAction);
      setShowConfirmationModal(false);
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: undefined,
      professionalId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setQuickFilter('all');
  };

  const hasActiveFilters = searchQuery || 
    filters.status || 
    filters.professionalId || 
    filters.startDate || 
    filters.endDate ||
    quickFilter !== 'all';

  const getQuickFilterCount = (filter: string) => {
    switch (filter) {
      case 'today':
        return todayAppointments.length;
      case 'pending':
        return stats?.appointmentStats.scheduled || 0;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">
            Administra y programa los turnos de los pacientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            icon={<RefreshCw className="w-4 h-4" />}
            loading={isLoading}
          >
            Actualizar
          </Button>
          
          <Button
            variant="primary"
            onClick={handleCreateAppointment}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayAppointments.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.appointmentStats.scheduled}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.appointmentStats.confirmed}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.appointmentStats.completed}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Quick Filters */}
      <Card>
        <Card.Body>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por paciente, profesional o tratamiento..."
                  startIcon={<Search className="w-4 h-4" />}
                />
              </div>
              
              <Button
                variant="secondary"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                icon={<Filter className="w-4 h-4" />}
              >
                Filtros
              </Button>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todos', count: null },
                { key: 'today', label: 'Hoy', count: getQuickFilterCount('today') },
                { key: 'week', label: 'Esta Semana', count: null },
                { key: 'pending', label: 'Pendientes', count: getQuickFilterCount('pending') },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={quickFilter === filter.key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setQuickFilter(filter.key as any)}
                  className="relative"
                >
                  {filter.label}
                  {filter.count !== null && filter.count > 0 && (
                    <Badge 
                      variant="danger" 
                      size="sm" 
                      className="ml-2 px-1.5 py-0.5 text-xs"
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      status: value === 'all' ? undefined : value as any,
                    });
                  }}
                  className="input"
                >
                  <option value="all">Todos los estados</option>
                  {Object.entries(APPOINTMENT_STATUSES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <select
                  value={filters.professionalId || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      professionalId: value === 'all' ? undefined : value,
                    });
                  }}
                  className="input"
                >
                  <option value="all">Todos los profesionales</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      Dr. {professional.firstName} {professional.lastName}
                    </option>
                  ))}
                </select>

                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                  placeholder="Fecha desde"
                />

                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                  placeholder="Fecha hasta"
                />
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Appointments List */}
      <AppointmentList
        onViewAppointment={handleViewAppointment}
        onEditAppointment={handleEditAppointment}
        onRescheduleAppointment={handleRescheduleAppointment}
        professionals={professionals}
      />

      {/* Modals */}
      <AppointmentForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        professionals={professionals}
        treatmentTypes={treatmentTypes}
        onSuccess={handleAppointmentSuccess}
      />

      <AppointmentForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointment={selectedAppointment}
        professionals={professionals}
        treatmentTypes={treatmentTypes}
        onSuccess={handleAppointmentSuccess}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        onEdit={handleEditAppointment}
        onReschedule={handleRescheduleAppointment}
      />

      <RescheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        appointment={selectedAppointment}
        onSuccess={handleAppointmentSuccess}
      />

      <AppointmentConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmationSubmit}
        appointment={selectedAppointment}
        action={confirmationAction}
      />
    </div>
  );
};

export default AppointmentManagement;