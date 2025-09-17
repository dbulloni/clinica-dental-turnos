import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { schedulerService } from '@/services/schedulerService';
import { logger } from '@/config/logger';

class SchedulerController {
  /**
   * GET /api/scheduler/status
   * Obtener estado de todas las tareas programadas
   */
  async getSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      const tasks = schedulerService.getTasksStatus();
      const stats = schedulerService.getSchedulerStats();

      res.status(200).json({
        success: true,
        message: 'Estado del scheduler obtenido exitosamente',
        data: {
          stats,
          tasks,
        },
      });
    } catch (error) {
      logger.error('Error en getSchedulerStatus controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/scheduler/tasks/:taskName/toggle
   * Habilitar/deshabilitar una tarea específica
   */
  async toggleTask(req: Request, res: Response): Promise<void> {
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

      const { taskName } = req.params;
      const { enabled } = req.body;

      const success = schedulerService.toggleTask(taskName, enabled);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Tarea no encontrada',
          code: 'TASK_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Tarea ${enabled ? 'habilitada' : 'deshabilitada'} exitosamente`,
        data: {
          taskName,
          enabled,
        },
      });
    } catch (error) {
      logger.error('Error en toggleTask controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/scheduler/tasks/:taskName/run
   * Ejecutar una tarea manualmente
   */
  async runTaskManually(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Nombre de tarea inválido',
          errors: errors.array(),
        });
        return;
      }

      const { taskName } = req.params;

      logger.info(`Manual task execution requested by user ${req.user?.email}: ${taskName}`);

      const success = await schedulerService.runTaskManually(taskName);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Tarea no encontrada o error en ejecución',
          code: 'TASK_EXECUTION_FAILED',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Tarea ejecutada exitosamente',
        data: {
          taskName,
          executedAt: new Date(),
          executedBy: req.user?.email,
        },
      });
    } catch (error) {
      logger.error('Error en runTaskManually controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/scheduler/stats
   * Obtener estadísticas del scheduler
   */
  async getSchedulerStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = schedulerService.getSchedulerStats();

      res.status(200).json({
        success: true,
        message: 'Estadísticas del scheduler obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getSchedulerStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/scheduler/send-reminders
   * Enviar recordatorios manualmente para una fecha específica
   */
  async sendRemindersManually(req: Request, res: Response): Promise<void> {
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

      const { date } = req.body;
      const targetDate = new Date(date);

      logger.info(`Manual reminder sending requested by user ${req.user?.email} for date: ${date}`);

      // Importar servicios necesarios
      const { notificationService } = await import('@/services/notificationService');
      const { prisma } = await import('@/config/database');
      const { startOfDay, endOfDay } = await import('date-fns');
      const { AppointmentStatus, NotificationType } = await import('@prisma/client');

      // Obtener turnos para la fecha especificada
      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        include: {
          patient: true,
        },
      });

      let remindersSent = 0;
      const errors: string[] = [];

      for (const appointment of appointments) {
        // Verificar que el paciente tenga métodos de contacto
        if (!appointment.patient.phone && !appointment.patient.email) {
          continue;
        }

        try {
          await notificationService.sendAppointmentNotification(
            appointment.id,
            NotificationType.REMINDER
          );
          remindersSent++;
        } catch (error) {
          const errorMsg = `Error enviando recordatorio para turno ${appointment.id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Recordatorios enviados exitosamente',
        data: {
          date,
          totalAppointments: appointments.length,
          remindersSent,
          errors: errors.length > 0 ? errors : undefined,
          executedBy: req.user?.email,
          executedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error en sendRemindersManually controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/scheduler/cleanup
   * Ejecutar limpieza manual
   */
  async runCleanupManually(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.body;

      logger.info(`Manual cleanup requested by user ${req.user?.email} for ${days} days`);

      // Importar servicios necesarios
      const { prisma } = await import('@/config/database');
      const { queueService } = await import('@/services/queueService');
      const { subDays } = await import('date-fns');
      const { NotificationStatus } = await import('@prisma/client');

      let totalCleaned = 0;

      // Limpiar notificaciones antiguas
      const cutoffDate = subDays(new Date(), days);
      const oldNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: {
            in: [NotificationStatus.DELIVERED, NotificationStatus.FAILED],
          },
        },
      });
      totalCleaned += oldNotifications.count;

      // Limpiar trabajos fallidos de la cola
      const cleanedJobs = await queueService.cleanupFailedJobs(Math.floor(days / 4)); // 1/4 del tiempo para jobs
      totalCleaned += cleanedJobs;

      res.status(200).json({
        success: true,
        message: 'Limpieza ejecutada exitosamente',
        data: {
          days,
          totalCleaned,
          notificationsCleaned: oldNotifications.count,
          jobsCleaned: cleanedJobs,
          executedBy: req.user?.email,
          executedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error en runCleanupManually controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/scheduler/health
   * Verificar salud del sistema
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      // Verificar conexión a base de datos
      const { prisma } = await import('@/config/database');
      await prisma.$queryRaw`SELECT 1`;

      // Verificar estado de servicios
      const { queueService } = await import('@/services/queueService');
      const { whatsappService } = await import('@/services/whatsappService');
      const { emailService } = await import('@/services/emailService');

      const queueStats = await queueService.getQueueStats();
      const queueStatus = queueService.getServiceStatus();
      const whatsappStatus = whatsappService.getServiceStatus();
      const emailStatus = emailService.getServiceStatus();
      const schedulerStats = schedulerService.getSchedulerStats();

      // Determinar estado general
      const isHealthy = 
        queueStatus.connected &&
        schedulerStats.initialized &&
        (whatsappStatus.enabled || emailStatus.enabled);

      const warnings: string[] = [];
      
      if (queueStats.failed > 50) {
        warnings.push(`Alto número de trabajos fallidos: ${queueStats.failed}`);
      }
      
      if (queueStats.pending > 100) {
        warnings.push(`Alto número de trabajos pendientes: ${queueStats.pending}`);
      }
      
      if (!whatsappStatus.enabled && !emailStatus.enabled) {
        warnings.push('Ningún canal de notificación está habilitado');
      }

      res.status(200).json({
        success: true,
        message: 'Verificación de salud completada',
        data: {
          healthy: isHealthy,
          timestamp: new Date(),
          services: {
            database: { status: 'connected' },
            queue: queueStatus,
            whatsapp: whatsappStatus,
            email: emailStatus,
            scheduler: schedulerStats,
          },
          queue: queueStats,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      });
    } catch (error) {
      logger.error('Error en getSystemHealth controller:', error);

      res.status(503).json({
        success: false,
        message: 'Sistema no saludable',
        code: 'SYSTEM_UNHEALTHY',
        data: {
          healthy: false,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

export const schedulerController = new SchedulerController();
export default schedulerController;