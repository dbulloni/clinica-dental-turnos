import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportData {
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

const ReportsAndAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [reportData, setReportData] = useState<ReportData>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalRevenue: 0,
    averageAppointmentValue: 0,
    newPatients: 0,
    returningPatients: 0,
    appointmentsByDay: [],
    appointmentsByTreatment: [],
    appointmentsByProfessional: [],
    appointmentsByStatus: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'overview' | 'appointments' | 'revenue' | 'patients'>('overview');

  // Mock data for demonstration
  const mockReportData: ReportData = {
    totalAppointments: 156,
    completedAppointments: 132,
    cancelledAppointments: 18,
    noShowAppointments: 6,
    totalRevenue: 234500,
    averageAppointmentValue: 1503,
    newPatients: 23,
    returningPatients: 109,
    appointmentsByDay: [
      { date: '2024-12-01', count: 12, revenue: 18000 },
      { date: '2024-12-02', count: 15, revenue: 22500 },
      { date: '2024-12-03', count: 8, revenue: 12000 },
      { date: '2024-12-04', count: 18, revenue: 27000 },
      { date: '2024-12-05', count: 14, revenue: 21000 },
    ],
    appointmentsByTreatment: [
      { name: 'Consulta General', count: 45, revenue: 67500 },
      { name: 'Limpieza Dental', count: 38, revenue: 95000 },
      { name: 'Empaste', count: 28, revenue: 84000 },
      { name: 'Extracción', count: 15, revenue: 37500 },
      { name: 'Endodoncia', count: 8, revenue: 40000 },
    ],
    appointmentsByProfessional: [
      { name: 'Dr. Juan Pérez', count: 78, revenue: 117000 },
      { name: 'Dra. María González', count: 54, revenue: 81000 },
      { name: 'Dr. Carlos López', count: 24, revenue: 36000 },
    ],
    appointmentsByStatus: [
      { status: 'Completado', count: 132, percentage: 84.6 },
      { status: 'Cancelado', count: 18, percentage: 11.5 },
      { status: 'No se presentó', count: 6, percentage: 3.9 },
    ],
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(mockReportData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCompletionRate = () => {
    if (reportData.totalAppointments === 0) return 0;
    return (reportData.completedAppointments / reportData.totalAppointments) * 100;
  };

  const getCancellationRate = () => {
    if (reportData.totalAppointments === 0) return 0;
    return (reportData.cancelledAppointments / reportData.totalAppointments) * 100;
  };

  const getNoShowRate = () => {
    if (reportData.totalAppointments === 0) return 0;
    return (reportData.noShowAppointments / reportData.totalAppointments) * 100;
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Exporting report as ${format}`);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const reportTabs = [
    { key: 'overview', label: 'Resumen', icon: <Activity className="w-4 h-4" /> },
    { key: 'appointments', label: 'Turnos', icon: <Calendar className="w-4 h-4" /> },
    { key: 'revenue', label: 'Ingresos', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'patients', label: 'Pacientes', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h2>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento de la clínica
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => exportReport('excel')}
            icon={<Download className="w-4 h-4" />}
          >
            Exportar Excel
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportReport('pdf')}
            icon={<FileText className="w-4 h-4" />}
          >
            Exportar PDF
          </Button>
          <Button
            variant="primary"
            onClick={loadReportData}
            loading={loading}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Fecha desde"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Fecha hasta"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(7)}
              >
                Últimos 7 días
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(30)}
              >
                Últimos 30 días
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickDateRange(90)}
              >
                Últimos 90 días
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Report Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedReport(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedReport === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalAppointments}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +12% vs mes anterior
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +8% vs mes anterior
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Completado</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(getCompletionRate())}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +2% vs mes anterior
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nuevos Pacientes</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.newPatients}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +15% vs mes anterior
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Distribución por Estado</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {reportData.appointmentsByStatus.map((status, index) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            status.status === 'Completado' ? 'bg-green-500' :
                            status.status === 'Cancelado' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-700">{status.status}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{status.count}</span>
                        <Badge variant="secondary">{formatPercentage(status.percentage)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Tratamientos Más Solicitados</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {reportData.appointmentsByTreatment.slice(0, 5).map((treatment, index) => (
                    <div key={treatment.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{treatment.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{treatment.count} turnos</div>
                        <div className="text-xs text-gray-500">{formatCurrency(treatment.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {selectedReport === 'appointments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{reportData.completedAppointments}</div>
                  <div className="text-sm text-gray-600">Completados</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPercentage(getCompletionRate())} del total
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{reportData.cancelledAppointments}</div>
                  <div className="text-sm text-gray-600">Cancelados</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPercentage(getCancellationRate())} del total
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{reportData.noShowAppointments}</div>
                  <div className="text-sm text-gray-600">No se presentaron</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPercentage(getNoShowRate())} del total
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Turnos por Profesional</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {reportData.appointmentsByProfessional.map((professional) => (
                  <div key={professional.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{professional.name}</div>
                        <div className="text-sm text-gray-500">{professional.count} turnos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(professional.revenue)}</div>
                      <div className="text-sm text-gray-500">
                        Promedio: {formatCurrency(professional.revenue / professional.count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Revenue Tab */}
      {selectedReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(reportData.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">Ingresos Totales</div>
                  <div className="text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +8% vs período anterior
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(reportData.averageAppointmentValue)}
                  </div>
                  <div className="text-sm text-gray-600">Valor Promedio por Turno</div>
                  <div className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +3% vs período anterior
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Ingresos por Tratamiento</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {reportData.appointmentsByTreatment.map((treatment, index) => {
                  const percentage = (treatment.revenue / reportData.totalRevenue) * 100;
                  return (
                    <div key={treatment.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{treatment.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(treatment.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPercentage(percentage)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Patients Tab */}
      {selectedReport === 'patients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{reportData.newPatients}</div>
                  <div className="text-sm text-gray-600">Nuevos Pacientes</div>
                  <div className="text-xs text-purple-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +15% vs período anterior
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{reportData.returningPatients}</div>
                  <div className="text-sm text-gray-600">Pacientes Recurrentes</div>
                  <div className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +5% vs período anterior
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Distribución de Pacientes</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Por Tipo</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nuevos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(reportData.newPatients / (reportData.newPatients + reportData.returningPatients)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{reportData.newPatients}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Recurrentes</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(reportData.returningPatients / (reportData.newPatients + reportData.returningPatients)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{reportData.returningPatients}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Métricas de Retención</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tasa de Retención</span>
                      <Badge variant="success">
                        {formatPercentage((reportData.returningPatients / (reportData.newPatients + reportData.returningPatients)) * 100)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Promedio de Visitas</span>
                      <span className="text-sm font-medium text-gray-900">2.3</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsAndAnalytics;