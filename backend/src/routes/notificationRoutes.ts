import { Router } from 'express';
import { notificationController } from '@/controllers/notificationController';
import { authenticate, requireStaff, requireAdmin } from '@/middleware/auth';
import { notificationLimiter } from '@/middleware/rateLimiter';
import { idValidator, paginationValidator } from '@/utils/validators';
import { body, query } from 'express-validator';
import { NotificationStatus, NotificationType, NotificationChannel } from '@prisma/client';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);
router.use(requireStaff); // Solo admin y secretaria pueden gestionar notificaciones

/**
 * @route   POST /api/notifications/send-appointment
 * @desc    Enviar notificación de turno
 * @access  Private (Staff)
 */
router.post(
  '/send-appointment',
  notificationLimiter,
  [
    body('appointmentId')
      .notEmpty()
      .withMessage('ID de turno requerido')
      .isUUID()
      .withMessage('ID de turno debe ser un UUID válido'),
    body('type')
      .notEmpty()
      .withMessage('Tipo de notificación requerido')
      .isIn(Object.values(NotificationType))
      .withMessage('Tipo de notificación inválido'),
    body('customMessage')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Mensaje personalizado no puede exceder 1000 caracteres'),
  ],
  notificationController.sendAppointmentNotification
);

/**
 * @route   POST /api/notifications/schedule-reminders
 * @desc    Programar recordatorios automáticos
 * @access  Private (Staff)
 */
router.post(
  '/schedule-reminders',
  [
    body('appointmentId')
      .notEmpty()
      .withMessage('ID de turno requerido')
      .isUUID()
      .withMessage('ID de turno debe ser un UUID válido'),
  ],
  notificationController.scheduleReminders
);

/**
 * @route   GET /api/notifications
 * @desc    Obtener lista de notificaciones con filtros
 * @access  Private (Staff)
 */
router.get(
  '/',
  [
    ...paginationValidator,
    query('status')
      .optional()
      .isIn(Object.values(NotificationStatus))
      .withMessage('Estado de notificación inválido'),
    query('type')
      .optional()
      .isIn(Object.values(NotificationType))
      .withMessage('Tipo de notificación inválido'),
    query('channel')
      .optional()
      .isIn(Object.values(NotificationChannel))
      .withMessage('Canal de notificación inválido'),
    query('patientId')
      .optional()
      .isUUID()
      .withMessage('ID de paciente debe ser un UUID válido'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de fin debe ser una fecha válida'),
  ],
  notificationController.getNotifications
);

/**
 * @route   POST /api/notifications/:id/resend
 * @desc    Reenviar notificación fallida
 * @access  Private (Staff)
 */
router.post(
  '/:id/resend',
  notificationLimiter,
  idValidator,
  notificationController.resendNotification
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtener estadísticas de notificaciones
 * @access  Private (Staff)
 */
router.get(
  '/stats',
  notificationController.getNotificationStats
);

/**
 * @route   GET /api/notifications/queue-stats
 * @desc    Obtener estadísticas de la cola de mensajes
 * @access  Private (Staff)
 */
router.get(
  '/queue-stats',
  notificationController.getQueueStats
);

/**
 * @route   GET /api/notifications/service-status
 * @desc    Obtener estado de los servicios de notificación
 * @access  Private (Staff)
 */
router.get(
  '/service-status',
  notificationController.getServiceStatus
);

/**
 * @route   POST /api/notifications/test-whatsapp
 * @desc    Enviar mensaje de prueba por WhatsApp
 * @access  Private (Admin only)
 */
router.post(
  '/test-whatsapp',
  requireAdmin,
  notificationLimiter,
  [
    body('phone')
      .notEmpty()
      .withMessage('Número de teléfono requerido')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Número de teléfono inválido (formato internacional)'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Mensaje no puede exceder 1000 caracteres'),
  ],
  notificationController.testWhatsApp
);

/**
 * @route   POST /api/notifications/test-email
 * @desc    Enviar email de prueba
 * @access  Private (Admin only)
 */
router.post(
  '/test-email',
  requireAdmin,
  notificationLimiter,
  [
    body('email')
      .notEmpty()
      .withMessage('Email requerido')
      .isEmail()
      .withMessage('Email debe ser válido')
      .normalizeEmail(),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Asunto no puede exceder 200 caracteres'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Mensaje no puede exceder 2000 caracteres'),
  ],
  notificationController.testEmail
);

/**
 * @route   POST /api/notifications/cleanup-failed
 * @desc    Limpiar notificaciones fallidas antiguas
 * @access  Private (Admin only)
 */
router.post(
  '/cleanup-failed',
  requireAdmin,
  [
    body('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Días debe ser un número entre 1 y 365'),
  ],
  notificationController.cleanupFailedNotifications
);

export default router;