import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Filter,
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import Table from '../UI/Table';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import EmptyState from '../UI/EmptyState';
import { useAppointments, useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import { useDebounce } from '../../hooks/useDebounce';
import { Appointment, TableColumn, AppointmentFilters, APPOINTMENT_STATUSES } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentListProps {
  onViewAppointment?: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onRescheduleAppointment?: (appointment: Appointment) => void;
  professionals?: Array<{ id: string; firstName: string; lastName: string }>;
  className?: string;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  onViewAppointment,
  onEditAppointment,
  onRescheduleAppointment,
  professionals = [],
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: undefined,
    professionalId: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    sortBy: 'startTime',
    sortOrder: 'desc' as const,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Build query parameters
  const queryParams = {
    ...pagination,
    ...filters,
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading, refetch } = useAppointments(queryParams);
  const appointments = data?.data?.data || [];
  const paginationMeta = data?.data?.pagination;

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

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      id: appointment.id,
      status: newStatus,
    });
    refetch();
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setPagination(prev => ({
      ...prev,
      sortBy: key,
      sortOrder: direction,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: undefined,
      professionalId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = searchQuery || 
    filters.status || 
    filters.professionalId || 
    filters.startDate || 
    filters.endDate;

  const columns: TableColumn<Appointment>[] = [
    {
      key: 'startTime',
      title: 'Fecha y Hora',
      sortable: true,
      render: (_, appointment) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(appointment.startTime), 'dd/MM/yyyy')}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Clock className="w-3 h-3" />
            <span>
              {format(new Date(appointment.startTime), 'HH:mm')} - 
              {format(new Date(appointment.endTime), 'HH:mm')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      title: 'Paciente',
      render: (_, appointment) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
            <User className="w-3 h-3" />
            <span>
              {appointment.patient.firstName} {appointment.patient.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Phone className="w-3 h-3" />
            <span>{appointment.patient.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'professional',
      title: 'Profesional',
      render: (_, appointment) => (
        <div className="text-sm text-gray-900">
          Dr. {appointment.professional.firstName} {appointment.professional.lastName}
        </div>
      ),
    },
    {
      key: 'treatmentType',
      title: 'Tratamiento',
      render: (_, appointment) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {appointment.treatmentType.name}
          </div>
          <div className="text-xs text-gray-500">
            {appointment.treatmentType.duration} min
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Estado',
      render: (_, appointment) => (
        <Badge 
          variant={getStatusVariant(appointment.status)}
          dot
        >
          {APPOINTMENT_STATUSES[appointment.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '200px',
      render: (_, appointment) => {
        const canConfirm = appointment.status === 'SCHEDULED';
        const canComplete = appointment.status === 'CONFIRMED';
        const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);

        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAppointment?.(appointment)}
              className="p-1"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditAppointment?.(appointment)}
                className="p-1"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            
            {canConfirm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(appointment, 'CONFIRMED')}
                className="p-1 text-green-600 hover:text-green-700"
                title="Confirmar"
                loading={updateStatusMutation.isLoading}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            
            {canComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(appointment, 'COMPLETED')}
                className="p-1 text-blue-600 hover:text-blue-700"
                title="Completar"
                loading={updateStatusMutation.isLoading}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRescheduleAppointment?.(appointment)}
                className="p-1 text-orange-600 hover:text-orange-700"
                title="Reprogramar"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Search and Filters */}
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
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
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

              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                className="text-sm w-auto"
                placeholder="Fecha desde"
              />

              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                className="text-sm w-auto"
                placeholder="Fecha hasta"
              />

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
          </div>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card>
        <Card.Body>
          {appointments.length === 0 && !isLoading ? (
            <EmptyState
              icon={Calendar}
              title={hasActiveFilters ? "No se encontraron turnos" : "No hay turnos registrados"}
              description={
                hasActiveFilters 
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Los turnos aparecerán aquí cuando se creen."
              }
              action={
                hasActiveFilters 
                  ? {
                      label: "Limpiar filtros",
                      onClick: clearFilters,
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={appointments}
                loading={isLoading}
                emptyMessage="No se encontraron turnos"
                sortKey={pagination.sortBy}
                sortDirection={pagination.sortOrder}
                onSort={handleSort}
              />

              {/* Pagination */}
              {paginationMeta && paginationMeta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {((paginationMeta.page - 1) * paginationMeta.limit) + 1} a{' '}
                    {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} de{' '}
                    {paginationMeta.total} turnos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!paginationMeta.hasPrev}
                    >
                      Anterior
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      {paginationMeta.page} / {paginationMeta.totalPages}
                    </span>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!paginationMeta.hasNext}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AppointmentList;