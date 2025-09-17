import { apiClient } from './client';
import { ReportData, ReportFilters } from '../../hooks/useReports';

export interface ReportResponse {
  data: ReportData;
  message: string;
}

export interface StatsResponse<T> {
  data: T;
  message: string;
}

export const reportsApi = {
  // Get comprehensive report data
  getReportData: (filters: ReportFilters): Promise<ReportResponse> => {
    return apiClient.get('/api/reports/comprehensive', { params: filters });
  },

  // Get appointment statistics
  getAppointmentStats: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    total: number;
    byStatus: Record<string, number>;
    byProfessional: Array<{ professionalId: string; name: string; count: number }>;
    byTreatmentType: Array<{ treatmentTypeId: string; name: string; count: number }>;
    byDay: Array<{ date: string; count: number }>;
  }>> => {
    return apiClient.get('/api/reports/appointments', { params: filters });
  },

  // Get revenue statistics
  getRevenueStats: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    totalRevenue: number;
    averagePerAppointment: number;
    byTreatmentType: Array<{ name: string; revenue: number; count: number }>;
    byProfessional: Array<{ name: string; revenue: number; count: number }>;
    byDay: Array<{ date: string; revenue: number }>;
    growth: {
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  }>> => {
    return apiClient.get('/api/reports/revenue', { params: filters });
  },

  // Get patient statistics
  getPatientStats: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    totalPatients: number;
    newPatients: number;
    returningPatients: number;
    retentionRate: number;
    averageVisitsPerPatient: number;
    byAge: Array<{ ageGroup: string; count: number }>;
    byGender: Array<{ gender: string; count: number }>;
    topTreatments: Array<{ name: string; count: number }>;
  }>> => {
    return apiClient.get('/api/reports/patients', { params: filters });
  },

  // Get professional performance
  getProfessionalPerformance: (filters: { 
    startDate: string; 
    endDate: string; 
    professionalId?: string;
  }): Promise<StatsResponse<{
    appointments: number;
    completionRate: number;
    averageRating: number;
    revenue: number;
    topTreatments: Array<{ name: string; count: number }>;
    schedule: {
      totalHours: number;
      utilization: number;
    };
  }>> => {
    return apiClient.get('/api/reports/professional-performance', { params: filters });
  },

  // Get treatment type analysis
  getTreatmentAnalysis: (filters: { 
    startDate: string; 
    endDate: string; 
    treatmentTypeId?: string;
  }): Promise<StatsResponse<{
    totalAppointments: number;
    totalRevenue: number;
    averagePrice: number;
    completionRate: number;
    popularTimes: Array<{ hour: number; count: number }>;
    byProfessional: Array<{ name: string; count: number; revenue: number }>;
  }>> => {
    return apiClient.get('/api/reports/treatment-analysis', { params: filters });
  },

  // Export report
  exportReport: (
    filters: ReportFilters,
    format: 'pdf' | 'excel',
    reportType: string
  ): Promise<Blob> => {
    return apiClient.get(`/api/reports/export/${reportType}`, {
      params: { ...filters, format },
      responseType: 'blob',
    });
  },

  // Get dashboard summary
  getDashboardSummary: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    appointments: {
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
      pending: number;
    };
    revenue: {
      total: number;
      average: number;
      growth: number;
    };
    patients: {
      total: number;
      new: number;
      returning: number;
    };
    professionals: {
      active: number;
      totalAppointments: number;
      averageRating: number;
    };
    alerts: Array<{
      type: 'warning' | 'info' | 'error';
      message: string;
      count?: number;
    }>;
  }>> => {
    return apiClient.get('/api/reports/dashboard-summary', { params: filters });
  },

  // Get time-based analytics
  getTimeAnalytics: (filters: { 
    startDate: string; 
    endDate: string;
    groupBy: 'hour' | 'day' | 'week' | 'month';
  }): Promise<StatsResponse<{
    appointments: Array<{ period: string; count: number }>;
    revenue: Array<{ period: string; amount: number }>;
    busyHours: Array<{ hour: number; count: number; percentage: number }>;
    busyDays: Array<{ day: string; count: number; percentage: number }>;
  }>> => {
    return apiClient.get('/api/reports/time-analytics', { params: filters });
  },

  // Get cancellation analysis
  getCancellationAnalysis: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    totalCancellations: number;
    cancellationRate: number;
    byReason: Array<{ reason: string; count: number; percentage: number }>;
    byTimeBeforeAppointment: Array<{ timeRange: string; count: number }>;
    byProfessional: Array<{ name: string; count: number; rate: number }>;
    byTreatmentType: Array<{ name: string; count: number; rate: number }>;
    trends: Array<{ date: string; count: number }>;
  }>> => {
    return apiClient.get('/api/reports/cancellation-analysis', { params: filters });
  },

  // Get waiting time analysis
  getWaitingTimeAnalysis: (filters: { startDate: string; endDate: string }): Promise<StatsResponse<{
    averageWaitTime: number;
    medianWaitTime: number;
    byProfessional: Array<{ name: string; averageWait: number }>;
    byTreatmentType: Array<{ name: string; averageWait: number }>;
    byTimeOfDay: Array<{ hour: number; averageWait: number }>;
    distribution: Array<{ range: string; count: number; percentage: number }>;
  }>> => {
    return apiClient.get('/api/reports/waiting-time-analysis', { params: filters });
  },

  // Get custom report
  getCustomReport: (config: {
    metrics: string[];
    groupBy: string[];
    filters: ReportFilters;
    chartType?: 'bar' | 'line' | 'pie' | 'table';
  }): Promise<StatsResponse<{
    data: any[];
    summary: Record<string, number>;
    chartConfig: {
      type: string;
      labels: string[];
      datasets: any[];
    };
  }>> => {
    return apiClient.post('/api/reports/custom', config);
  },

  // Save custom report template
  saveReportTemplate: (template: {
    name: string;
    description: string;
    config: any;
  }): Promise<StatsResponse<{ id: string; name: string }>> => {
    return apiClient.post('/api/reports/templates', template);
  },

  // Get saved report templates
  getReportTemplates: (): Promise<StatsResponse<Array<{
    id: string;
    name: string;
    description: string;
    config: any;
    createdAt: string;
  }>>> => {
    return apiClient.get('/api/reports/templates');
  },

  // Delete report template
  deleteReportTemplate: (templateId: string): Promise<StatsResponse<{}>> => {
    return apiClient.delete(`/api/reports/templates/${templateId}`);
  },
};