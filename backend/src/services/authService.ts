import { User, UserRole } from '@prisma/client';
import { prisma } from '@/config/database';
import { hashPassword, comparePassword, validatePasswordStrength } from '@/utils/password';
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '@/config/jwt';
import { logger } from '@/config/logger';

// Interfaces para el servicio
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  /**
   * Autenticar usuario con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    try {
      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      if (!user.isActive) {
        throw new Error('Usuario inactivo');
      }

      // Verificar contraseña
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Generar tokens
      const userPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      const tokens = generateTokenPair(userPayload);

      logger.info(`Usuario ${user.email} inició sesión exitosamente`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario (solo admin puede crear usuarios)
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role = UserRole.SECRETARY } = userData;

    try {
      // Validar fortaleza de contraseña
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Contraseña no cumple los requisitos: ${passwordValidation.errors.join(', ')}`);
      }

      // Verificar que el email no esté en uso
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Hashear contraseña
      const hashedPassword = await hashPassword(password);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Generar tokens
      const userPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      const tokens = generateTokenPair(userPayload);

      logger.info(`Nuevo usuario registrado: ${user.email} con rol ${user.role}`);

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Refrescar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verificar refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new Error('Usuario inactivo');
      }

      // Generar nuevos tokens
      const userPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      const tokens = generateTokenPair(userPayload, payload.tokenVersion);

      logger.info(`Tokens refrescados para usuario: ${user.email}`);

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Error refrescando tokens:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de usuario autenticado
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    const { userId, currentPassword, newPassword } = request;

    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Validar nueva contraseña
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Nueva contraseña no cumple los requisitos: ${passwordValidation.errors.join(', ')}`);
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await comparePassword(newPassword, user.password);
      if (isSamePassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await hashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  ): Promise<Omit<User, 'password'>> {
    try {
      // Si se actualiza el email, verificar que no esté en uso
      if (updates.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: updates.email.toLowerCase(),
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          throw new Error('El email ya está en uso por otro usuario');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updates.firstName && { firstName: updates.firstName.trim() }),
          ...(updates.lastName && { lastName: updates.lastName.trim() }),
          ...(updates.email && { email: updates.email.toLowerCase() }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Perfil actualizado para usuario: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  /**
   * Validar si un token es válido (para health checks)
   */
  async validateToken(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true },
      });

      return user?.isActive || false;
    } catch (error) {
      logger.error('Error validando token:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;