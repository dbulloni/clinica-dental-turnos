import { useQuery, useMutation, useQueryClient } from 'react-query';
import { treatmentTypesApi } from '../services/api/treatmentTypesApi';
import { TreatmentType, CreateTreatmentTypeData, TreatmentTypeFilters, PaginationParams } from '../types';
import { useErrorHandler } from './useErrorHandler';
import toast from 'react-hot-toast';

// Query keys
export const TREATMENT_TYPES_QUERY_KEYS = {
  all: ['treatmentTypes'] as const,
  lists: () => [...TREATMENT_TYPES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: TreatmentTypeFilters & PaginationParams) => 
    [...TREATMENT_TYPES_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TREATMENT_TYPES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TREATMENT_TYPES_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook para obtener lista de tipos de tratamiento con paginación y filtros
 */
export const useTreatmentTypes = (filters: TreatmentTypeFilters & PaginationParams = {}) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    TREATMENT_TYPES_QUERY_KEYS.list(filters),
    () => treatmentTypesApi.getTreatmentTypes(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => handleApiError(error, 'Error al cargar tipos de tratamiento'),
    }
  );
};

/**
 * Hook para obtener un tipo de tratamiento específico
 */
export const useTreatmentType = (id: string, enabled = true) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    TREATMENT_TYPES_QUERY_KEYS.detail(id),
    () => treatmentTypesApi.getTreatmentType(id),
    {
      enabled: enabled && !!id,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleApiError(error, 'Error al cargar tipo de tratamiento'),
    }
  );
};

/**
 * Hook para crear un nuevo tipo de tratamiento
 */
export const useCreateTreatmentType = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (treatmentTypeData: CreateTreatmentTypeData) => treatmentTypesApi.createTreatmentType(treatmentTypeData),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Tipo de tratamiento creado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.lists());
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al crear tipo de tratamiento'),
    }
  );
};

/**
 * Hook para actualizar un tipo de tratamiento
 */
export const useUpdateTreatmentType = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateTreatmentTypeData> }) =>
      treatmentTypesApi.updateTreatmentType(id, data),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Tipo de tratamiento actualizado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.lists());
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al actualizar tipo de tratamiento'),
    }
  );
};

/**
 * Hook para eliminar un tipo de tratamiento
 */
export const useDeleteTreatmentType = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (id: string) => treatmentTypesApi.deleteTreatmentType(id),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Tipo de tratamiento eliminado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.lists());
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al eliminar tipo de tratamiento'),
    }
  );
};

/**
 * Hook para activar/desactivar un tipo de tratamiento
 */
export const useToggleTreatmentTypeStatus = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      treatmentTypesApi.updateTreatmentType(id, { isActive }),
    {
      onSuccess: (response, { id, isActive }) => {
        if (response.success) {
          toast.success(`Tipo de tratamiento ${isActive ? 'activado' : 'desactivado'} exitosamente`);
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.lists());
          queryClient.invalidateQueries(TREATMENT_TYPES_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al cambiar estado del tipo de tratamiento'),
    }
  );
};