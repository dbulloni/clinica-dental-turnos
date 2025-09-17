import React from 'react';
import { Loader2, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface LoadingIndicatorProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  text?: string;
  progress?: number; // 0-100 for progress type
  className?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  progress,
  className = '',
  overlay = false,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const renderSpinner = () => (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full ${
            size === 'sm' ? 'w-1 h-1' :
            size === 'md' ? 'w-2 h-2' :
            size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
          } ${colorClasses[color].replace('text-', 'bg-')} animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`rounded-full ${sizeClasses[size]} ${colorClasses[color].replace('text-', 'bg-')} animate-pulse`} />
  );

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    </div>
  );

  const renderProgress = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${colorClasses[color]} ${textSizeClasses[size]}`}>
          {text || 'Cargando...'}
        </span>
        <span className={`${textSizeClasses[size]} text-gray-600`}>
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color].replace('text-', 'bg-')}`}
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );

  const renderIndicator = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {type !== 'progress' && type !== 'skeleton' && renderIndicator()}
      {type === 'progress' && renderProgress()}
      {type === 'skeleton' && renderSkeleton()}
      {text && type !== 'progress' && (
        <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {content}
      </div>
    );
  }

  return content;
};

// Predefined loading states
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Cargando página...' }) => (
  <LoadingIndicator type="spinner" size="lg" text={text} fullScreen />
);

export const ComponentLoader: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => (
  <LoadingIndicator type="spinner" size="md" text={text} className="py-8" />
);

export const ButtonLoader: React.FC = () => (
  <LoadingIndicator type="spinner" size="sm" />
);

export const TableLoader: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-gray-300 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export const CardLoader: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

// Loading states with context
export const LoadingState: React.FC<{
  type: 'page' | 'component' | 'table' | 'card' | 'form';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ type, text, size = 'md' }) => {
  switch (type) {
    case 'page':
      return <PageLoader text={text} />;
    case 'table':
      return <TableLoader />;
    case 'card':
      return <CardLoader />;
    case 'form':
      return (
        <div className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/5"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      );
    default:
      return <ComponentLoader text={text} />;
  }
};

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  }, []);

  const withLoading = React.useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
  };
};

export default LoadingIndicator;