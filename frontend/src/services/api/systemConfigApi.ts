import { apiClient } from './client';
import { SystemConfig } from '../../hooks/useSystemConfig';

export interface SystemConfigResponse {
  data: SystemConfig;
  message: string;
}

export interface TestConnectionResponse {
  data: {
    success: boolean;
    message: string;
  };
}

export const systemConfigApi = {
  // Get system configuration
  getConfig: (): Promise<SystemConfigResponse> => {
    return apiClient.get('/api/config/system');
  },

  // Update system configuration
  updateConfig: (config: Partial<SystemConfig>): Promise<SystemConfigResponse> => {
    return apiClient.put('/api/config/system', config);
  },

  // Test WhatsApp connection
  testWhatsApp: (whatsappConfig: {
    token: string;
    phone: string;
  }): Promise<TestConnectionResponse> => {
    return apiClient.post('/api/config/test-whatsapp', whatsappConfig);
  },

  // Test email connection
  testEmail: (emailConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
  }): Promise<TestConnectionResponse> => {
    return apiClient.post('/api/config/test-email', emailConfig);
  },

  // Get working hours
  getWorkingHours: (): Promise<{
    data: SystemConfig['workingHours'];
  }> => {
    return apiClient.get('/api/config/working-hours');
  },

  // Update working hours
  updateWorkingHours: (workingHours: SystemConfig['workingHours']): Promise<{
    data: SystemConfig['workingHours'];
    message: string;
  }> => {
    return apiClient.put('/api/config/working-hours', { workingHours });
  },

  // Get notification settings
  getNotificationSettings: (): Promise<{
    data: {
      whatsappEnabled: boolean;
      emailEnabled: boolean;
      reminderHours: number;
    };
  }> => {
    return apiClient.get('/api/config/notifications');
  },

  // Update notification settings
  updateNotificationSettings: (settings: {
    whatsappEnabled?: boolean;
    emailEnabled?: boolean;
    reminderHours?: number;
    whatsappToken?: string;
    whatsappPhone?: string;
    emailHost?: string;
    emailPort?: number;
    emailUser?: string;
    emailPassword?: string;
    emailFrom?: string;
  }): Promise<{
    data: any;
    message: string;
  }> => {
    return apiClient.put('/api/config/notifications', settings);
  },

  // Get security settings
  getSecuritySettings: (): Promise<{
    data: {
      sessionTimeout: number;
      maxLoginAttempts: number;
      passwordMinLength: number;
      requirePasswordChange: boolean;
    };
  }> => {
    return apiClient.get('/api/config/security');
  },

  // Update security settings
  updateSecuritySettings: (settings: {
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    passwordMinLength?: number;
    requirePasswordChange?: boolean;
  }): Promise<{
    data: any;
    message: string;
  }> => {
    return apiClient.put('/api/config/security', settings);
  },

  // Reset configuration to defaults
  resetToDefaults: (): Promise<SystemConfigResponse> => {
    return apiClient.post('/api/config/reset');
  },

  // Export configuration
  exportConfig: (): Promise<Blob> => {
    return apiClient.get('/api/config/export', {
      responseType: 'blob',
    });
  },

  // Import configuration
  importConfig: (configFile: File): Promise<SystemConfigResponse> => {
    const formData = new FormData();
    formData.append('config', configFile);
    
    return apiClient.post('/api/config/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};