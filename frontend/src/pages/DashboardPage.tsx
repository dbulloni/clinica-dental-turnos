import React from 'react';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  AlertCircle 
} from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { SkeletonCard } from '../components/UI/Skeleton';

// Placeholder data - will be replaced with real API calls
const mockStats = {
  todayAppointments: 12,
  weekAppointments: 45,
  monthAppointments: 180,
  totalPatients: 350,
  activePatients: 320,
  totalProfessionals: 5,
  activeProfessionals: 4,
  appointmentStats: {
    total: 180,
    scheduled: 45,
    confirmed: 120,
    cancelled: 10,
    completed: 5,
    noShow: 0,
  },
  recentActivity: [
    {
      type: 'appointment_created',
      description: 'Nuevo turno creado para María García',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      type: 'appointment_confirmed',
      description: 'Turno confirmado para Juan Pérez',
      timestamp: '2024-01-15T09:15:00Z',
    },
    {
      type: 'patient_registered',
      description: 'Nuevo paciente registrado: Ana López',
      timestamp: '2024-01-15T08:45:00Z',
    },
  ],
};

const DashboardPage: React.FC = () => {
  const [isLoading] = React.useState(false);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    change?: string;
  }> = ({ title, value, icon, color, change }) => (
    <Card hover>
      <Card.Body className="flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {change}
            </p>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Resumen general del sistema de turnos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Turnos Hoy"
          value={mockStats.todayAppointments}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          change="+12% vs ayer"
        />
        
        <StatCard
          title="Turnos Esta Semana"
          value={mockStats.weekAppointments}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-green-500"
          change="+8% vs semana anterior"
        />
        
        <StatCard
          title="Pacientes Activos"
          value={mockStats.activePatients}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          change="+5% este mes"
        />
        
        <StatCard
          title="Profesionales"
          value={mockStats.activeProfessionals}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Overview */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">
              Estado de Turnos (Este Mes)
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Programados</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="info">{mockStats.appointmentStats.scheduled}</Badge>
                  <span className="text-sm text-gray-500">
                    {Math.round((mockStats.appointmentStats.scheduled / mockStats.appointmentStats.total) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confirmados</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">{mockStats.appointmentStats.confirmed}</Badge>
                  <span className="text-sm text-gray-500">
                    {Math.round((mockStats.appointmentStats.confirmed / mockStats.appointmentStats.total) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cancelados</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="warning">{mockStats.appointmentStats.cancelled}</Badge>
                  <span className="text-sm text-gray-500">
                    {Math.round((mockStats.appointmentStats.cancelled / mockStats.appointmentStats.total) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completados</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="primary">{mockStats.appointmentStats.completed}</Badge>
                  <span className="text-sm text-gray-500">
                    {Math.round((mockStats.appointmentStats.completed / mockStats.appointmentStats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">
              Actividad Reciente
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {mockStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">
            Acciones Rápidas
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Calendar className="w-6 h-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900">Nuevo Turno</h4>
              <p className="text-sm text-gray-600">Crear un nuevo turno para un paciente</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="w-6 h-6 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900">Nuevo Paciente</h4>
              <p className="text-sm text-gray-600">Registrar un nuevo paciente</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <AlertCircle className="w-6 h-6 text-orange-500 mb-2" />
              <h4 className="font-medium text-gray-900">Ver Alertas</h4>
              <p className="text-sm text-gray-600">Revisar notificaciones pendientes</p>
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DashboardPage;