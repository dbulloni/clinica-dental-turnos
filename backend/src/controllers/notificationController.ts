import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { notificationService } from '@/services/notificationService';
import { whatsappService } from '@/services/whatsappService';
import { emailService } from '@/services/emailService';
import { queueService } from '@/services/queueService';
import { NotificationStatus, NotificationType, NotificationChannel } from '@prisma/client';
import { logger } from '@/config/logger';
import { parseISO } from 'date-fns';

class NotificationController {
  /**
   * POST /api/notifications/send-appointment
   * Enviar notificación de turno
   */
  async sendAppointmentNotification(req: Request, res: Response): Promise<void> {
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

      const { appointmentId, type, customMessage } = req.body;

      await notificationService.sendAppointmentNotification(
        appointmentId,
        type,
        customMessage
      );

      res.status(200).json({
        success: true,
        message: 'Notificación enviada exitosamente',
      });
    } catch (error) {
      logger.error('Error en sendAppointmentNotification controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Appointment not found') {
          res.status(404).json({
            success: false,
            message: 'Turno no encontrado',
            code: 'APPOINTMENT_NOT_FOUND',
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
   * POST /api/notifications/schedule-reminders
   * Programar recordatorios automáticos
   */
  async scheduleReminders(req: Request, res: Response): Promise<void> {
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

      const { appointmentId } = req.body;

      await notificationService.scheduleAppointmentReminders(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Recordatorios programados exitosamente',
      });
    } catch (error) {
      logger.error('Error en scheduleReminders controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Appointment not found') {
          res.status(404).json({
            success: false,
            message: 'Turno no encontrado',
            code: 'APPOINTMENT_NOT_FOUND',
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
   * GET /api/notifications
   * Obtener lista de notificaciones con filtros
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
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
        status,
        type,
        channel,
        patientId,
        startDate,
        endDate,
      } = req.query;

      const filters = {
        status: status as NotificationStatus,
        type: type as NotificationType,
        channel: channel as NotificationChannel,
        patientId: patientId as string,
        startDate: startDate ? parseISO(startDate as string) : undefined,
        endDate: endDate ? parseISO(endDate as string) : undefined,
      };

      const pagination = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await notificationService.getNotifications(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error en getNotifications controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/notifications/:id/resend
   * Reenviar notificación fallida
   */
  async resendNotification(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de notificación inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;

      await notificationService.resendFailedNotification(id);

      res.status(200).json({
        success: true,
        message: 'Notificación reenviada exitosamente',
      });
    } catch (error) {
      logger.error('Error en resendNotification controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Notification not found') {
          res.status(404).json({
            success: false,
            message: 'Notificación no encontrada',
            code: 'NOTIFICATION_NOT_FOUND',
          });
          return;
        }

        if (error.message === 'Only failed notifications can be resent') {
          res.status(400).json({
            success: false,
            message: 'Solo se pueden reenviar notificaciones fallidas',
            code: 'INVALID_NOTIFICATION_STATUS',
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
   * GET /api/notifications/stats
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await notificationService.getNotificationStats();

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getNotificationStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/notifications/queue-stats
   * Obtener estadísticas de la cola de mensajes
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const queueStats = await queueService.getQueueStats();
      const queueStatus = queueService.getServiceStatus();

      res.status(200).json({
        success: true,
        message: 'Estadísticas de cola obtenidas exitosamente',
        data: {
          stats: queueStats,
          status: queueStatus,
        },
      });
    } catch (error) {
      logger.error('Error en getQueueStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/notifications/service-status
   * Obtener estado de los servicios de notificación
   */
  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const whatsappStatus = whatsappService.getServiceStatus();
      const emailStatus = emailService.getServiceStatus();
      const queueStatus = queueService.getServiceStatus();

      res.status(200).json({
        success: true,
        message: 'Estado de servicios obtenido exitosamente',
        data: {
          whatsapp: whatsappStatus,
          email: emailStatus,
          queue: queueStatus,
        },
      });
    } catch (error) {
      logger.error('Error en getServiceStatus controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/notifications/test-whatsapp
   * Enviar mensaje de prueba por WhatsApp
   */
  async testWhatsApp(req: Request, res: Response): Promise<void> {
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

      const { phone, message } = req.body;

      const result = await whatsappService.sendMessage({
        to: phone,
        message: message || 'Mensaje de prueba desde el sistema de turnos.',
      });

      res.status(200).json({
        success: true,
        message: 'Mensaje de prueba enviado',
        data: result,
      });
    } catch (error) {
      logger.error('Error en testWhatsApp controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/notifications/test-email
   * Enviar email de prueba
   */
  async testEmail(req: Request, res: Response): Promise<void> {
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

      const { email, subject, message } = req.body;

      const result = await emailService.sendEmail({
        to: email,
        subject: subject || 'Mensaje de prueba',
        text: message || 'Este es un mensaje de prueba desde el sistema de turnos.',
      });

      res.status(200).json({
        success: true,
        message: 'Email de prueba enviado',
        data: result,
      });
    } catch (error) {
      logger.error('Error en testEmail controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/notifications/cleanup-failed
   * Limpiar notificaciones fallidas antiguas
   */
  async cleanupFailedNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.body;

      const removed = await queueService.cleanupFailedJobs(days);

      res.status(200).json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: {
          removedJobs: removed,
        },
      });
    } catch (error) {
      logger.error('Error en cleanupFailedNotifications controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;