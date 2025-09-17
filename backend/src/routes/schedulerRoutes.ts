import { Router } from 'express';
import { schedulerController } from '@/controllers/schedulerController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { sensitiveOperationLimiter } from '@/middleware/rateLimiter';
import { body, param } from 'express-validator';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);
router.use(requireAdmin); // Solo admin puede gestionar tareas programadas

/**
 * @route   GET /api/scheduler/status
 * @desc    Obtener estado de todas las tareas programadas
 * @access  Private (Admin only)
 */
router.get(
  '/status',
  schedulerController.getSchedulerStatus
);

/**
 * @route   GET /api/scheduler/stats
 * @desc    Obtener estadísticas del scheduler
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  schedulerController.getSchedulerStats
);

/**
 * @route   GET /api/scheduler/health
 * @desc    Verificar salud del sistema
 * @access  Private (Admin only)
 */
router.get(
  '/health',
  schedulerController.getSystemHealth
);

/**
 * @route   POST /api/scheduler/tasks/:taskName/toggle
 * @desc    Habilitar/deshabilitar una tarea específica
 * @access  Private (Admin only)
 */
router.post(
  '/tasks/:taskName/toggle',
  sensitiveOperationLimiter,
  [
    param('taskName')
      .notEmpty()
      .withMessage('Nombre de tarea requerido')
      .isIn([
        'appointment-reminders',
        'daily-cleanup',
        'health-check',
        'notification-status-update',
        'failed-job-retry',
      ])
      .withMessage('Nombre de tarea inválido'),
    body('enabled')
      .notEmpty()
      .withMessage('Estado habilitado requerido')
      .isBoolean()
      .withMessage('Estado habilitado debe ser un booleano'),
  ],
  schedulerController.toggleTask
);

/**
 * @route   POST /api/scheduler/tasks/:taskName/run
 * @desc    Ejecutar una tarea manualmente
 * @access  Private (Admin only)
 */
router.post(
  '/tasks/:taskName/run',
  sensitiveOperationLimiter,
  [
    param('taskName')
      .notEmpty()
      .withMessage('Nombre de tarea requerido')
      .isIn([
        'appointment-reminders',
        'daily-cleanup',
        'health-check',
        'notification-status-update',
        'failed-job-retry',
      ])
      .withMessage('Nombre de tarea inválido'),
  ],
  schedulerController.runTaskManually
);

/**
 * @route   POST /api/scheduler/send-reminders
 * @desc    Enviar recordatorios manualmente para una fecha específica
 * @access  Private (Admin only)
 */
router.post(
  '/send-reminders',
  sensitiveOperationLimiter,
  [
    body('date')
      .notEmpty()
      .withMessage('Fecha requerida')
      .isISO8601()
      .withMessage('Fecha debe ser una fecha válida')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + 30); // Máximo 30 días en el futuro
        
        if (date < now || date > maxDate) {
          throw new Error('La fecha debe estar entre hoy y 30 días en el futuro');
        }
        return true;
      }),
  ],
  schedulerController.sendRemindersManually
);

/**
 * @route   POST /api/scheduler/cleanup
 * @desc    Ejecutar limpieza manual
 * @access  Private (Admin only)
 */
router.post(
  '/cleanup',
  sensitiveOperationLimiter,
  [
    body('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Días debe ser un número entre 1 y 365'),
  ],
  schedulerController.runCleanupManually
);

export default router;