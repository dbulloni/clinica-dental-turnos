import { Router } from 'express';
import { appointmentController } from '@/controllers/appointmentController';
import { authenticate, requireStaff } from '@/middleware/auth';
import { appointmentLimiter } from '@/middleware/rateLimiter';
import {
  createAppointmentValidator,
  updateAppointmentValidator,
  idValidator,
  paginationValidator,
} from '@/utils/validators';
import { query, body, param } from 'express-validator';
import { AppointmentStatus } from '@prisma/client';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);
router.use(requireStaff); // Solo admin y secretaria pueden gestionar turnos

/**
 * @route   POST /api/appointments
 * @desc    Crear nuevo turno
 * @access  Private (Staff)
 */
router.post(
  '/',
  appointmentLimiter,
  createAppointmentValidator,
  appointmentController.createAppointment
);

/**
 * @route   GET /api/appointments
 * @desc    Obtener lista de turnos con filtros y paginación
 * @access  Private (Staff)
 */
router.get(
  '/',
  [
    ...paginationValidator,
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de fin debe ser una fecha válida'),
    query('professionalId')
      .optional()
      .isUUID()
      .withMessage('ID de profesional debe ser un UUID válido'),
    query('patientId')
      .optional()
      .isUUID()
      .withMessage('ID de paciente debe ser un UUID válido'),
    query('status')
      .optional()
      .isIn(Object.values(AppointmentStatus))
      .withMessage('Estado de turno inválido'),
    query('treatmentTypeId')
      .optional()
      .isUUID()
      .withMessage('ID de tipo de tratamiento debe ser un UUID válido'),
  ],
  appointmentController.getAppointments
);

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Obtener slots disponibles para un profesional en una fecha
 * @access  Private (Staff)
 */
router.get(
  '/available-slots',
  [
    query('professionalId')
      .notEmpty()
      .withMessage('ID de profesional requerido')
      .isUUID()
      .withMessage('ID de profesional debe ser un UUID válido'),
    query('date')
      .notEmpty()
      .withMessage('Fecha requerida')
      .isISO8601()
      .withMessage('Fecha debe ser una fecha válida'),
    query('treatmentTypeId')
      .optional()
      .isUUID()
      .withMessage('ID de tipo de tratamiento debe ser un UUID válido'),
  ],
  appointmentController.getAvailableSlots
);

/**
 * @route   GET /api/appointments/check-availability
 * @desc    Verificar disponibilidad de horario
 * @access  Private (Staff)
 */
router.get(
  '/check-availability',
  [
    query('professionalId')
      .notEmpty()
      .withMessage('ID de profesional requerido')
      .isUUID()
      .withMessage('ID de profesional debe ser un UUID válido'),
    query('startTime')
      .notEmpty()
      .withMessage('Hora de inicio requerida')
      .isISO8601()
      .withMessage('Hora de inicio debe ser una fecha válida'),
    query('endTime')
      .notEmpty()
      .withMessage('Hora de fin requerida')
      .isISO8601()
      .withMessage('Hora de fin debe ser una fecha válida'),
    query('excludeAppointmentId')
      .optional()
      .isUUID()
      .withMessage('ID de turno a excluir debe ser un UUID válido'),
  ],
  appointmentController.checkAvailability
);

/**
 * @route   GET /api/appointments/today
 * @desc    Obtener turnos del día
 * @access  Private (Staff)
 */
router.get(
  '/today',
  [
    query('professionalId')
      .optional()
      .isUUID()
      .withMessage('ID de profesional debe ser un UUID válido'),
  ],
  appointmentController.getTodayAppointments
);

/**
 * @route   GET /api/appointments/stats
 * @desc    Obtener estadísticas de turnos
 * @access  Private (Staff)
 */
router.get(
  '/stats',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de fin debe ser una fecha válida'),
  ],
  appointmentController.getAppointmentStats
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Obtener turno por ID
 * @access  Private (Staff)
 */
router.get(
  '/:id',
  idValidator,
  appointmentController.getAppointmentById
);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Actualizar turno
 * @access  Private (Staff)
 */
router.put(
  '/:id',
  [
    ...idValidator,
    ...updateAppointmentValidator,
  ],
  appointmentController.updateAppointment
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Cambiar estado de turno
 * @access  Private (Staff)
 */
router.patch(
  '/:id/status',
  [
    ...idValidator,
    body('status')
      .notEmpty()
      .withMessage('Estado requerido')
      .isIn(Object.values(AppointmentStatus))
      .withMessage('Estado de turno inválido'),
    body('observations')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Las observaciones no pueden exceder 1000 caracteres'),
  ],
  appointmentController.changeAppointmentStatus
);

export default router;