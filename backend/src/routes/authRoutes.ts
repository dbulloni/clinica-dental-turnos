import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { 
  authLimiter, 
  registerLimiter, 
  passwordResetLimiter,
  sensitiveOperationLimiter 
} from '@/middleware/rateLimiter';
import { 
  loginValidator, 
  createUserValidator,
  updateUserValidator 
} from '@/utils/validators';
import { body } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidator,
  authController.login
);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario (solo admin)
 * @access  Private (Admin only)
 */
router.post(
  '/register',
  registerLimiter,
  authenticate,
  requireAdmin,
  createUserValidator,
  authController.register
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar tokens de acceso
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token es requerido'),
  ],
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post(
  '/change-password',
  sensitiveOperationLimiter,
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  ],
  authController.changePassword
);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email debe ser válido')
      .normalizeEmail(),
  ],
  authController.updateProfile
);

/**
 * @route   GET /api/auth/validate
 * @desc    Validar token actual
 * @access  Private
 */
router.get(
  '/validate',
  authenticate,
  authController.validateToken
);

export default router;