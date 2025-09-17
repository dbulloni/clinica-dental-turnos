import { Router } from 'express';
import { patientController } from '@/controllers/patientController';
import { authenticate, requireStaff } from '@/middleware/auth';
import { searchLimiter } from '@/middleware/rateLimiter';
import {
  createPatientValidator,
  updatePatientValidator,
  idValidator,
  paginationValidator,
} from '@/utils/validators';
import { query, param } from 'express-validator';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);
router.use(requireStaff); // Solo admin y secretaria pueden gestionar pacientes

/**
 * @route   POST /api/patients
 * @desc    Crear nuevo paciente
 * @access  Private (Staff)
 */
router.post(
  '/',
  createPatientValidator,
  patientController.createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Obtener lista de pacientes con filtros y paginación
 * @access  Private (Staff)
 */
router.get(
  '/',
  [
    ...paginationValidator,
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
    query('isActive')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isActive debe ser true o false'),
  ],
  patientController.getPatients
);

/**
 * @route   GET /api/patients/search
 * @desc    Buscar pacientes (para autocompletado)
 * @access  Private (Staff)
 */
router.get(
  '/search',
  searchLimiter,
  [
    query('q')
      .notEmpty()
      .withMessage('Parámetro de búsqueda requerido')
      .isLength({ min: 2, max: 50 })
      .withMessage('Búsqueda debe tener entre 2 y 50 caracteres'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Límite debe ser entre 1 y 50'),
  ],
  patientController.searchPatients
);

/**
 * @route   GET /api/patients/stats
 * @desc    Obtener estadísticas de pacientes
 * @access  Private (Staff)
 */
router.get(
  '/stats',
  patientController.getPatientStats
);

/**
 * @route   GET /api/patients/check/document/:document
 * @desc    Verificar disponibilidad de documento
 * @access  Private (Staff)
 */
router.get(
  '/check/document/:document',
  [
    param('document')
      .trim()
      .isLength({ min: 7, max: 20 })
      .withMessage('El documento debe tener entre 7 y 20 caracteres')
      .isAlphanumeric()
      .withMessage('El documento solo puede contener letras y números'),
    query('excludeId')
      .optional()
      .isUUID()
      .withMessage('excludeId debe ser un UUID válido'),
  ],
  patientController.checkDocumentAvailability
);

/**
 * @route   GET /api/patients/check/phone/:phone
 * @desc    Verificar disponibilidad de teléfono
 * @access  Private (Staff)
 */
router.get(
  '/check/phone/:phone',
  [
    param('phone')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Número de teléfono inválido (formato internacional)'),
    query('excludeId')
      .optional()
      .isUUID()
      .withMessage('excludeId debe ser un UUID válido'),
  ],
  patientController.checkPhoneAvailability
);

/**
 * @route   GET /api/patients/:id
 * @desc    Obtener paciente por ID
 * @access  Private (Staff)
 */
router.get(
  '/:id',
  [
    ...idValidator,
    query('include')
      .optional()
      .isIn(['relations'])
      .withMessage('include debe ser "relations"'),
  ],
  patientController.getPatientById
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Actualizar paciente
 * @access  Private (Staff)
 */
router.put(
  '/:id',
  [
    ...idValidator,
    ...updatePatientValidator,
  ],
  patientController.updatePatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Eliminar paciente (soft delete)
 * @access  Private (Staff)
 */
router.delete(
  '/:id',
  idValidator,
  patientController.deletePatient
);

/**
 * @route   GET /api/patients/:id/appointments
 * @desc    Obtener historial de turnos de un paciente
 * @access  Private (Staff)
 */
router.get(
  '/:id/appointments',
  idValidator,
  patientController.getPatientAppointments
);

export default router;