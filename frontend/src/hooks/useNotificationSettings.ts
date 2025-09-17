import { useState, useEffect } from 'react';
import { notificationSettingsApi } from '../services/api/notificationSettingsApi';

export interface NotificationSettings {
  // WhatsApp Configuration
  whatsappEnabled: boolean;
  whatsappApiUrl: string;
  whatsappToken: string;
  whatsappPhoneNumber: string;
  whatsappWebhookUrl: string;
  
  // Email Configuration
  emailEnabled: boolean;
  emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  
  // Notification Rules
  appointmentReminderHours: number;
  maxRetryAttempts: number;
  retryIntervalMinutes: number;
  enableConfirmationRequests: boolean;
  enableCancellationNotifications: boolean;
  enableReschedulingNotifications: boolean;
  
  // Business Hours
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  
  // Advanced Settings
  enableDeliveryReports: boolean;
  enableReadReceipts: boolean;
  enableAutoResend: boolean;
  enableBulkNotifications: boolean;
  rateLimitPerMinute: number;
  enableNotificationQueue: boolean;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationSettingsApi.getSettings();
      setSettings(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settingsData: Partial<NotificationSettings>) => {
    try {
      const response = await notificationSettingsApi.updateSettings(settingsData);
      setSettings(response.data);
      return response.data;
    } catch (err) {
      throw new Error('Error al actualizar la configuración');
    }
  };

  const testWhatsAppConnection = async (config: {
    token: string;
    phoneNumber: string;
    apiUrl: string;
  }) => {
    try {
      const response = await notificationSettingsApi.testWhatsAppConnection(config);
      return response.data;
    } catch (err) {
      throw new Error('Error al probar la conexión WhatsApp');
    }
  };

  const testEmailConnection = async (config: {
    provider: string;
    host: string;
    port: number;
    user: string;
    password: string;
    fromAddress: string;
  }) => {
    try {
      const response = await notificationSettingsApi.testEmailConnection(config);
      return response.data;
    } catch (err) {
      throw new Error('Error al probar la conexión Email');
    }
  };

  const resetToDefaults = async () => {
    try {
      const response = await notificationSettingsApi.resetToDefaults();
      setSettings(response.data);
      return response.data;
    } catch (err) {
      throw new Error('Error al restablecer la configuración');
    }
  };

  const exportSettings = async () => {
    try {
      const response = await notificationSettingsApi.exportSettings();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notification-settings-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      throw new Error('Error al exportar la configuración');
    }
  };

  const importSettings = async (settingsFile: File) => {
    try {
      const response = await notificationSettingsApi.importSettings(settingsFile);
      setSettings(response.data);
      return response.data;
    } catch (err) {
      throw new Error('Error al importar la configuración');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    testWhatsAppConnection,
    testEmailConnection,
    resetToDefaults,
    exportSettings,
    importSettings,
    refetch: fetchSettings,
  };
};

export const useNotificationHealth = () => {
  const [healthStatus, setHealthStatus] = useState<{
    whatsapp: {
      status: 'healthy' | 'degraded' | 'down';
      lastCheck: string;
      responseTime: number;
      errorRate: number;
      message?: string;
    };
    email: {
      status: 'healthy' | 'degraded' | 'down';
      lastCheck: string;
      responseTime: number;
      errorRate: number;
      message?: string;
    };
    queue: {
      status: 'healthy' | 'degraded' | 'down';
      pendingJobs: number;
      failedJobs: number;
      processingRate: number;
      message?: string;
    };
    overall: 'healthy' | 'degraded' | 'down';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      const response = await notificationSettingsApi.getHealthStatus();
      setHealthStatus(response.data);
    } catch (err) {
      console.error('Error loading health status:', err);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      const response = await notificationSettingsApi.runHealthCheck();
      setHealthStatus(response.data);
      return response.data;
    } catch (err) {
      throw new Error('Error al ejecutar la verificación de salud');
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchHealthStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  return {
    healthStatus,
    loading,
    runHealthCheck,
    refetch: fetchHealthStatus,
  };
};

export const useNotificationLogs = (filters: {
  level?: 'error' | 'warn' | 'info' | 'debug';
  service?: 'whatsapp' | 'email' | 'queue';
  startDate?: string;
  endDate?: string;
} = {}) => {
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    service: 'whatsapp' | 'email' | 'queue';
    message: string;
    metadata?: Record<string, any>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationSettingsApi.getLogs(filters);
      setLogs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await notificationSettingsApi.clearLogs(filters);
      await fetchLogs();
    } catch (err) {
      throw new Error('Error al limpiar los logs');
    }
  };

  const exportLogs = async () => {
    try {
      const response = await notificationSettingsApi.exportLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notification-logs-${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      throw new Error('Error al exportar los logs');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [JSON.stringify(filters)]);

  return {
    logs,
    loading,
    error,
    clearLogs,
    exportLogs,
    refetch: fetchLogs,
  };
};