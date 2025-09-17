import { useQuery, useMutation, useQueryClient } from 'react-query';
import { professionalsApi } from '../services/api/professionalsApi';
import { Professional, CreateProfessionalData, ProfessionalFilters, PaginationParams } from '../types';
import { useErrorHandler } from './useErrorHandler';
import toast from 'react-hot-toast';

// Query keys
export const PROFESSIONALS_QUERY_KEYS = {
  all: ['professionals'] as const,
  lists: () => [...PROFESSIONALS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ProfessionalFilters & PaginationParams) => 
    [...PROFESSIONALS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PROFESSIONALS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROFESSIONALS_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook para obtener lista de profesionales con paginación y filtros
 */
export const useProfessionals = (filters: ProfessionalFilters & PaginationParams = {}) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PROFESSIONALS_QUERY_KEYS.list(filters),
    () => professionalsApi.getProfessionals(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => handleApiError(error, 'Error al cargar profesionales'),
    }
  );
};

/**
 * Hook para obtener un profesional específico
 */
export const useProfessional = (id: string, enabled = true) => {
  const { handleApiError } = useErrorHandler();

  return useQuery(
    PROFESSIONALS_QUERY_KEYS.detail(id),
    () => professionalsApi.getProfessional(id),
    {
      enabled: enabled && !!id,
      staleTime: 5 * 60 * 1000,
      onError: (error) => handleApiError(error, 'Error al cargar profesional'),
    }
  );
};

/**
 * Hook para crear un nuevo profesional
 */
export const useCreateProfessional = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (professionalData: CreateProfessionalData) => professionalsApi.createProfessional(professionalData),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Profesional creado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al crear profesional'),
    }
  );
};

/**
 * Hook para actualizar un profesional
 */
export const useUpdateProfessional = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateProfessionalData> }) =>
      professionalsApi.updateProfessional(id, data),
    {
      onSuccess: (response, { id }) => {
        if (response.success) {
          toast.success('Profesional actualizado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al actualizar profesional'),
    }
  );
};

/**
 * Hook para eliminar un profesional
 */
export const useDeleteProfessional = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    (id: string) => professionalsApi.deleteProfessional(id),
    {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Profesional eliminado exitosamente');
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al eliminar profesional'),
    }
  );
};

/**
 * Hook para activar/desactivar un profesional
 */
export const useToggleProfessionalStatus = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      professionalsApi.updateProfessional(id, { isActive }),
    {
      onSuccess: (response, { id, isActive }) => {
        if (response.success) {
          toast.success(`Profesional ${isActive ? 'activado' : 'desactivado'} exitosamente`);
          // Invalidar queries relacionadas
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.detail(id));
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.lists());
          queryClient.invalidateQueries(PROFESSIONALS_QUERY_KEYS.all);
        }
      },
      onError: (error) => handleApiError(error, 'Error al cambiar estado del profesional'),
    }
  );
};