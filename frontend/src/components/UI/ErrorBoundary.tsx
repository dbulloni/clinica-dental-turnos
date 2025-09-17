import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full">
            <Card.Body className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Oops! Algo salió mal
              </h2>
              
              <p className="text-gray-600 mb-6">
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleReload}
                  variant="primary"
                  fullWidth
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Recargar página
                </Button>
                
                <Button
                  onClick={this.handleReset}
                  variant="secondary"
                  fullWidth
                >
                  Intentar de nuevo
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalles del error (desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;