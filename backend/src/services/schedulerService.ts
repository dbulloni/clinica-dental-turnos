import cron from 'node-cron';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { notificationService } from './notificationService';
import { queueService } from './queueService';
import { NotificationType, AppointmentStatus, NotificationStatus } from '@prisma/client';
import { addHours, startOfDay, endOfDay, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduledTask {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  task: cron.ScheduledTask | null;
}

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Inicializar todas las tareas programadas
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Scheduler service already initialized');
      return;
    }

    try {
      // Configurar tareas programadas
      this.setupReminderTask();
      this.setupCleanupTask();
      this.setupHealthCheckTask();
      this.setupNotificationStatusUpdateTask();
      this.setupFailedJobRetryTask();

      this.isInitialized = true;
      logger.info('Scheduler service initialized successfully');
      
      // Log de tareas programadas
      this.logScheduledTasks();
    } catch (error) {
      logger.error('Error initializing scheduler service:', error);
      throw error;
    }
  }

  /**
   * Configurar tarea de recordatorios (cada hora)
   */
  private setupReminderTask(): void {
    const taskName = 'appointment-reminders';
    const schedule = '0 * * * *'; // Cada hora en punto

    const task = cron.schedule(
      schedule,
      async () => {
        await this.runReminderTask();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    this.tasks.set(taskName, {
      name: taskName,
      schedule,
      enabled: true,
      task,
    });

    logger.info(`Scheduled task: ${taskName} (${schedule})`);
  }

  /**
   * Configurar tarea de limpieza (diaria a las 2 AM)
   */
  private setupCleanupTask(): void {
    const taskName = 'daily-cleanup';
    const schedule = '0 2 * * *'; // Diario a las 2 AM

    const task = cron.schedule(
      schedule,
      async () => {
        await this.runCleanupTask();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    this.tasks.set(taskName, {
      name: taskName,
      schedule,
      enabled: true,
      task,
    });

    logger.info(`Scheduled task: ${taskName} (${schedule})`);
  }

  /**
   * Configurar tarea de health check (cada 5 minutos)
   */
  private setupHealthCheckTask(): void {
    const taskName = 'health-check';
    const schedule = '*/5 * * * *'; // Cada 5 minutos

    const task = cron.schedule(
      schedule,
      async () => {
        await this.runHealthCheckTask();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    this.tasks.set(taskName, {
      name: taskName,
      schedule,
      enabled: true,
      task,
    });

    logger.debug(`Scheduled task: ${taskName} (${schedule})`);
  }

  /**
   * Configurar tarea de actualización de estado de notificaciones (cada 10 minutos)
   */
  private setupNotificationStatusUpdateTask(): void {
    const taskName = 'notification-status-update';
    const schedule = '*/10 * * * *'; // Cada 10 minutos

    const task = cron.schedule(
      schedule,
      async () => {
        await this.runNotificationStatusUpdateTask();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    this.tasks.set(taskName, {
      name: taskName,
      schedule,
      enabled: true,
      task,
    });

    logger.debug(`Scheduled task: ${taskName} (${schedule})`);
  }

  /**
   * Configurar tarea de reintento de trabajos fallidos (cada 30 minutos)
   */
  private setupFailedJobRetryTask(): void {
    const taskName = 'failed-job-retry';
    const schedule = '*/30 * * * *'; // Cada 30 minutos

    const task = cron.schedule(
      schedule,
      async () => {
        await this.runFailedJobRetryTask();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    this.tasks.set(taskName, {
      name: taskName,
      schedule,
      enabled: true,
      task,
    });

    logger.debug(`Scheduled task: ${taskName} (${schedule})`);
  }

  /**
   * Ejecutar tarea de recordatorios
   */
  private async runReminderTask(): Promise<void> {
    const taskName = 'appointment-reminders';
    
    try {
      logger.debug(`Running task: ${taskName}`);
      
      // Obtener turnos para mañana que necesitan recordatorio
      const tomorrow = addHours(new Date(), 24);
      const startOfTomorrow = startOfDay(tomorrow);
      const endOfTomorrow = endOfDay(tomorrow);

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
          notifications: {
            where: {
              type: NotificationType.REMINDER,
              status: {
                in: [NotificationStatus.SENT, NotificationStatus.DELIVERED],
              },
            },
          },
        },
      });

      let remindersSent = 0;

      for (const appointment of appointments) {
        // Verificar si ya se envió recordatorio
        if (appointment.notifications.length > 0) {
          continue; // Ya se envió recordatorio
        }

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
          logger.error(`Error sending reminder for appointment ${appointment.id}:`, error);
        }
      }

      // Actualizar estadísticas de la tarea
      this.updateTaskStats(taskName, true);
      
      logger.info(`Reminder task completed: ${remindersSent} reminders sent for ${appointments.length} appointments`);
    } catch (error) {
      logger.error(`Error in reminder task:`, error);
      this.updateTaskStats(taskName, false, error as Error);
    }
  }

  /**
   * Ejecutar tarea de limpieza
   */
  private async runCleanupTask(): Promise<void> {
    const taskName = 'daily-cleanup';
    
    try {
      logger.debug(`Running task: ${taskName}`);
      
      let totalCleaned = 0;

      // Limpiar notificaciones antiguas (más de 30 días)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const oldNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: {
            in: [NotificationStatus.DELIVERED, NotificationStatus.FAILED],
          },
        },
      });
      totalCleaned += oldNotifications.count;

      // Limpiar trabajos fallidos de la cola
      const cleanedJobs = await queueService.cleanupFailedJobs(7);
      totalCleaned += cleanedJobs;

      // Limpiar logs antiguos (más de 90 días)
      // Esto se podría implementar si se guardan logs en base de datos

      // Actualizar estadísticas de la tarea
      this.updateTaskStats(taskName, true);
      
      logger.info(`Cleanup task completed: ${totalCleaned} items cleaned`);
    } catch (error) {
      logger.error(`Error in cleanup task:`, error);
      this.updateTaskStats(taskName, false, error as Error);
    }
  }

  /**
   * Ejecutar tarea de health check
   */
  private async runHealthCheckTask(): Promise<void> {
    const taskName = 'health-check';
    
    try {
      logger.debug(`Running task: ${taskName}`);
      
      // Verificar conexión a base de datos
      await prisma.$queryRaw`SELECT 1`;
      
      // Verificar estado de la cola
      const queueStats = await queueService.getQueueStats();
      
      // Log de advertencia si hay muchos trabajos fallidos
      if (queueStats.failed > 50) {
        logger.warn(`High number of failed jobs in queue: ${queueStats.failed}`);
      }
      
      // Log de advertencia si hay muchos trabajos pendientes
      if (queueStats.pending > 100) {
        logger.warn(`High number of pending jobs in queue: ${queueStats.pending}`);
      }

      this.updateTaskStats(taskName, true);
      logger.debug(`Health check completed successfully`);
    } catch (error) {
      logger.error(`Health check failed:`, error);
      this.updateTaskStats(taskName, false, error as Error);
    }
  }

  /**
   * Ejecutar tarea de actualización de estado de notificaciones
   */
  private async runNotificationStatusUpdateTask(): Promise<void> {
    const taskName = 'notification-status-update';
    
    try {
      logger.debug(`Running task: ${taskName}`);
      
      // Obtener notificaciones enviadas pero no entregadas (más de 1 hora)
      const oneHourAgo = subDays(new Date(), 0.04); // ~1 hora
      
      const pendingNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.SENT,
          sentAt: { lt: oneHourAgo },
        },
        take: 50, // Procesar máximo 50 por vez
      });

      let updatedCount = 0;

      for (const notification of pendingNotifications) {
        try {
          // Aquí se podría verificar el estado real con el proveedor
          // Por ahora, marcar como entregado después de 1 hora
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.DELIVERED,
              deliveredAt: new Date(),
            },
          });
          updatedCount++;
        } catch (error) {
          logger.error(`Error updating notification ${notification.id}:`, error);
        }
      }

      this.updateTaskStats(taskName, true);
      
      if (updatedCount > 0) {
        logger.info(`Notification status update completed: ${updatedCount} notifications updated`);
      }
    } catch (error) {
      logger.error(`Error in notification status update task:`, error);
      this.updateTaskStats(taskName, false, error as Error);
    }
  }

  /**
   * Ejecutar tarea de reintento de trabajos fallidos
   */
  private async runFailedJobRetryTask(): Promise<void> {
    const taskName = 'failed-job-retry';
    
    try {
      logger.debug(`Running task: ${taskName}`);
      
      // Obtener notificaciones fallidas que pueden reintentarse
      const failedNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: 3 }, // Máximo 3 reintentos
          updatedAt: { lt: subDays(new Date(), 0.02) }, // Esperar al menos 30 minutos
        },
        take: 10, // Procesar máximo 10 por vez
      });

      let retriedCount = 0;

      for (const notification of failedNotifications) {
        try {
          await notificationService.resendFailedNotification(notification.id);
          retriedCount++;
        } catch (error) {
          logger.error(`Error retrying notification ${notification.id}:`, error);
        }
      }

      this.updateTaskStats(taskName, true);
      
      if (retriedCount > 0) {
        logger.info(`Failed job retry completed: ${retriedCount} notifications retried`);
      }
    } catch (error) {
      logger.error(`Error in failed job retry task:`, error);
      this.updateTaskStats(taskName, false, error as Error);
    }
  }

  /**
   * Actualizar estadísticas de tarea
   */
  private updateTaskStats(taskName: string, success: boolean, error?: Error): void {
    const task = this.tasks.get(taskName);
    if (task) {
      task.lastRun = new Date();
      if (error) {
        logger.error(`Task ${taskName} failed:`, error);
      }
    }
  }

  /**
   * Obtener estado de todas las tareas
   */
  getTasksStatus(): Array<{
    name: string;
    schedule: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
    running: boolean;
  }> {
    return Array.from(this.tasks.values()).map(task => ({
      name: task.name,
      schedule: task.schedule,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.task?.nextDate()?.toDate(),
      running: task.task?.running || false,
    }));
  }

  /**
   * Habilitar/deshabilitar tarea
   */
  toggleTask(taskName: string, enabled: boolean): boolean {
    const task = this.tasks.get(taskName);
    if (!task) {
      return false;
    }

    if (enabled && !task.enabled) {
      task.task?.start();
      task.enabled = true;
      logger.info(`Task enabled: ${taskName}`);
    } else if (!enabled && task.enabled) {
      task.task?.stop();
      task.enabled = false;
      logger.info(`Task disabled: ${taskName}`);
    }

    return true;
  }

  /**
   * Ejecutar tarea manualmente
   */
  async runTaskManually(taskName: string): Promise<boolean> {
    const task = this.tasks.get(taskName);
    if (!task) {
      return false;
    }

    try {
      logger.info(`Running task manually: ${taskName}`);
      
      switch (taskName) {
        case 'appointment-reminders':
          await this.runReminderTask();
          break;
        case 'daily-cleanup':
          await this.runCleanupTask();
          break;
        case 'health-check':
          await this.runHealthCheckTask();
          break;
        case 'notification-status-update':
          await this.runNotificationStatusUpdateTask();
          break;
        case 'failed-job-retry':
          await this.runFailedJobRetryTask();
          break;
        default:
          return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error running task manually: ${taskName}`, error);
      return false;
    }
  }

  /**
   * Log de tareas programadas
   */
  private logScheduledTasks(): void {
    const tasks = this.getTasksStatus();
    logger.info('Scheduled tasks summary:');
    tasks.forEach(task => {
      logger.info(`  - ${task.name}: ${task.schedule} (enabled: ${task.enabled})`);
    });
  }

  /**
   * Detener todas las tareas
   */
  async stop(): Promise<void> {
    logger.info('Stopping scheduler service...');
    
    for (const [taskName, task] of this.tasks) {
      if (task.task) {
        task.task.stop();
        logger.debug(`Stopped task: ${taskName}`);
      }
    }
    
    this.tasks.clear();
    this.isInitialized = false;
    
    logger.info('Scheduler service stopped');
  }

  /**
   * Obtener estadísticas del scheduler
   */
  getSchedulerStats(): {
    initialized: boolean;
    totalTasks: number;
    enabledTasks: number;
    runningTasks: number;
  } {
    const tasks = Array.from(this.tasks.values());
    
    return {
      initialized: this.isInitialized,
      totalTasks: tasks.length,
      enabledTasks: tasks.filter(t => t.enabled).length,
      runningTasks: tasks.filter(t => t.task?.running).length,
    };
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;