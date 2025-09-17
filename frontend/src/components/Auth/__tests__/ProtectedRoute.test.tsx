import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth context
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  refreshToken: jest.fn(),
};

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockAuthContext.isLoading = true;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByLabelText('Cargando...')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    // Should redirect to login (we can't easily test navigation in this setup)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows access denied when user lacks required role', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: '1',
      email: 'secretary@test.com',
      firstName: 'Test',
      lastName: 'Secretary',
      role: 'SECRETARY',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos para acceder a esta página.')).toBeInTheDocument();
  });

  it('renders children when user is authenticated and has required role', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: '1',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('allows admin to access secretary content', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: '1',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    render(
      <TestWrapper>
        <ProtectedRoute requiredRole="SECRETARY">
          <div>Secretary Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Secretary Content')).toBeInTheDocument();
  });
});