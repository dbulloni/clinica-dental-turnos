import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Send,
  Eye,
  RotateCcw,
  Download,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import Table from '../UI/Table';
import Modal from '../UI/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface NotificationFilter {
  status: 'all' | 'sent' | 'delivered' | 'failed' | 'pending';
  type: 'all' | 'whatsapp' | 'email';
  dateRange: 'today' | 'week' | 'month' | 'custom';
  patientSearch: string;
  startDate?: string;
  endDate?: string;
}

const NotificationMonitor: React.FC = () => {
  const [filters, setFilters] = useState<NotificationFilter>({
    status: 'all',
    type: 'all',
    dateRange: 'today',
    patientSearch: '',
  });
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const {
    notifications,
    stats,
    loading,
    error,
    refetch,
    resendNotification,
    getNotificationDetails
  } = useNotifications(filters);

  const handleFilterChange = (key: keyof NotificationFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleViewDetails = async (notification: any) => {
    try {
      const details = await getNotificationDetails(notification.id);
      setSelectedNotification(details);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Error al cargar los detalles de la notificación');
    }
  };

  const handleResend = async (notification: any) => {
    setSelectedNotification(notification);
    setShowResendModal(true);
  };

  const confirmResend = async () => {
    if (!selectedNotification) return;
    
    try {
      await resendNotification(selectedNotification.id);
      toast.success('Notificación reenviada exitosamente');
      setShowResendModal(false);
      refetch();
    } catch (error) {
      toast.error('Error al reenviar la notificación');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { variant: 'primary' as const, label: 'Enviado', icon: <Send className="w-3 h-3" /> },
      delivered: { variant: 'success' as const, label: 'Entregado', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'danger' as const, label: 'Fallido', icon: <XCircle className="w-3 h-3" /> },
      pending: { variant: 'warning' as const, label: 'Pendiente', icon: <Clock className="w-3 h-3" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'secondary' as const,
      label: status,
      icon: null
    };

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      whatsapp: { color: 'bg-green-100 text-green-800', icon: <MessageSquare className="w-3 h-3" />, label: 'WhatsApp' },
      email: { color: 'bg-blue-100 text-blue-800', icon: <Mail className="w-3 h-3" />, label: 'Email' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
      color: 'bg-gray-100 text-gray-800',
      icon: null,
      label: type
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const columns = [
    {
      key: 'patient',
      label: 'Paciente',
      render: (notification: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{notification.patientName}</div>
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <Phone className="w-3 h-3" />
              <span>{notification.patientPhone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (notification: any) => getTypeBadge(notification.type),
    },
    {
      key: 'message',
      label: 'Mensaje',
      render: (notification: any) => (
        <div className="max-w-xs">
          <div className="font-medium text-sm text-gray-900 mb-1">{notification.subject}</div>
          <div className="text-xs text-gray-500 truncate">{notification.message}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (notification: any) => getStatusBadge(notification.status),
    },
    {
      key: 'sentAt',
      label: 'Enviado',
      render: (notification: any) => (
        <div className="text-sm text-gray-900">
          <div>{format(new Date(notification.sentAt), 'dd/MM/yyyy', { locale: es })}</div>
          <div className="text-xs text-gray-500">
            {format(new Date(notification.sentAt), 'HH:mm', { locale: es })}
          </div>
        </div>
      ),
    },
    {
      key: 'attempts',
      label: 'Intentos',
      render: (notification: any) => (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-900">{notification.attempts}</span>
          <div className="text-xs text-gray-500">de {notification.maxAttempts}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (notification: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(notification)}
            icon={<Eye className="w-4 h-4" />}
          >
            Ver
          </Button>
          {(notification.status === 'failed' || notification.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResend(notification)}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reenviar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor de Notificaciones</h2>
          <p className="text-gray-600 mt-1">
            Seguimiento de mensajes WhatsApp y emails enviados
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => {/* Export functionality */}}
            icon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
          <Button
            variant="primary"
            onClick={refetch}
            loading={loading}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregados</p>
                <p className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total ? Math.round((stats.delivered / stats.total) * 100) : 0}% del total
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats?.failed || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.total ? Math.round((stats.failed / stats.total) * 100) : 0}% del total
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="all">Todos los estados</option>
                <option value="sent">Enviados</option>
                <option value="delivered">Entregados</option>
                <option value="failed">Fallidos</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input"
              >
                <option value="all">Todos los tipos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="label">Período</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="input"
              >
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <Input
                label="Buscar paciente"
                value={filters.patientSearch}
                onChange={(e) => handleFilterChange('patientSearch', e.target.value)}
                placeholder="Nombre o teléfono..."
                startIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Fecha desde"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                label="Fecha hasta"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Notifications Table */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Historial de Notificaciones</h3>
        </Card.Header>
        <Card.Body>
          <Table
            data={notifications}
            columns={columns}
            loading={loading}
            emptyMessage="No se encontraron notificaciones"
          />
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de Notificación"
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Paciente</label>
                <div className="text-sm text-gray-900">{selectedNotification.patientName}</div>
              </div>
              <div>
                <label className="label">Teléfono/Email</label>
                <div className="text-sm text-gray-900">{selectedNotification.recipient}</div>
              </div>
              <div>
                <label className="label">Tipo</label>
                <div>{getTypeBadge(selectedNotification.type)}</div>
              </div>
              <div>
                <label className="label">Estado</label>
                <div>{getStatusBadge(selectedNotification.status)}</div>
              </div>
            </div>

            <div>
              <label className="label">Asunto</label>
              <div className="text-sm text-gray-900">{selectedNotification.subject}</div>
            </div>

            <div>
              <label className="label">Mensaje</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                {selectedNotification.message}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Enviado</label>
                <div className="text-sm text-gray-900">
                  {format(new Date(selectedNotification.sentAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </div>
              </div>
              <div>
                <label className="label">Intentos</label>
                <div className="text-sm text-gray-900">
                  {selectedNotification.attempts} de {selectedNotification.maxAttempts}
                </div>
              </div>
              <div>
                <label className="label">Último intento</label>
                <div className="text-sm text-gray-900">
                  {selectedNotification.lastAttemptAt ? 
                    format(new Date(selectedNotification.lastAttemptAt), 'dd/MM/yyyy HH:mm', { locale: es }) :
                    'N/A'
                  }
                </div>
              </div>
            </div>

            {selectedNotification.errorMessage && (
              <div>
                <label className="label">Error</label>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800">
                  {selectedNotification.errorMessage}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Cerrar
              </Button>
              {(selectedNotification.status === 'failed' || selectedNotification.status === 'pending') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleResend(selectedNotification);
                  }}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Reenviar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Resend Confirmation Modal */}
      <Modal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        title="Confirmar Reenvío"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">
                  ¿Estás seguro de que quieres reenviar esta notificación?
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <div><strong>Paciente:</strong> {selectedNotification.patientName}</div>
                  <div><strong>Tipo:</strong> {selectedNotification.type}</div>
                  <div><strong>Destinatario:</strong> {selectedNotification.recipient}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowResendModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmResend}
                icon={<Send className="w-4 h-4" />}
              >
                Reenviar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationMonitor;