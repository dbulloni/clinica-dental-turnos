import { body, param, query } from 'express-validator';
import { UserRole, AppointmentStatus, NotificationType, NotificationChannel } from '@prisma/client';

// Validadores para User
export const createUserValidator = [
  body('email')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Rol inválido'),
];

export const updateUserValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
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
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Rol inválido'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

// Validadores para Patient
export const createPatientValidator = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Número de teléfono inválido (formato internacional)'),
  body('document')
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('El documento debe tener entre 7 y 20 caracteres')
    .isAlphanumeric()
    .withMessage('El documento solo puede contener letras y números'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 120 || birthDate > today) {
        throw new Error('Fecha de nacimiento inválida');
      }
      return true;
    }),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
];

export const updatePatientValidator = [
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
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Número de teléfono inválido (formato internacional)'),
  body('document')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('El documento debe tener entre 7 y 20 caracteres')
    .isAlphanumeric()
    .withMessage('El documento solo puede contener letras y números'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

// Validadores para Professional
export const createProfessionalValidator = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Número de teléfono inválido (formato internacional)'),
  body('license')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('La matrícula debe tener entre 3 y 20 caracteres'),
  body('specialties')
    .isArray({ min: 1 })
    .withMessage('Debe especificar al menos una especialidad')
    .custom((specialties) => {
      if (!specialties.every((s: any) => typeof s === 'string' && s.trim().length > 0)) {
        throw new Error('Todas las especialidades deben ser strings válidos');
      }
      return true;
    }),
];

export const updateProfessionalValidator = [
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
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Número de teléfono inválido (formato internacional)'),
  body('license')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('La matrícula debe tener entre 3 y 20 caracteres'),
  body('specialties')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Debe especificar al menos una especialidad'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
];

// Validadores para TreatmentType
export const createTreatmentTypeValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('duration')
    .isInt({ min: 5, max: 480 })
    .withMessage('La duración debe ser entre 5 y 480 minutos'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe ser un código hexadecimal válido'),
  body('professionalId')
    .isUUID()
    .withMessage('ID de profesional inválido'),
];

// Validadores para Appointment
export const createAppointmentValidator = [
  body('startTime')
    .isISO8601()
    .withMessage('Fecha y hora de inicio inválida')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('La fecha del turno debe ser futura');
      }
      return true;
    }),
  body('endTime')
    .isISO8601()
    .withMessage('Fecha y hora de fin inválida')
    .custom((value, { req }) => {
      const endTime = new Date(value);
      const startTime = new Date(req.body.startTime);
      if (endTime <= startTime) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),
  body('patientId')
    .isUUID()
    .withMessage('ID de paciente inválido'),
  body('professionalId')
    .isUUID()
    .withMessage('ID de profesional inválido'),
  body('treatmentTypeId')
    .isUUID()
    .withMessage('ID de tipo de tratamiento inválido'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
];

export const updateAppointmentValidator = [
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Fecha y hora de inicio inválida'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Fecha y hora de fin inválida'),
  body('status')
    .optional()
    .isIn(Object.values(AppointmentStatus))
    .withMessage('Estado de turno inválido'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
  body('observations')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las observaciones no pueden exceder 1000 caracteres'),
];

// Validadores para WorkingHour
export const createWorkingHourValidator = [
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Día de la semana debe ser entre 0 (domingo) y 6 (sábado)'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio inválida (formato HH:MM)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin inválida (formato HH:MM)')
    .custom((value, { req }) => {
      const [startHour, startMin] = req.body.startTime.split(':').map(Number);
      const [endHour, endMin] = value.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),
  body('professionalId')
    .isUUID()
    .withMessage('ID de profesional inválido'),
];

// Validadores comunes
export const idValidator = [
  param('id')
    .isUUID()
    .withMessage('ID inválido'),
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy debe ser un string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder debe ser "asc" o "desc"'),
];

// Validador para login
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('La contraseña es requerida'),
];