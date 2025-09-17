import { useState, useEffect } from 'react';
import { reportsApi } from '../services/api/reportsApi';

export interface ReportData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  averageAppointmentValue: number;
  newPatients: number;
  returningPatients: number;
  appointmentsByDay: Array<{ date: string; count: number; revenue: number }>;
  appointmentsByTreatment: Array<{ name: string; count: number; revenue: number }>;
  appointmentsByProfessional: Array<{ name: string; count: number; revenue: number }>;
  appointmentsByStatus: Array<{ status: string; count: number; percentage: number }>;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  professionalId?: string;
  treatmentTypeId?: string;
  status?: string;
}

export const useReports = (filters: ReportFilters) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getReportData(filters);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel', reportType: string) => {
    try {
      setError(null);
      const response = await reportsApi.exportReport(filters, format, reportType);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${reportType}-${filters.startDate}-${filters.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al exportar el reporte';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filters.startDate, filters.endDate, filters.professionalId, filters.treatmentTypeId, filters.status]);

  return {
    data,
    loading,
    error,
    exportReport,
    refetch: fetchReportData,
  };
};

export const useAppointmentStats = (startDate: string, endDate: string) => {
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    byProfessional: Array<{ professionalId: string; name: string; count: number }>;
    byTreatmentType: Array<{ treatmentTypeId: string; name: string; count: number }>;
    byDay: Array<{ date: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getAppointmentStats({ startDate, endDate });
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return {
    data: stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const useRevenueStats = (startDate: string, endDate: string) => {
  const [stats, setStats] = useState<{
    totalRevenue: number;
    averagePerAppointment: number;
    byTreatmentType: Array<{ name: string; revenue: number; count: number }>;
    byProfessional: Array<{ name: string; revenue: number; count: number }>;
    byDay: Array<{ date: string; revenue: number }>;
    growth: {
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getRevenueStats({ startDate, endDate });
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas de ingresos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return {
    data: stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const usePatientStats = (startDate: string, endDate: string) => {
  const [stats, setStats] = useState<{
    totalPatients: number;
    newPatients: number;
    returningPatients: number;
    retentionRate: number;
    averageVisitsPerPatient: number;
    byAge: Array<{ ageGroup: string; count: number }>;
    byGender: Array<{ gender: string; count: number }>;
    topTreatments: Array<{ name: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getPatientStats({ startDate, endDate });
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas de pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return {
    data: stats,
    loading,
    error,
    refetch: fetchStats,
  };
};