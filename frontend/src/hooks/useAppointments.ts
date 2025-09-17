import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appointmentsApi } from '../services/api/appointmentsApi';
import { Appointment, CreateAppointmentData, AppointmentFilters, PaginationParams } from '../types';
import { useErrorHandler } from './useErrorHandler';
import toast from 'react-hot-toast';

// Query keys
export const APPOINTMENTS_QUERY_KEYS = {
  all: ['appointments'] as const,
  lists: () => [...APPOINTMENTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: AppointmentFilters & PaginationParams) => 
    [...APPOINTMENTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...APPOINTMENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...APPOINTMENTS_QUERY_KEYS.details(), id] as const,
  calendar: (startDate: string, endDate: string, filters?: AppointmentFilters) => 
    [...APPOINTMENTS_QUERY_KEYS.all, 'calendar', startDate, endDate, filters] as const,
  availableSlots: (date: string, professionalId: string, treatmentTypeId?: string) => 
    [...APPOINTMENTS_QUERY_KEYS.all, 'slots', date, professionalId, treatmentTypeId] as const,
  today: () => [...APPOINTMENTS_QUERY_KEYS.all, 'today'] as const,
  upcoming: (limit: number) => [...APPOINTMENTS_QUERY_KEYS.all, 'upcoming', limit] as const,
  stats: (startDate?: string, endDate?: string) => 
    [...APPOINTMENTS_QUERY_KEYS.all, 'stats', startDate, endDate] as const,
};

/**
 * Hook para obtener lista de turnos con paginación y filtros
 */
export const useAppointments = (filters: AppointmentFilters & PaginationParams = {}) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.list(filters),
    () => appointmentsApi.getAppointments(filters),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => handleApiError(error, 'Error al cargar turnos'),
    }
  );
};

/**
 * Hook para obtener un turno específico
 */
export const useAppointment = (id: string, enabled = true) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.detail(id),
    () => appointmentsApi.getAppointment(id),
    {
      enabled: enabled && !!id,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleApiError(error, 'Error al cargar turno'),
    }
  );
};

/**
 * Hook para obtener turnos por rango de fechas (calendario)
 */
export const useAppointmentsByDateRange = (
  startDate: string,
  endDate: string,
  filters: Omit<AppointmentFilters, 'startDate' | 'endDate'> = {},
  enabled = true
) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.calendar(startDate, endDate, filters),
    () => appointmentsApi.getAppointmentsByDateRange(startDate, endDate, filters),
    {
      enabled: enabled && !!startDate && !!endDate,
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => handleApiError(error, 'Error al cargar calendario'),
    }
  );
};

/**
 * Hook para obtener slots disponibles
 */
export const useAvailableSlots = (
  date: string,
  professionalId: string,
  treatmentTypeId?: string,
  enabled = true
) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.availableSlots(date, professionalId, treatmentTypeId),
    () => appointmentsApi.getAvailableSlots(date, professionalId, treatmentTypeId),
    {
      enabled: enabled && !!date && !!professionalId,
      staleTime: 30 * 1000, // 30 seconds
      onError: (error) => handleApiError(error, 'Error al cargar horarios disponibles'),
    }
  );
};

/**
 * Hook para obtener turnos de hoy
 */
export const useTodayAppointments = () => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.today(),
    () => appointmentsApi.getTodayAppointments(),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      onError: (error) => handleApiError(error, 'Error al cargar turnos de hoy'),
    }
  );
};

/**
 * Hook para obtener próximos turnos
 */
export const useUpcomingAppointments = (limit = 10) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.upcoming(limit),
    () => appointmentsApi.getUpcomingAppointments(limit),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => handleApiError(error, 'Error al cargar próximos turnos'),
    }
  );
};

/**
 * Hook para obtener estadísticas de turnos
 */
export const useAppointmentStats = (startDate?: string, endDate?: string) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    APPOINTMENTS_QUERY_KEYS.stats(startDate, endDate),
    () => appointmentsApi.getAppointmentStats(startDate, endDate),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => handleApiError(error, 'Error al cargar estadísticas'),
    }
  );
};

/**
 * Hook para crear un nuevo turno
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (appointmentData: CreateAppointmentData) => appointmentsApi.createAppointment(appointmentData),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Turno creado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al crear turno'),
    }
  );
};

/**
 * Hook para actualizar un turno
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateAppointmentData> }) =>
      appointmentsApi.updateAppointment(id, data),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Turno actualizado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al actualizar turno'),
    }
  );
};

/**
 * Hook para eliminar un turno
 */
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (id: string) => appointmentsApi.deleteAppointment(id),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Turno eliminado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al eliminar turno'),
    }
  );
};

/**
 * Hook para cambiar estado de un turno
 */
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateAppointmentStatus(id, status),
    {
      onSuccess: (response, { id, status }) => {
        if (response.success) {
          const statusMessages = {
            CONFIRMED: 'Turno confirmado',
            CANCELLED: 'Turno cancelado',
            COMPLETED: 'Turno completado',
            NO_SHOW: 'Marcado como no se presentó',
          };
          toast.success(statusMessages[status as keyof typeof statusMessages] || 'Estado actualizado');
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al actualizar estado del turno'),
    }
  );
};

/**
 * Hook para verificar disponibilidad de slot
 */
export const useCheckSlotAvailability = () => {
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ startTime, endTime, professionalId, excludeAppointmentId }: {
      startTime: string;
      endTime: string;
      professionalId: string;
      excludeAppointmentId?: string;
    }) => appointmentsApi.checkSlotAvailability(startTime, endTime, professionalId, excludeAppointmentId),
    {
      onError: (error) => handleApiError(error, 'Error al verificar disponibilidad'),
    }
  );
};

/**
 * Hook para confirmar un turno
 */
export const useConfirmAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (id: string) => appointmentsApi.confirmAppointment(id),
    {
      onSuccess: (response, id) => {
        if (response.success) {
          toast.success('Turno confirmado exitosamente');
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al confirmar turno'),
    }
  );
};

/**
 * Hook para cancelar un turno
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, reason }: { id: string; reason?: string }) => 
      appointmentsApi.cancelAppointment(id, reason),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Turno cancelado exitosamente');
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al cancelar turno'),
    }
  );
};

/**
 * Hook para reprogramar un turno
 */
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, newStartTime, newEndTime }: {
      id: string;
      newStartTime: string;
      newEndTime: string;
    }) => appointmentsApi.rescheduleAppointment(id, newStartTime, newEndTime),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Turno reprogramado exitosamente');
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(APPOINTMENTS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al reprogramar turno'),
    }
  );
};