import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  const variantClasses = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    info: 'alert-info',
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  const Icon = icons[variant];

  return (
    <div className={cn('alert', variantClasses[variant], className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn('w-5 h-5', iconColors[variant])} />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className="text-sm">
            {children}
          </div>
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="p-1 hover:bg-black hover:bg-opacity-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;