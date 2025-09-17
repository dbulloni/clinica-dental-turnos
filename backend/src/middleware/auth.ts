import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '@/config/jwt';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado con un token válido
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    // Verificar el token
    const payload = verifyAccessToken(token);

    // Verificar que el usuario aún existe y está activo
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
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuario inactivo',
        code: 'USER_INACTIVE',
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Token expirado') {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }
      
      if (error.message === 'Token inválido') {
        res.status(401).json({
          success: false,
          message: 'Token inválido',
          code: 'INVALID_TOKEN',
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
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles permitidos
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Usuario ${req.user.email} intentó acceder a recurso sin permisos. Rol: ${req.user.role}, Roles permitidos: ${allowedRoles.join(', ')}`);
      
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware que requiere rol de administrador
 */
export const requireAdmin = authorize([UserRole.ADMIN]);

/**
 * Middleware que permite admin y secretaria
 */
export const requireStaff = authorize([UserRole.ADMIN, UserRole.SECRETARY]);

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega user si está presente
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    
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

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // En autenticación opcional, los errores no detienen la ejecución
    logger.debug('Error en autenticación opcional:', error);
    next();
  }
};