import { useState, useEffect } from 'react';
import { notificationsApi } from '../services/api/notificationsApi';

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  type: 'whatsapp' | 'email';
  category: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancellation' | 'appointment_rescheduled' | 'custom';
  subject?: string;
  message: string;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  attempts: number;
  maxAttempts: number;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  appointmentId?: string;
  templateId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  systemStatus: 'healthy' | 'degraded' | 'down';
  recentAlerts: Array<{
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }>;
}

export interface NotificationFilter {
  status?: string;
  type?: string;
  dateRange?: string;
  patientSearch?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  appointmentId?: string;
}

export const useNotifications = (filters: NotificationFilter = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getNotifications(filters);
      setNotifications(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationsApi.getNotificationStats(filters);
      setStats(response.data);
    } catch (err) {
      console.error('Error loading notification stats:', err);
    }
  };

  const getNotificationDetails = async (notificationId: string) => {
    try {
      const response = await notificationsApi.getNotificationDetails(notificationId);
      return response.data;
    } catch (err) {
      throw new Error('Error al cargar los detalles de la notificación');
    }
  };

  const resendNotification = async (notificationId: string) => {
    try {
      const response = await notificationsApi.resendNotification(notificationId);
      await fetchNotifications(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al reenviar la notificación');
    }
  };

  const sendCustomNotification = async (data: {
    patientId: string;
    type: 'whatsapp' | 'email';
    subject?: string;
    message: string;
    templateId?: string;
  }) => {
    try {
      const response = await notificationsApi.sendCustomNotification(data);
      await fetchNotifications(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al enviar la notificación');
    }
  };

  const bulkResend = async (notificationIds: string[]) => {
    try {
      const response = await notificationsApi.bulkResend(notificationIds);
      await fetchNotifications(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al reenviar las notificaciones');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      await fetchNotifications(); // Refresh the list
    } catch (err) {
      throw new Error('Error al eliminar la notificación');
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [JSON.stringify(filters)]);

  return {
    notifications,
    stats,
    loading,
    error,
    getNotificationDetails,
    resendNotification,
    sendCustomNotification,
    bulkResend,
    deleteNotification,
    refetch: fetchNotifications,
  };
};

export const useNotificationStats = (filters: NotificationFilter = {}) => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getNotificationStats(filters);
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [JSON.stringify(filters)]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const useNotificationQueue = () => {
  const [queueStats, setQueueStats] = useState<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
    averageProcessingTime: number;
    estimatedWaitTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueueStats = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getQueueStats();
      setQueueStats(response.data);
    } catch (err) {
      console.error('Error loading queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const pauseQueue = async () => {
    try {
      await notificationsApi.pauseQueue();
      await fetchQueueStats();
    } catch (err) {
      throw new Error('Error al pausar la cola');
    }
  };

  const resumeQueue = async () => {
    try {
      await notificationsApi.resumeQueue();
      await fetchQueueStats();
    } catch (err) {
      throw new Error('Error al reanudar la cola');
    }
  };

  const clearQueue = async () => {
    try {
      await notificationsApi.clearQueue();
      await fetchQueueStats();
    } catch (err) {
      throw new Error('Error al limpiar la cola');
    }
  };

  const retryFailedJobs = async () => {
    try {
      await notificationsApi.retryFailedJobs();
      await fetchQueueStats();
    } catch (err) {
      throw new Error('Error al reintentar trabajos fallidos');
    }
  };

  useEffect(() => {
    fetchQueueStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueueStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    queueStats,
    loading,
    pauseQueue,
    resumeQueue,
    clearQueue,
    retryFailedJobs,
    refetch: fetchQueueStats,
  };
};

export const useNotificationHistory = (patientId: string) => {
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.getPatientNotificationHistory(patientId);
      setHistory(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
};