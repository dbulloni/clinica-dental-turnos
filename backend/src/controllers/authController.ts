import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '@/services/authService';
import { logger } from '@/config/logger';

class AuthController {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (error) {
      logger.error('Error en login controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Credenciales inválidas' || error.message === 'Usuario inactivo') {
          res.status(401).json({
            success: false,
            message: error.message,
            code: 'INVALID_CREDENTIALS',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/auth/register
   * Registrar nuevo usuario (solo admin)
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { email, password, firstName, lastName, role } = req.body;

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      logger.error('Error en register controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('email ya está registrado')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'EMAIL_ALREADY_EXISTS',
          });
          return;
        }

        if (error.message.includes('Contraseña no cumple los requisitos')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'WEAK_PASSWORD',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refrescar tokens
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token requerido',
          code: 'MISSING_REFRESH_TOKEN',
        });
        return;
      }

      const result = await authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Tokens refrescados exitosamente',
        data: result,
      });
    } catch (error) {
      logger.error('Error en refresh token controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('token')) {
          res.status(401).json({
            success: false,
            message: error.message,
            code: 'INVALID_REFRESH_TOKEN',
          });
          return;
        }

        if (error.message === 'Usuario no encontrado' || error.message === 'Usuario inactivo') {
          res.status(401).json({
            success: false,
            message: error.message,
            code: 'USER_NOT_FOUND',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión (invalidar tokens)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // En una implementación más compleja, aquí se invalidarían los tokens
      // Por ahora, simplemente confirmamos el logout
      
      logger.info(`Usuario ${req.user?.email} cerró sesión`);

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      logger.error('Error en logout controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.userId;

      await authService.changePassword({
        userId,
        currentPassword,
        newPassword,
      });

      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente',
      });
    } catch (error) {
      logger.error('Error en change password controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Contraseña actual incorrecta') {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'INVALID_CURRENT_PASSWORD',
          });
          return;
        }

        if (error.message.includes('Nueva contraseña no cumple los requisitos')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'WEAK_PASSWORD',
          });
          return;
        }

        if (error.message === 'La nueva contraseña debe ser diferente a la actual') {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'SAME_PASSWORD',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: profile,
      });
    } catch (error) {
      logger.error('Error en get profile controller:', error);

      if (error instanceof Error && error.message === 'Usuario no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Actualizar perfil del usuario autenticado
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const { firstName, lastName, email } = req.body;

      const updatedProfile = await authService.updateProfile(userId, {
        firstName,
        lastName,
        email,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedProfile,
      });
    } catch (error) {
      logger.error('Error en update profile controller:', error);

      if (error instanceof Error) {
        if (error.message === 'El email ya está en uso por otro usuario') {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'EMAIL_ALREADY_EXISTS',
          });
          return;
        }

        if (error.message === 'Usuario no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'USER_NOT_FOUND',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/auth/validate
   * Validar token actual
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const isValid = await authService.validateToken(userId);

      if (!isValid) {
        res.status(401).json({
          success: false,
          message: 'Token inválido o usuario inactivo',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user,
          valid: true,
        },
      });
    } catch (error) {
      logger.error('Error en validate token controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const authController = new AuthController();
export default authController;