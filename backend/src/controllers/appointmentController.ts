import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentStatus } from '@prisma/client';
import { logger } from '@/config/logger';
import { parseISO } from 'date-fns';

class AppointmentController {
  /**
   * POST /api/appointments
   * Crear nuevo turno
   */
  async createAppointment(req: Request, res: Response): Promise<void> {
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

      const appointmentData = {
        ...req.body,
        createdById: req.user!.userId,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };

      const appointment = await appointmentService.createAppointment(appointmentData);

      res.status(201).json({
        success: true,
        message: 'Turno creado exitosamente',
        data: appointment,
      });
    } catch (error) {
      logger.error('Error en createAppointment controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('no encontrado') || error.message.includes('inactivo')) {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'RESOURCE_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('no está disponible') || error.message.includes('no válido')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'SCHEDULE_CONFLICT',
          });
          return;
        }

        if (error.message.includes('horario de trabajo')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'OUTSIDE_WORKING_HOURS',
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
   * GET /api/appointments/:id
   * Obtener turno por ID
   */
  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de turno inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(id);

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Turno no encontrado',
          code: 'APPOINTMENT_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Turno obtenido exitosamente',
        data: appointment,
      });
    } catch (error) {
      logger.error('Error en getAppointmentById controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/appointments
   * Obtener lista de turnos con filtros y paginación
   */
  async getAppointments(req: Request, res: Response): Promise<void> {
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
        startDate,
        endDate,
        professionalId,
        patientId,
        status,
        treatmentTypeId,
      } = req.query;

      const filters = {
        startDate: startDate ? parseISO(startDate as string) : undefined,
        endDate: endDate ? parseISO(endDate as string) : undefined,
        professionalId: professionalId as string,
        patientId: patientId as string,
        status: status as AppointmentStatus,
        treatmentTypeId: treatmentTypeId as string,
      };

      const pagination = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await appointmentService.getAppointments(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Turnos obtenidos exitosamente',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error en getAppointments controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/appointments/:id
   * Actualizar turno
   */
  async updateAppointment(req: Request, res: Response): Promise<void> {
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
      const updateData = {
        ...req.body,
        ...(req.body.startTime && { startTime: new Date(req.body.startTime) }),
        ...(req.body.endTime && { endTime: new Date(req.body.endTime) }),
      };

      const updatedAppointment = await appointmentService.updateAppointment(
        id,
        updateData,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        message: 'Turno actualizado exitosamente',
        data: updatedAppointment,
      });
    } catch (error) {
      logger.error('Error en updateAppointment controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Turno no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'APPOINTMENT_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('no está disponible')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'SCHEDULE_CONFLICT',
          });
          return;
        }

        if (error.message.includes('horario de trabajo')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'OUTSIDE_WORKING_HOURS',
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
   * PATCH /api/appointments/:id/status
   * Cambiar estado de turno
   */
  async changeAppointmentStatus(req: Request, res: Response): Promise<void> {
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
      const { status, observations } = req.body;

      const updatedAppointment = await appointmentService.changeAppointmentStatus(
        id,
        status,
        req.user!.userId,
        observations
      );

      res.status(200).json({
        success: true,
        message: 'Estado del turno actualizado exitosamente',
        data: updatedAppointment,
      });
    } catch (error) {
      logger.error('Error en changeAppointmentStatus controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Turno no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'APPOINTMENT_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Transición de estado inválida')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'INVALID_STATUS_TRANSITION',
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
   * GET /api/appointments/available-slots
   * Obtener slots disponibles para un profesional en una fecha
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
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

      const { professionalId, date, treatmentTypeId } = req.query;

      const slots = await appointmentService.getAvailableSlots(
        professionalId as string,
        parseISO(date as string),
        treatmentTypeId as string
      );

      res.status(200).json({
        success: true,
        message: 'Slots disponibles obtenidos exitosamente',
        data: slots,
      });
    } catch (error) {
      logger.error('Error en getAvailableSlots controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/appointments/check-availability
   * Verificar disponibilidad de horario
   */
  async checkAvailability(req: Request, res: Response): Promise<void> {
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

      const { professionalId, startTime, endTime, excludeAppointmentId } = req.query;

      const isAvailable = await appointmentService.checkAvailability(
        professionalId as string,
        new Date(startTime as string),
        new Date(endTime as string),
        excludeAppointmentId as string
      );

      res.status(200).json({
        success: true,
        message: 'Verificación de disponibilidad completada',
        data: {
          available: isAvailable,
        },
      });
    } catch (error) {
      logger.error('Error en checkAvailability controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/appointments/today
   * Obtener turnos del día
   */
  async getTodayAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { professionalId } = req.query;

      const appointments = await appointmentService.getTodayAppointments(
        professionalId as string
      );

      res.status(200).json({
        success: true,
        message: 'Turnos del día obtenidos exitosamente',
        data: appointments,
      });
    } catch (error) {
      logger.error('Error en getTodayAppointments controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/appointments/stats
   * Obtener estadísticas de turnos
   */
  async getAppointmentStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const stats = await appointmentService.getAppointmentStats(
        startDate ? parseISO(startDate as string) : undefined,
        endDate ? parseISO(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getAppointmentStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const appointmentController = new AppointmentController();
export default appointmentController;