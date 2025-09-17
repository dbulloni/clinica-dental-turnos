import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '../types';

interface UseErrorHandlerReturn {
  handleError: (error: any, customMessage?: string) => void;
  handleApiError: (error: ApiError, customMessage?: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const handleError = useCallback((error: any, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let message = customMessage || 'Ha ocurrido un error inesperado';
    
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }
    
    toast.error(message);
  }, []);

  const handleApiError = useCallback((error: ApiError, customMessage?: string) => {
    console.error('API Error occurred:', error);
    
    let message = customMessage || error.message || 'Ha ocurrido un error inesperado';
    
    // Handle specific error codes
    if (error.code) {
      switch (error.code) {
        case 'AUTH_001':
          message = 'Credenciales inválidas';
          break;
        case 'AUTH_002':
          message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
          break;
        case 'AUTH_003':
          message = 'No tienes permisos para realizar esta acción';
          break;
        case 'PAT_001':
          message = 'Paciente no encontrado';
          break;
        case 'PAT_002':
          message = 'Ya existe un paciente con este documento o teléfono';
          break;
        case 'APP_001':
          message = 'Conflicto de horarios. El turno se superpone con otro existente';
          break;
        case 'APP_002':
          message = 'El horario seleccionado no está disponible';
          break;
        case 'WA_001':
          message = 'Servicio de WhatsApp no disponible temporalmente';
          break;
        case 'WA_002':
          message = 'Formato de teléfono inválido para WhatsApp';
          break;
        default:
          // Use the provided message or default
          break;
      }
    }
    
    toast.error(message);
  }, []);

  return {
    handleError,
    handleApiError,
  };
};

export default useErrorHandler;