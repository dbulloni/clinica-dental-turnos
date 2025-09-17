import { 
  ApiResponse, 
  Appointment, 
  CreateAppointmentData, 
  PaginatedResponse, 
  AppointmentFilters,
  PaginationParams,
  AvailableSlot
} from '../../types';
import { api, buildQueryString } from './client';

export const appointmentsApi = {
  /**
   * Obtener lista de turnos con paginación y filtros
   */
  async getAppointments(
    filters: AppointmentFilters & PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/appointments?${queryString}`);
    return response.data;
  },

  /**
   * Obtener un turno por ID
   */
  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo turno
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<ApiResponse<Appointment>> {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  /**
   * Actualizar un turno existente
   */
  async updateAppointment(id: string, appointmentData: Partial<CreateAppointmentData>): Promise<ApiResponse<Appointment>> {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  /**
   * Eliminar un turno
   */
  async deleteAppointment(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  /**
   * Cambiar estado de un turno
   */
  async updateAppointmentStatus(id: string, status: string): Promise<ApiResponse<Appointment>> {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },

  /**
   * Obtener turnos por rango de fechas (para calendario)
   */
  async getAppointmentsByDateRange(
    startDate: string,
    endDate: string,
    filters: Omit<AppointmentFilters, 'startDate' | 'endDate'> = {}
  ): Promise<ApiResponse<Appointment[]>> {
    const queryString = buildQueryString({
      startDate,
      endDate,
      ...filters,
    });
    const response = await api.get(`/appointments/calendar?${queryString}`);
    return response.data;
  },

  /**
   * Obtener slots disponibles para una fecha y profesional
   */
  async getAvailableSlots(
    date: string,
    professionalId: string,
    treatmentTypeId?: string
  ): Promise<ApiResponse<AvailableSlot[]>> {
    const params = new URLSearchParams({
      date,
      professionalId,
      ...(treatmentTypeId && { treatmentTypeId }),
    });
    const response = await api.get(`/appointments/available-slots?${params}`);
    return response.data;
  },

  /**
   * Verificar disponibilidad de un slot específico
   */
  async checkSlotAvailability(
    startTime: string,
    endTime: string,
    professionalId: string,
    excludeAppointmentId?: string
  ): Promise<ApiResponse<{ available: boolean; conflicts?: Appointment[] }>> {
    const response = await api.post('/appointments/check-availability', {
      startTime,
      endTime,
      professionalId,
      excludeAppointmentId,
    });
    return response.data;
  },

  /**
   * Obtener turnos de hoy
   */
  async getTodayAppointments(): Promise<ApiResponse<Appointment[]>> {
    const response = await api.get('/appointments/today');
    return response.data;
  },

  /**
   * Obtener próximos turnos
   */
  async getUpcomingAppointments(limit = 10): Promise<ApiResponse<Appointment[]>> {
    const response = await api.get(`/appointments/upcoming?limit=${limit}`);
    return response.data;
  },

  /**
   * Confirmar un turno
   */
  async confirmAppointment(id: string): Promise<ApiResponse<Appointment>> {
    const response = await api.post(`/appointments/${id}/confirm`);
    return response.data;
  },

  /**
   * Cancelar un turno
   */
  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    const response = await api.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Completar un turno
   */
  async completeAppointment(id: string, observations?: string): Promise<ApiResponse<Appointment>> {
    const response = await api.post(`/appointments/${id}/complete`, { observations });
    return response.data;
  },

  /**
   * Marcar como no se presentó
   */
  async markAsNoShow(id: string): Promise<ApiResponse<Appointment>> {
    const response = await api.post(`/appointments/${id}/no-show`);
    return response.data;
  },

  /**
   * Reprogramar un turno
   */
  async rescheduleAppointment(
    id: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<ApiResponse<Appointment>> {
    const response = await api.post(`/appointments/${id}/reschedule`, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de turnos
   */
  async getAppointmentStats(
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byProfessional: Array<{ professionalId: string; name: string; count: number }>;
    byTreatmentType: Array<{ treatmentTypeId: string; name: string; count: number }>;
  }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/appointments/stats?${params}`);
    return response.data;
  },
};