import { ApiResponse, LoginCredentials, AuthResponse, User } from '../../types';
import { apiClient } from './client';

export const authApi = {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Refrescar token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Validar token actual
   */
  async validateToken(): Promise<ApiResponse<{ user: User; valid: boolean }>> {
    const response = await apiClient.get('/auth/validate');
    return response.data;
  },

  /**
   * Obtener perfil del usuario
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<ApiResponse<User>> {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return response.data;
  },

  /**
   * Registrar nuevo usuario (solo admin)
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'SECRETARY';
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
};