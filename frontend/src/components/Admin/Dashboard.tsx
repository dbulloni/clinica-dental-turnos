import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { useAppointmentStats, useTodayAppointments } from '../../hooks/useAppointments';
import { useProfessionals } from '../../hooks/useProfessionals';
import { useTreatmentTypes } from '../../hooks/useTreatmentTypes';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {change.type === 'increase' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ml-1 ${
                    change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change.value}% {change.period}
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get date range based on selection
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'week':
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      default:
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch data
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAppointmentStats(startDate, endDate);
  const { data: todayAppointmentsData } = useTodayAppointments();
  const { data: professionalsData } = useProfessionals();
  const { data: treatmentTypesData } = useTreatmentTypes();

  const stats = statsData?.data;
  const todayAppointments = todayAppointmentsData?.data || [];
  const professionals = professionalsData?.data || [];
  const treatmentTypes = treatmentTypesData?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting dashboard data...');
  };

  // Calculate statistics
  const totalAppointments = stats?.total || 0;
  const completedAppointments = stats?.byStatus?.COMPLETED || 0;
  const cancelledAppointments = stats?.byStatus?.CANCELLED || 0;
  const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
  const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0;

  // Mock previous period data for comparison (in a real app, this would come from API)
  const mockPreviousStats = {
    totalAppointments: Math.floor(totalAppointments * 0.85),
    completedAppointments: Math.floor(completedAppointments * 0.9),
    todayAppointments: Math.floor(todayAppointments.length * 0.8),
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, type: 'increase' as const };
    const change = Math.round(((current - previous) / previous) * 100);
    return {
      value: Math.abs(change),
      type: change >= 0 ? 'increase' as const : 'decrease' as const,
    };
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">
            Resumen de estadísticas y métricas de la clínica
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'today', label: 'Hoy' },
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mes' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setDateRange(option.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  dateRange === option.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>

          <Button
            variant="secondary"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Turnos Totales"
          value={totalAppointments}
          change={{
            ...calculateChange(totalAppointments, mockPreviousStats.totalAppointments),
            period: dateRange === 'today' ? 'vs ayer' : dateRange === 'week' ? 'vs sem. anterior' : 'vs mes anterior',
          }}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />

        <StatCard
          title="Turnos Hoy"
          value={todayAppointments.length}
          change={{
            ...calculateChange(todayAppointments.length, mockPreviousStats.todayAppointments),
            period: 'vs ayer',
          }}
          icon={<Clock className="w-6 h-6" />}
          color="green"
        />

        <StatCard
          title="Tasa de Completados"
          value={`${completionRate}%`}
          change={{
            ...calculateChange(completionRate, 85),
            period: 'vs período anterior',
          }}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />

        <StatCard
          title="Profesionales Activos"
          value={professionals.filter(p => p.isActive).length}
          icon={<Users className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Status */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Turnos por Estado</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => {
                const percentage = totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0;
                const statusLabels = {
                  SCHEDULED: { label: 'Programados', color: 'bg-blue-500' },
                  CONFIRMED: { label: 'Confirmados', color: 'bg-green-500' },
                  COMPLETED: { label: 'Completados', color: 'bg-purple-500' },
                  CANCELLED: { label: 'Cancelados', color: 'bg-red-500' },
                  NO_SHOW: { label: 'No se presentó', color: 'bg-yellow-500' },
                };
                const statusInfo = statusLabels[status as keyof typeof statusLabels] || { label: status, color: 'bg-gray-500' };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <Badge variant="secondary" size="sm">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        {/* Appointments by Professional */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Turnos por Profesional</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {stats?.byProfessional?.slice(0, 5).map((prof, index) => {
                const percentage = totalAppointments > 0 ? Math.round((prof.count / totalAppointments) * 100) : 0;
                return (
                  <div key={prof.professionalId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Dr. {prof.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{prof.count}</span>
                      <Badge variant="secondary" size="sm">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Treatment Types and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Types */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Tratamientos Más Solicitados</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {stats?.byTreatmentType?.slice(0, 5).map((treatment, index) => {
                const percentage = totalAppointments > 0 ? Math.round((treatment.count / totalAppointments) * 100) : 0;
                return (
                  <div key={treatment.treatmentTypeId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {treatment.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{treatment.count}</span>
                      <Badge variant="primary" size="sm">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        {/* Quick Stats */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Resumen Rápido</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Tasa de Cancelación</span>
                <Badge 
                  variant={cancellationRate > 20 ? 'danger' : cancellationRate > 10 ? 'warning' : 'success'}
                >
                  {cancellationRate}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Tipos de Tratamiento</span>
                <span className="text-sm font-medium text-gray-900">
                  {treatmentTypes.filter(t => t.isActive).length} activos
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Promedio Diario</span>
                <span className="text-sm font-medium text-gray-900">
                  {dateRange === 'month' ? Math.round(totalAppointments / 30) : 
                   dateRange === 'week' ? Math.round(totalAppointments / 7) : 
                   totalAppointments} turnos
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Horario Pico</span>
                <span className="text-sm font-medium text-gray-900">
                  09:00 - 11:00
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;