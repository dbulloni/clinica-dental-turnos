import { 
  ApiResponse, 
  TreatmentType, 
  CreateTreatmentTypeData, 
  PaginatedResponse, 
  TreatmentTypeFilters,
  PaginationParams
} from '../../types';
import { api, buildQueryString } from './client';

export const treatmentTypesApi = {
  /**
   * Obtener lista de tipos de tratamiento con paginación y filtros
   */
  async getTreatmentTypes(
    filters: TreatmentTypeFilters & PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<TreatmentType>>> {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/treatment-types?${queryString}`);
    return response.data;
  },

  /**
   * Obtener un tipo de tratamiento por ID
   */
  async getTreatmentType(id: string): Promise<ApiResponse<TreatmentType>> {
    const response = await api.get(`/treatment-types/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo tipo de tratamiento
   */
  async createTreatmentType(treatmentTypeData: CreateTreatmentTypeData): Promise<ApiResponse<TreatmentType>> {
    const response = await api.post('/treatment-types', treatmentTypeData);
    return response.data;
  },

  /**
   * Actualizar un tipo de tratamiento existente
   */
  async updateTreatmentType(id: string, treatmentTypeData: Partial<CreateTreatmentTypeData>): Promise<ApiResponse<TreatmentType>> {
    const response = await api.put(`/treatment-types/${id}`, treatmentTypeData);
    return response.data;
  },

  /**
   * Eliminar un tipo de tratamiento
   */
  async deleteTreatmentType(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/treatment-types/${id}`);
    return response.data;
  },

  /**
   * Obtener tipos de tratamiento activos (simplificado)
   */
  async getActiveTreatmentTypes(): Promise<ApiResponse<TreatmentType[]>> {
    const response = await api.get('/treatment-types?isActive=true&limit=100');
    return response.data;
  },

  /**
   * Obtener tipos de tratamiento por profesional
   */
  async getTreatmentTypesByProfessional(professionalId: string): Promise<ApiResponse<TreatmentType[]>> {
    const response = await api.get(`/treatment-types?professionalId=${professionalId}`);
    return response.data;
  },

  /**
   * Obtener estadísticas de tipos de tratamiento
   */
  async getTreatmentTypeStats(
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    totalTreatmentTypes: number;
    activeTreatmentTypes: number;
    mostPopular: Array<{ 
      treatmentTypeId: string; 
      name: string; 
      count: number; 
      percentage: number;
    }>;
    averageDuration: number;
    totalRevenue?: number;
  }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/treatment-types/stats?${params}`);
    return response.data;
  },
};