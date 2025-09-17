import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { patientService } from '@/services/patientService';
import { logger } from '@/config/logger';

class PatientController {
  /**
   * POST /api/patients
   * Crear nuevo paciente
   */
  async createPatient(req: Request, res: Response): Promise<void> {
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

      const patientData = req.body;
      const patient = await patientService.createPatient(patientData);

      res.status(201).json({
        success: true,
        message: 'Paciente creado exitosamente',
        data: patient,
      });
    } catch (error) {
      logger.error('Error en createPatient controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('Ya existe un paciente')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_PATIENT',
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
   * GET /api/patients/:id
   * Obtener paciente por ID
   */
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de paciente inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const includeRelations = req.query.include === 'relations';
      
      const patient = await patientService.getPatientById(id, includeRelations);

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
          code: 'PATIENT_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Paciente obtenido exitosamente',
        data: patient,
      });
    } catch (error) {
      logger.error('Error en getPatientById controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/patients
   * Obtener lista de pacientes con filtros y paginación
   */
  async getPatients(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: errors.array(),
        });
        return;
      }

      const {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        isActive,
      } = req.query;

      const filters = {
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const pagination = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await patientService.getPatients(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Pacientes obtenidos exitosamente',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error en getPatients controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/patients/:id
   * Actualizar paciente
   */
  async updatePatient(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const updateData = req.body;

      const updatedPatient = await patientService.updatePatient(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Paciente actualizado exitosamente',
        data: updatedPatient,
      });
    } catch (error) {
      logger.error('Error en updatePatient controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Paciente no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PATIENT_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Ya existe un paciente')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_PATIENT',
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
   * DELETE /api/patients/:id
   * Eliminar paciente (soft delete)
   */
  async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de paciente inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      await patientService.deletePatient(id);

      res.status(200).json({
        success: true,
        message: 'Paciente eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error en deletePatient controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Paciente no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PATIENT_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('turnos programados')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'PATIENT_HAS_APPOINTMENTS',
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
   * GET /api/patients/search
   * Buscar pacientes (para autocompletado)
   */
  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido',
          code: 'MISSING_SEARCH_TERM',
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 10;
      const patients = await patientService.searchPatients(q, searchLimit);

      res.status(200).json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: patients,
      });
    } catch (error) {
      logger.error('Error en searchPatients controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/patients/:id/appointments
   * Obtener historial de turnos de un paciente
   */
  async getPatientAppointments(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de paciente inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      
      // Verificar que el paciente existe
      const patient = await patientService.getPatientById(id);
      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
          code: 'PATIENT_NOT_FOUND',
        });
        return;
      }

      const appointments = await patientService.getPatientAppointmentHistory(id);

      res.status(200).json({
        success: true,
        message: 'Historial de turnos obtenido exitosamente',
        data: appointments,
      });
    } catch (error) {
      logger.error('Error en getPatientAppointments controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/patients/check/document/:document
   * Verificar disponibilidad de documento
   */
  async checkDocumentAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { document } = req.params;
      const { excludeId } = req.query;

      if (!document) {
        res.status(400).json({
          success: false,
          message: 'Documento requerido',
          code: 'MISSING_DOCUMENT',
        });
        return;
      }

      const isAvailable = await patientService.isDocumentAvailable(
        document,
        excludeId as string
      );

      res.status(200).json({
        success: true,
        message: 'Verificación completada',
        data: {
          document,
          available: isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error en checkDocumentAvailability controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/patients/check/phone/:phone
   * Verificar disponibilidad de teléfono
   */
  async checkPhoneAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.params;
      const { excludeId } = req.query;

      if (!phone) {
        res.status(400).json({
          success: false,
          message: 'Teléfono requerido',
          code: 'MISSING_PHONE',
        });
        return;
      }

      const isAvailable = await patientService.isPhoneAvailable(
        phone,
        excludeId as string
      );

      res.status(200).json({
        success: true,
        message: 'Verificación completada',
        data: {
          phone,
          available: isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error en checkPhoneAvailability controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/patients/stats
   * Obtener estadísticas de pacientes
   */
  async getPatientStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await patientService.getPatientStats();

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getPatientStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const patientController = new PatientController();
export default patientController;