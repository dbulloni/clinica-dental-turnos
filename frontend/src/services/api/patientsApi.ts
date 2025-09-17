import { 
  ApiResponse, 
  Patient, 
  CreatePatientData, 
  PaginatedResponse, 
  PatientFilters,
  PaginationParams,
  Appointment
} from '../../types';
import { api, buildQueryString } from './client';

export const patientsApi = {
  /**
   * Obtener lista de pacientes con paginación y filtros
   */
  async getPatients(
    filters: PatientFilters & PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/patients?${queryString}`);
    return response.data;
  },

  /**
   * Obtener un paciente por ID
   */
  async getPatient(id: string): Promise<ApiResponse<Patient>> {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo paciente
   */
  async createPatient(patientData: CreatePatientData): Promise<ApiResponse<Patient>> {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  /**
   * Actualizar un paciente existente
   */
  async updatePatient(id: string, patientData: Partial<CreatePatientData>): Promise<ApiResponse<Patient>> {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  /**
   * Eliminar un paciente (soft delete)
   */
  async deletePatient(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  /**
   * Buscar pacientes en tiempo real
   */
  async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * Obtener historial de turnos de un paciente
   */
  async getPatientAppointments(
    patientId: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const queryString = buildQueryString(params);
    const response = await api.get(`/patients/${patientId}/appointments?${queryString}`);
    return response.data;
  },

  /**
   * Verificar si existe un paciente con el mismo documento o teléfono
   */
  async checkDuplicate(document: string, phone: string, excludeId?: string): Promise<ApiResponse<{
    documentExists: boolean;
    phoneExists: boolean;
  }>> {
    const params = new URLSearchParams({
      document,
      phone,
      ...(excludeId && { excludeId }),
    });
    const response = await api.get(`/patients/check-duplicate?${params}`);
    return response.data;
  },

  /**
   * Activar/desactivar un paciente
   */
  async togglePatientStatus(id: string, isActive: boolean): Promise<ApiResponse<Patient>> {
    const response = await api.patch(`/patients/${id}/status`, { isActive });
    return response.data;
  },

  /**
   * Exportar pacientes a CSV
   */
  async exportPatients(filters: PatientFilters = {}): Promise<Blob> {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/patients/export?${queryString}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importar pacientes desde CSV
   */
  async importPatients(file: File): Promise<ApiResponse<{
    imported: number;
    errors: Array<{ row: number; message: string }>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/patients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};