import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthResponse, LoginCredentials } from '../types';
import { authApi } from '../services/api/authApi';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un token almacenado al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
          // Validar el token con el servidor
          const response = await authApi.validateToken();
          if (response.success && response.data.user) {
            setUser(response.data.user);
          } else {
            // Token inválido, limpiar storage
            clearAuthData();
          }
        } catch (error) {
          console.error('Error validating token:', error);
          clearAuthData();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Configurar interceptor para refresh automático de tokens
  useEffect(() => {
    const setupTokenRefresh = () => {
      // Interceptor para respuestas 401
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        
        if (response.status === 401 && user) {
          // Intentar refresh del token
          const refreshSuccess = await refreshToken();
          
          if (refreshSuccess) {
            // Reintentar la petición original con el nuevo token
            const newToken = localStorage.getItem('accessToken');
            if (newToken && args[1]) {
              const headers = new Headers(args[1].headers);
              headers.set('Authorization', `Bearer ${newToken}`);
              args[1] = { ...args[1], headers };
              return originalFetch(...args);
            }
          } else {
            // Refresh falló, hacer logout
            logout();
          }
        }
        
        return response;
      };
    };

    if (user) {
      setupTokenRefresh();
    }

    // Cleanup no es necesario ya que window.fetch se mantiene
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;
        
        // Guardar tokens en localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Actualizar estado del usuario
        setUser(userData);
        
        toast.success(`¡Bienvenido, ${userData.firstName}!`);
      } else {
        throw new Error(response.message || 'Error en el inicio de sesión');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Mostrar mensaje de error específico
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Error al iniciar sesión. Por favor, intenta nuevamente.');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      // Llamar al endpoint de logout (opcional, para invalidar el token en el servidor)
      authApi.logout().catch(console.error);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar datos de autenticación
      clearAuthData();
      setUser(null);
      toast.success('Sesión cerrada exitosamente');
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        return false;
      }

      const response = await authApi.refreshToken(storedRefreshToken);
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;
        
        // Actualizar tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Actualizar usuario si es necesario
        if (userData) {
          setUser(userData);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const clearAuthData = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;