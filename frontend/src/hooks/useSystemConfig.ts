import { useState, useEffect } from 'react';
import { systemConfigApi } from '../services/api/systemConfigApi';

export interface SystemConfig {
  // Información de la clínica
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  
  // Horarios de trabajo
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  
  // Configuración de turnos
  appointmentDuration: number;
  appointmentBuffer: number;
  maxAdvanceBookingDays: number;
  reminderHours: number;
  
  // Notificaciones WhatsApp
  whatsappEnabled: boolean;
  whatsappToken: string;
  whatsappPhone: string;
  
  // Configuración de email
  emailEnabled: boolean;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  
  // Configuración de seguridad
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
}

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await systemConfigApi.getConfig();
      setConfig(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (configData: Partial<SystemConfig>) => {
    try {
      setError(null);
      const response = await systemConfigApi.updateConfig(configData);
      setConfig(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la configuración';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const testWhatsAppConnection = async (token: string, phone: string) => {
    try {
      setError(null);
      const response = await systemConfigApi.testWhatsApp({ token, phone });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al probar la conexión WhatsApp';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const testEmailConnection = async (emailConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
  }) => {
    try {
      setError(null);
      const response = await systemConfigApi.testEmail(emailConfig);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al probar la conexión de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    testWhatsAppConnection,
    testEmailConnection,
    refetch: fetchConfig,
  };
};