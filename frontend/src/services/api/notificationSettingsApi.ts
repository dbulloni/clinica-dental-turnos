import { apiClient } from './client';
import { NotificationSettings } from '../../hooks/useNotificationSettings';

export interface SettingsResponse {
  data: NotificationSettings;
  message: string;
}

export const notificationSettingsApi = {
  // Get notification settings
  getSettings: (): Promise<SettingsResponse> => {
    return apiClient.get('/api/notification-settings');
  },

  // Update notification settings
  updateSettings: (settings: Partial<NotificationSettings>): Promise<SettingsResponse> => {
    return apiClient.put('/api/notification-settings', settings);
  },

  // Test WhatsApp connection
  testWhatsAppConnection: (config: {
    token: string;
    phoneNumber: string;
    apiUrl: string;
  }): Promise<{
    data: { success: boolean; message: string };
  }> => {
    return apiClient.post('/api/notification-settings/test-whatsapp', config);
  },

  // Test Email connection
  testEmailConnection: (config: {
    provider: string;
    host: string;
    port: number;
    user: string;
    password: string;
    fromAddress: string;
  }): Promise<{
    data: { success: boolean; message: string };
  }> => {
    return apiClient.post('/api/notification-settings/test-email', config);
  },

  // Reset to defaults
  resetToDefaults: (): Promise<SettingsResponse> => {
    return apiClient.post('/api/notification-settings/reset');
  },

  // Export settings
  exportSettings: (): Promise<Blob> => {
    return apiClient.get('/api/notification-settings/export', {
      responseType: 'blob',
    });
  },

  // Import settings
  importSettings: (settingsFile: File): Promise<SettingsResponse> => {
    const formData = new FormData();
    formData.append('settings', settingsFile);
    
    return apiClient.post('/api/notification-settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get health status
  getHealthStatus: (): Promise<{
    data: any;
    message: string;
  }> => {
    return apiClient.get('/api/notification-settings/health');
  },

  // Run health check
  runHealthCheck: (): Promise<{
    data: any;
    message: string;
  }> => {
    return apiClient.post('/api/notification-settings/health-check');
  },

  // Get logs
  getLogs: (filters: any): Promise<{
    data: any[];
    message: string;
  }> => {
    return apiClient.get('/api/notification-settings/logs', { params: filters });
  },

  // Clear logs
  clearLogs: (filters: any): Promise<{ message: string }> => {
    return apiClient.delete('/api/notification-settings/logs', { params: filters });
  },

  // Export logs
  exportLogs: (filters: any): Promise<Blob> => {
    return apiClient.get('/api/notification-settings/logs/export', {
      params: filters,
      responseType: 'blob',
    });
  },
};