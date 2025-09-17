import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '@/config/logger';

// Configuración base del rate limiter
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000),
      });
    },
    keyGenerator: (req: Request) => {
      // Usar IP del usuario, considerando proxies
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
  });
};

// Rate limiter general para la API
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos',
});

// Rate limiter estricto para autenticación
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login por ventana
  message: 'Demasiados intentos de inicio de sesión, intenta nuevamente en 15 minutos',
  skipSuccessfulRequests: true, // No contar logins exitosos
});

// Rate limiter para registro de usuarios (solo admin)
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 registros por hora
  message: 'Demasiados registros de usuario, intenta nuevamente en 1 hora',
});

// Rate limiter para recuperación de contraseña
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por hora
  message: 'Demasiadas solicitudes de recuperación de contraseña, intenta nuevamente en 1 hora',
});

// Rate limiter para creación de turnos
export const appointmentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 turnos por minuto
  message: 'Demasiadas solicitudes de turnos, intenta nuevamente en 1 minuto',
});

// Rate limiter para notificaciones
export const notificationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 notificaciones por minuto
  message: 'Demasiadas notificaciones enviadas, intenta nuevamente en 1 minuto',
});

// Rate limiter para búsquedas
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  message: 'Demasiadas búsquedas, intenta nuevamente en 1 minuto',
});

// Rate limiter personalizable por usuario autenticado
export const createUserBasedLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    ...options,
    keyGenerator: (req: Request) => {
      // Si el usuario está autenticado, usar su ID, sino usar IP
      return req.user?.userId || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response) => {
      const identifier = req.user?.email || req.ip;
      logger.warn(`Rate limit exceeded for user/IP: ${identifier}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000),
      });
    },
  });
};

// Rate limiter basado en usuario para operaciones sensibles
export const sensitiveOperationLimiter = createUserBasedLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // 5 operaciones por ventana
  message: 'Demasiadas operaciones sensibles, intenta nuevamente en 5 minutos',
});