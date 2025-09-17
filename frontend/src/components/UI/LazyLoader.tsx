import React, { Suspense, ComponentType } from 'react';
import Skeleton from './Skeleton';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

interface LazyComponentProps extends LazyLoaderProps {
  component: React.LazyExoticComponent<ComponentType<any>>;
  [key: string]: any;
}

const DefaultFallback: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`space-y-4 ${className || ''}`}>
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

const DefaultError: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar el componente</h3>
      <p className="text-gray-600">Por favor, recarga la página e intenta nuevamente.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Recargar página
      </button>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoader Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultError />;
    }

    return this.props.children;
  }
}

export const LazyComponent: React.FC<LazyComponentProps> = ({ 
  component: Component, 
  fallback, 
  error, 
  className,
  ...props 
}) => {
  return (
    <ErrorBoundary fallback={error}>
      <Suspense fallback={fallback || <DefaultFallback className={className} />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const withLazyLoading = <P extends object>(
  Component: React.LazyExoticComponent<ComponentType<P>>,
  options: LazyLoaderProps = {}
) => {
  return (props: P) => (
    <LazyComponent 
      component={Component} 
      {...options} 
      {...props} 
    />
  );
};

// Hook for preloading components
export const usePreloadComponent = () => {
  const preload = React.useCallback((component: React.LazyExoticComponent<ComponentType<any>>) => {
    // Preload the component
    component();
  }, []);

  return { preload };
};

// Higher-order component for intersection observer lazy loading
export const withIntersectionObserver = <P extends object>(
  Component: ComponentType<P>,
  options: IntersectionObserverInit = {}
) => {
  return React.forwardRef<HTMLDivElement, P & { className?: string }>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasLoaded, setHasLoaded] = React.useState(false);
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => elementRef.current!);

    React.useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observer.unobserve(element);
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options,
        }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }, [hasLoaded, options]);

    return (
      <div ref={elementRef} className={props.className}>
        {isVisible ? (
          <Component {...props} />
        ) : (
          <DefaultFallback className="min-h-[200px]" />
        )}
      </div>
    );
  });
};

export default LazyComponent;