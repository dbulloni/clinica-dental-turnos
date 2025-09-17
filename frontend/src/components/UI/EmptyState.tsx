import React from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  type?: 'search' | 'appointments' | 'patients' | 'notifications' | 'templates' | 'settings' | 'error' | 'success' | 'info' | 'custom';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ReactNode;
  }>;
  illustration?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'custom',
  title,
  description,
  icon,
  actions = [],
  illustration,
  className = '',
  size = 'md'
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          icon: <Search className="w-12 h-12 text-gray-400" />,
          title: 'No se encontraron resultados',
          description: 'Intenta ajustar los filtros de búsqueda o usar términos diferentes.'
        };
      case 'appointments':
        return {
          icon: <Calendar className="w-12 h-12 text-gray-400" />,
          title: 'No hay turnos programados',
          description: 'Comienza creando tu primer turno para organizar la agenda.'
        };
      case 'patients':
        return {
          icon: <Users className="w-12 h-12 text-gray-400" />,
          title: 'No hay pacientes registrados',
          description: 'Agrega tu primer paciente para comenzar a gestionar la información médica.'
        };
      case 'notifications':
        return {
          icon: <MessageSquare className="w-12 h-12 text-gray-400" />,
          title: 'No hay notificaciones',
          description: 'Las notificaciones aparecerán aquí cuando se envíen mensajes a los pacientes.'
        };
      case 'templates':
        return {
          icon: <FileText className="w-12 h-12 text-gray-400" />,
          title: 'No hay plantillas creadas',
          description: 'Crea plantillas de mensajes para automatizar las comunicaciones con pacientes.'
        };
      case 'settings':
        return {
          icon: <Settings className="w-12 h-12 text-gray-400" />,
          title: 'Configuración pendiente',
          description: 'Completa la configuración del sistema para comenzar a usar todas las funcionalidades.'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-400" />,
          title: 'Ocurrió un error',
          description: 'No se pudieron cargar los datos. Por favor, intenta nuevamente.'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-400" />,
          title: 'Operación exitosa',
          description: 'La acción se completó correctamente.'
        };
      case 'info':
        return {
          icon: <Info className="w-12 h-12 text-blue-400" />,
          title: 'Información',
          description: 'Aquí encontrarás información relevante cuando esté disponible.'
        };
      default:
        return {
          icon: <FileText className="w-12 h-12 text-gray-400" />,
          title: 'No hay datos disponibles',
          description: 'La información aparecerá aquí cuando esté disponible.'
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalIcon = icon || defaultContent.icon;
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;

  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: {
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      title: 'text-xl',
      description: 'text-lg'
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      {illustration && (
        <div className="mb-6">
          {illustration}
        </div>
      )}
      
      {!illustration && finalIcon && (
        <div className="mb-4">
          {React.cloneElement(finalIcon as React.ReactElement, {
            className: `${iconSizeClasses[size]} ${(finalIcon as React.ReactElement).props.className || ''}`
          })}
        </div>
      )}

      <h3 className={`font-medium text-gray-900 mb-2 ${textSizeClasses[size].title}`}>
        {finalTitle}
      </h3>

      {finalDescription && (
        <p className={`text-gray-600 mb-6 max-w-md ${textSizeClasses[size].description}`}>
          {finalDescription}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const SearchEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="search" {...props} />
);

export const AppointmentsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState 
    type="appointments" 
    actions={[
      {
        label: 'Crear Turno',
        onClick: () => {},
        variant: 'primary',
        icon: <Plus className="w-4 h-4" />
      }
    ]}
    {...props} 
  />
);

export const PatientsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState 
    type="patients" 
    actions={[
      {
        label: 'Agregar Paciente',
        onClick: () => {},
        variant: 'primary',
        icon: <Plus className="w-4 h-4" />
      }
    ]}
    {...props} 
  />
);

export const NotificationsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="notifications" {...props} />
);

export const TemplatesEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState 
    type="templates" 
    actions={[
      {
        label: 'Crear Plantilla',
        onClick: () => {},
        variant: 'primary',
        icon: <Plus className="w-4 h-4" />
      }
    ]}
    {...props} 
  />
);

export const ErrorEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState 
    type="error" 
    actions={[
      {
        label: 'Reintentar',
        onClick: () => window.location.reload(),
        variant: 'primary',
        icon: <RefreshCw className="w-4 h-4" />
      }
    ]}
    {...props} 
  />
);

// Illustrations for better UX
export const AppointmentIllustration: React.FC = () => (
  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
    <Calendar className="w-16 h-16 text-blue-600" />
  </div>
);

export const PatientIllustration: React.FC = () => (
  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
    <Users className="w-16 h-16 text-green-600" />
  </div>
);

export const NotificationIllustration: React.FC = () => (
  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
    <MessageSquare className="w-16 h-16 text-purple-600" />
  </div>
);

export default EmptyState;