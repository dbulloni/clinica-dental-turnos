import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import EmptyState from '../UI/EmptyState';
import { SkeletonTable } from '../UI/Skeleton';
import { usePatientAppointments } from '../../hooks/usePatients';
import { Patient, Appointment, APPOINTMENT_STATUSES } from '../../types';

interface PatientHistoryProps {
  patient: Patient;
  className?: string;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({
  patient,
  className,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data, isLoading, error } = usePatientAppointments(patient.id, {
    page: currentPage,
    limit: 10,
    ...(statusFilter !== 'all' && { status: statusFilter }),
  });

  const appointments = data?.data?.data || [];
  const pagination = data?.data?.pagination;

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

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Turnos
          </h3>
        </Card.Header>
        <Card.Body>
          <SkeletonTable rows={5} columns={4} />
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Turnos
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-8">
            <p className="text-red-600">Error al cargar el historial de turnos</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Turnos
          </h3>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los estados</option>
              <option value="SCHEDULED">Programados</option>
              <option value="CONFIRMED">Confirmados</option>
              <option value="COMPLETED">Completados</option>
              <option value="CANCELLED">Cancelados</option>
              <option value="NO_SHOW">No se presentó</option>
            </select>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Sin turnos registrados"
            description={
              statusFilter === 'all' 
                ? "Este paciente no tiene turnos registrados aún."
                : `No hay turnos con el estado "${APPOINTMENT_STATUSES[statusFilter as keyof typeof APPOINTMENT_STATUSES] || statusFilter}".`
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Appointments List */}
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.startTime);
                
                return (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Date and Time */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{time}</span>
                          </div>
                        </div>

                        {/* Professional and Treatment */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>
                              Dr. {appointment.professional.firstName} {appointment.professional.lastName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{appointment.treatmentType.name}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {appointment.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Notas:</strong> {appointment.notes}
                          </div>
                        )}

                        {/* Observations */}
                        {appointment.observations && (
                          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            <strong>Observaciones:</strong> {appointment.observations}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0 ml-4">
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {APPOINTMENT_STATUSES[appointment.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} turnos
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={!pagination.hasPrev}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext}
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PatientHistory;