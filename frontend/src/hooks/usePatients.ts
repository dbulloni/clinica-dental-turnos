import { useQuery, useMutation, useQueryClient } from 'react-query';
import { patientsApi } from '../services/api/patientsApi';
import { Patient, CreatePatientData, PatientFilters, PaginationParams } from '../types';
import { useErrorHandler } from './useErrorHandler';
import toast from 'react-hot-toast';

// Query keys
export const PATIENTS_QUERY_KEYS = {
  all: ['patients'] as const,
  lists: () => [...PATIENTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: PatientFilters & PaginationParams) => 
    [...PATIENTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PATIENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PATIENTS_QUERY_KEYS.details(), id] as const,
  search: (query: string) => [...PATIENTS_QUERY_KEYS.all, 'search', query] as const,
  appointments: (patientId: string, params: PaginationParams) => 
    [...PATIENTS_QUERY_KEYS.detail(patientId), 'appointments', params] as const,
};

/**
 * Hook para obtener lista de pacientes con paginación y filtros
 */
export const usePatients = (filters: PatientFilters & PaginationParams = {}) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PATIENTS_QUERY_KEYS.list(filters),
    () => patientsApi.getPatients(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => handleApiError(error, 'Error al cargar pacientes'),
    }
  );
};

/**
 * Hook para obtener un paciente específico
 */
export const usePatient = (id: string, enabled = true) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PATIENTS_QUERY_KEYS.detail(id),
    () => patientsApi.getPatient(id),
    {
      enabled: enabled && !!id,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleApiError(error, 'Error al cargar paciente'),
    }
  );
};

/**
 * Hook para búsqueda en tiempo real de pacientes
 */
export const usePatientSearch = (query: string, enabled = true) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PATIENTS_QUERY_KEYS.search(query),
    () => patientsApi.searchPatients(query),
    {
      enabled: enabled && query.length >= 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => handleApiError(error, 'Error en la búsqueda'),
    }
  );
};

/**
 * Hook para obtener historial de turnos de un paciente
 */
export const usePatientAppointments = (patientId: string, params: PaginationParams = {}) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PATIENTS_QUERY_KEYS.appointments(patientId, params),
    () => patientsApi.getPatientAppointments(patientId, params),
    {
      enabled: !!patientId,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleApiError(error, 'Error al cargar historial de turnos'),
    }
  );
};

/**
 * Hook para crear un nuevo paciente
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (patientData: CreatePatientData) => patientsApi.createPatient(patientData),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Paciente creado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.lists());
        }
      },
      onError: (error) => handleApiError(error, 'Error al crear paciente'),
    }
  );
};

/**
 * Hook para actualizar un paciente
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreatePatientData> }) =>
      patientsApi.updatePatient(id, data),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Paciente actualizado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.lists());
        }
      },
      onError: (error) => handleApiError(error, 'Error al actualizar paciente'),
    }
  );
};

/**
 * Hook para eliminar un paciente
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (id: string) => patientsApi.deletePatient(id),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Paciente eliminado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.lists());
        }
      },
      onError: (error) => handleApiError(error, 'Error al eliminar paciente'),
    }
  );
};

/**
 * Hook para verificar duplicados
 */
export const useCheckPatientDuplicate = () => {
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ document, phone, excludeId }: { document: string; phone: string; excludeId?: string }) =>
      patientsApi.checkDuplicate(document, phone, excludeId),
    {
      onError: (error) => handleApiError(error, 'Error al verificar duplicados'),
    }
  );
};

/**
 * Hook para cambiar el estado de un paciente
 */
export const useTogglePatientStatus = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      patientsApi.togglePatientStatus(id, isActive),
    {
      onSuccess: (response, { id, isActive }) => {
        if (response.success) {
          toast.success(`Paciente ${isActive ? 'activado' : 'desactivado'} exitosamente`);
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(PATIENTS_QUERY_KEYS.lists());
        }
      },
      onError: (error) => handleApiError(error, 'Error al cambiar estado del paciente'),
    }
  );
};