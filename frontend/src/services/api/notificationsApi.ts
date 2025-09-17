import { apiClient } from './client';
import { Notification, NotificationStats, NotificationFilter } from '../../hooks/useNotifications';

export interface NotificationResponse {
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface NotificationStatsResponse {
  data: NotificationStats;
  message: string;
}

export interface SingleNotificationResponse {
  data: Notification;
  message: string;
}

export const notificationsApi = {
  // Get notifications with filters
  getNotifications: (filters: NotificationFilter = {}): Promise<NotificationResponse> => {
    return apiClient.get('/api/notifications', { params: filters });
  },

  // Get notification statistics
  getNotificationStats: (filters: NotificationFilter = {}): Promise<NotificationStatsResponse> => {
    return apiClient.get('/api/notifications/stats', { params: filters });
  },

  // Get specific notification details
  getNotificationDetails: (notificationId: string): Promise<SingleNotificationResponse> => {
    return apiClient.get(`/api/notifications/${notificationId}`);
  },

  // Resend a failed notification
  resendNotification: (notificationId: string): Promise<SingleNotificationResponse> => {
    return apiClient.post(`/api/notifications/${notificationId}/resend`);
  },

  // Send custom notification
  sendCustomNotification: (data: {
    patientId: string;
    type: 'whatsapp' | 'email';
    subject?: string;
    message: string;
    templateId?: string;
    variables?: Record<string, string>;
  }): Promise<SingleNotificationResponse> => {
    return apiClient.post('/api/notifications/send', data);
  },

  // Bulk resend notifications
  bulkResend: (notificationIds: string[]): Promise<{
    data: {
      success: number;
      failed: number;
      results: Array<{ id: string; success: boolean; error?: string }>;
    };
    message: string;
  }> => {
    return apiClient.post('/api/notifications/bulk-resend', { notificationIds });
  },

  // Delete notification
  deleteNotification: (notificationId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/notifications/${notificationId}`);
  },

  // Get patient notification history
  getPatientNotificationHistory: (patientId: string): Promise<NotificationResponse> => {
    return apiClient.get(`/api/notifications/patient/${patientId}`);
  },

  // Get appointment notifications
  getAppointmentNotifications: (appointmentId: string): Promise<NotificationResponse> => {
    return apiClient.get(`/api/notifications/appointment/${appointmentId}`);
  },

  // Mark notification as read
  markAsRead: (notificationId: string): Promise<SingleNotificationResponse> => {
    return apiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  // Update notification status
  updateStatus: (notificationId: string, status: string): Promise<SingleNotificationResponse> => {
    return apiClient.patch(`/api/notifications/${notificationId}/status`, { status });
  },

  // Get delivery report
  getDeliveryReport: (notificationId: string): Promise<{
    data: {
      deliveryStatus: string;
      deliveredAt?: string;
      readAt?: string;
      attempts: Array<{
        timestamp: string;
        status: string;
        error?: string;
      }>;
      metadata: Record<string, any>;
    };
    message: string;
  }> => {
    return apiClient.get(`/api/notifications/${notificationId}/delivery-report`);
  },

  // Queue management
  getQueueStats: (): Promise<{
    data: {
      pending: number;
      processing: number;
      failed: number;
      completed: number;
      averageProcessingTime: number;
      estimatedWaitTime: number;
    };
    message: string;
  }> => {
    return apiClient.get('/api/notifications/queue/stats');
  },

  pauseQueue: (): Promise<{ message: string }> => {
    return apiClient.post('/api/notifications/queue/pause');
  },

  resumeQueue: (): Promise<{ message: string }> => {
    return apiClient.post('/api/notifications/queue/resume');
  },

  clearQueue: (): Promise<{ message: string }> => {
    return apiClient.post('/api/notifications/queue/clear');
  },

  retryFailedJobs: (): Promise<{
    data: { retriedCount: number };
    message: string;
  }> => {
    return apiClient.post('/api/notifications/queue/retry-failed');
  },

  // Bulk operations
  bulkDelete: (notificationIds: string[]): Promise<{
    data: { deletedCount: number };
    message: string;
  }> => {
    return apiClient.post('/api/notifications/bulk-delete', { notificationIds });
  },

  bulkUpdateStatus: (notificationIds: string[], status: string): Promise<{
    data: { updatedCount: number };
    message: string;
  }> => {
    return apiClient.post('/api/notifications/bulk-update-status', { notificationIds, status });
  },

  // Analytics
  getDeliveryAnalytics: (filters: {
    startDate: string;
    endDate: string;
    type?: 'whatsapp' | 'email';
    groupBy?: 'hour' | 'day' | 'week';
  }): Promise<{
    data: {
      deliveryRates: Array<{ period: string; rate: number; total: number; delivered: number }>;
      averageDeliveryTime: number;
      failureReasons: Array<{ reason: string; count: number; percentage: number }>;
      hourlyDistribution: Array<{ hour: number; count: number }>;
    };
    message: string;
  }> => {
    return apiClient.get('/api/notifications/analytics/delivery', { params: filters });
  },

  getEngagementAnalytics: (filters: {
    startDate: string;
    endDate: string;
    type?: 'whatsapp' | 'email';
  }): Promise<{
    data: {
      openRates: Array<{ date: string; rate: number }>;
      clickRates: Array<{ date: string; rate: number }>;
      responseRates: Array<{ date: string; rate: number }>;
      topPerformingTemplates: Array<{ templateId: string; name: string; engagementRate: number }>;
    };
    message: string;
  }> => {
    return apiClient.get('/api/notifications/analytics/engagement', { params: filters });
  },

  // Export notifications
  exportNotifications: (filters: NotificationFilter, format: 'csv' | 'excel'): Promise<Blob> => {
    return apiClient.get('/api/notifications/export', {
      params: { ...filters, format },
      responseType: 'blob',
    });
  },

  // Webhook management
  getWebhookLogs: (filters: {
    service?: 'whatsapp' | 'email';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    data: Array<{
      id: string;
      service: string;
      event: string;
      payload: Record<string, any>;
      response: Record<string, any>;
      timestamp: string;
      processed: boolean;
    }>;
    message: string;
  }> => {
    return apiClient.get('/api/notifications/webhooks/logs', { params: filters });
  },

  reprocessWebhook: (webhookId: string): Promise<{ message: string }> => {
    return apiClient.post(`/api/notifications/webhooks/${webhookId}/reprocess`);
  },

  // Template usage analytics
  getTemplateUsageStats: (filters: {
    startDate?: string;
    endDate?: string;
    templateId?: string;
  } = {}): Promise<{
    data: {
      totalUsage: number;
      successRate: number;
      averageDeliveryTime: number;
      usageByTemplate: Array<{
        templateId: string;
        templateName: string;
        usageCount: number;
        successRate: number;
      }>;
      usageOverTime: Array<{ date: string; count: number }>;
    };
    message: string;
  }> => {
    return apiClient.get('/api/notifications/templates/usage-stats', { params: filters });
  },
};