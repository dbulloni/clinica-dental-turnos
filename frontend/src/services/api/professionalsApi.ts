import { 
  ApiResponse, 
  Professional, 
  CreateProfessionalData, 
  PaginatedResponse, 
  ProfessionalFilters,
  PaginationParams
} from '../../types';
import { api, buildQueryString } from './client';

export const professionalsApi = {
  /**
   * Obtener lista de profesionales con paginación y filtros
   */
  async getProfessionals(
    filters: ProfessionalFilters & PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Professional>>> {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/professionals?${queryString}`);
    return response.data;
  },

  /**
   * Obtener un profesional por ID
   */
  async getProfessional(id: string): Promise<ApiResponse<Professional>> {
    const response = await api.get(`/professionals/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo profesional
   */
  async createProfessional(professionalData: CreateProfessionalData): Promise<ApiResponse<Professional>> {
    const response = await api.post('/professionals', professionalData);
    return response.data;
  },

  /**
   * Actualizar un profesional existente
   */
  async updateProfessional(id: string, professionalData: Partial<CreateProfessionalData>): Promise<ApiResponse<Professional>> {
    const response = await api.put(`/professionals/${id}`, professionalData);
    return response.data;
  },

  /**
   * Eliminar un profesional
   */
  async deleteProfessional(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/professionals/${id}`);
    return response.data;
  },

  /**
   * Obtener horarios de trabajo de un profesional
   */
  async getProfessionalSchedule(id: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/professionals/${id}/schedule`);
    return response.data;
  },

  /**
   * Actualizar horarios de trabajo de un profesional
   */
  async updateProfessionalSchedule(id: string, schedule: any[]): Promise<ApiResponse<any[]>> {
    const response = await api.put(`/professionals/${id}/schedule`, { schedule });
    return response.data;
  },

  /**
   * Obtener estadísticas de un profesional
   */
  async getProfessionalStats(
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating?: number;
    topTreatments: Array<{ treatmentType: string; count: number }>;
  }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/professionals/${id}/stats?${params}`);
    return response.data;
  },

  /**
   * Obtener profesionales activos (simplificado)
   */
  async getActiveProfessionals(): Promise<ApiResponse<Professional[]>> {
    const response = await api.get('/professionals?isActive=true&limit=100');
    return response.data;
  },
};