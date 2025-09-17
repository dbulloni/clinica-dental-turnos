import Redis from 'ioredis';
import { logger } from '@/config/logger';
import config from '@/config/env';

interface QueueJob {
  id: string;
  type: string;
  data: any;
  priority?: number;
  delay?: number;
  maxRetries?: number;
  retryCount?: number;
  createdAt: Date;
  scheduledAt?: Date;
}

interface QueueOptions {
  priority?: number;
  delay?: number;
  maxRetries?: number;
}

class QueueService {
  private redis: Redis | null = null;
  private isEnabled: boolean;
  private readonly queueKey = 'notification_queue';
  private readonly processingKey = 'notification_processing';
  private readonly failedKey = 'notification_failed';
  private isProcessing = false;

  constructor() {
    this.isEnabled = config.features.redisEnabled;
    
    if (this.isEnabled) {
      try {
        this.redis = new Redis(config.redis.url);
        
        this.redis.on('connect', () => {
          logger.info('Redis connected successfully');
        });

        this.redis.on('error', (error) => {
          logger.error('Redis connection error:', error);
          this.isEnabled = false;
        });

        // Iniciar procesamiento de cola
        this.startProcessing();
      } catch (error) {
        logger.error('Error initializing Redis:', error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('Queue service disabled - Redis not configured');
    }
  }

  /**
   * Agregar trabajo a la cola
   */
  async addJob(
    type: string,
    data: any,
    options: QueueOptions = {}
  ): Promise<string> {
    if (!this.isEnabled || !this.redis) {
      logger.warn('Queue service not available, processing job immediately');
      // Si Redis no está disponible, procesar inmediatamente
      return this.processJobDirectly(type, data);
    }

    try {
      const jobId = this.generateJobId();
      const job: QueueJob = {
        id: jobId,
        type,
        data,
        priority: options.priority || 0,
        delay: options.delay || 0,
        maxRetries: options.maxRetries || 3,
        retryCount: 0,
        createdAt: new Date(),
        scheduledAt: options.delay ? new Date(Date.now() + options.delay) : new Date(),
      };

      // Agregar a la cola con prioridad
      const score = job.scheduledAt.getTime() - (job.priority * 1000000);
      await this.redis.zadd(this.queueKey, score, JSON.stringify(job));

      logger.debug(`Job added to queue: ${jobId} (type: ${type})`);
      return jobId;
    } catch (error) {
      logger.error('Error adding job to queue:', error);
      // Fallback: procesar inmediatamente
      return this.processJobDirectly(type, data);
    }
  }

  /**
   * Procesar trabajo directamente (fallback)
   */
  private async processJobDirectly(type: string, data: any): Promise<string> {
    const jobId = this.generateJobId();
    
    try {
      await this.executeJob({ id: jobId, type, data } as QueueJob);
      logger.info(`Job processed directly: ${jobId}`);
    } catch (error) {
      logger.error(`Error processing job directly: ${jobId}`, error);
    }
    
    return jobId;
  }

  /**
   * Iniciar procesamiento de cola
   */
  private async startProcessing(): Promise<void> {
    if (!this.isEnabled || !this.redis || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Queue processing started');

    while (this.isProcessing) {
      try {
        await this.processNextJob();
        await this.sleep(1000); // Esperar 1 segundo entre procesamiento
      } catch (error) {
        logger.error('Error in queue processing loop:', error);
        await this.sleep(5000); // Esperar más tiempo en caso de error
      }
    }
  }

  /**
   * Procesar siguiente trabajo en la cola
   */
  private async processNextJob(): Promise<void> {
    if (!this.redis) return;

    try {
      // Obtener el próximo trabajo (por tiempo y prioridad)
      const now = Date.now();
      const jobs = await this.redis.zrangebyscore(
        this.queueKey,
        '-inf',
        now,
        'LIMIT',
        0,
        1
      );

      if (jobs.length === 0) {
        return; // No hay trabajos pendientes
      }

      const jobData = jobs[0];
      const job: QueueJob = JSON.parse(jobData);

      // Mover a procesamiento
      await this.redis.multi()
        .zrem(this.queueKey, jobData)
        .zadd(this.processingKey, now, jobData)
        .exec();

      try {
        // Ejecutar trabajo
        await this.executeJob(job);
        
        // Remover de procesamiento (completado exitosamente)
        await this.redis.zrem(this.processingKey, jobData);
        
        logger.debug(`Job completed successfully: ${job.id}`);
      } catch (error) {
        logger.error(`Job execution failed: ${job.id}`, error);
        
        // Manejar reintento o fallo
        await this.handleJobFailure(job, error as Error);
      }
    } catch (error) {
      logger.error('Error processing job:', error);
    }
  }

  /**
   * Manejar fallo de trabajo
   */
  private async handleJobFailure(job: QueueJob, error: Error): Promise<void> {
    if (!this.redis) return;

    job.retryCount = (job.retryCount || 0) + 1;

    if (job.retryCount < (job.maxRetries || 3)) {
      // Reintentar con delay exponencial
      const delay = Math.pow(2, job.retryCount) * 1000; // 2s, 4s, 8s...
      job.scheduledAt = new Date(Date.now() + delay);
      
      const score = job.scheduledAt.getTime() - (job.priority || 0) * 1000000;
      
      await this.redis.multi()
        .zrem(this.processingKey, JSON.stringify(job))
        .zadd(this.queueKey, score, JSON.stringify(job))
        .exec();
      
      logger.info(`Job scheduled for retry: ${job.id} (attempt ${job.retryCount}/${job.maxRetries})`);
    } else {
      // Mover a cola de fallos
      await this.redis.multi()
        .zrem(this.processingKey, JSON.stringify(job))
        .zadd(this.failedKey, Date.now(), JSON.stringify({
          ...job,
          failedAt: new Date(),
          error: error.message,
        }))
        .exec();
      
      logger.error(`Job failed permanently: ${job.id}`);
    }
  }

  /**
   * Ejecutar trabajo específico
   */
  private async executeJob(job: QueueJob): Promise<void> {
    switch (job.type) {
      case 'send_whatsapp':
        await this.processSendWhatsApp(job.data);
        break;
      case 'send_email':
        await this.processSendEmail(job.data);
        break;
      case 'update_notification_status':
        await this.processUpdateNotificationStatus(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Procesar envío de WhatsApp
   */
  private async processSendWhatsApp(data: any): Promise<void> {
    const { whatsappService } = await import('./whatsappService');
    const { notificationService } = await import('./notificationService');
    
    const result = await whatsappService.sendMessage({
      to: data.phone,
      message: data.message,
    });

    // Actualizar estado de notificación
    await notificationService.updateNotificationStatus(
      data.notificationId,
      result.success ? 'SENT' : 'FAILED',
      result.messageId,
      result.error
    );
  }

  /**
   * Procesar envío de email
   */
  private async processSendEmail(data: any): Promise<void> {
    const { emailService } = await import('./emailService');
    const { notificationService } = await import('./notificationService');
    
    const result = await emailService.sendEmail({
      to: data.email,
      subject: data.subject,
      text: data.message,
    });

    // Actualizar estado de notificación
    await notificationService.updateNotificationStatus(
      data.notificationId,
      result.success ? 'SENT' : 'FAILED',
      result.messageId,
      result.error
    );
  }

  /**
   * Procesar actualización de estado de notificación
   */
  private async processUpdateNotificationStatus(data: any): Promise<void> {
    const { notificationService } = await import('./notificationService');
    
    await notificationService.updateNotificationStatus(
      data.notificationId,
      data.status,
      data.messageId,
      data.errorMessage
    );
  }

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
  }> {
    if (!this.isEnabled || !this.redis) {
      return { pending: 0, processing: 0, failed: 0 };
    }

    try {
      const [pending, processing, failed] = await Promise.all([
        this.redis.zcard(this.queueKey),
        this.redis.zcard(this.processingKey),
        this.redis.zcard(this.failedKey),
      ]);

      return { pending, processing, failed };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return { pending: 0, processing: 0, failed: 0 };
    }
  }

  /**
   * Limpiar trabajos fallidos antiguos
   */
  async cleanupFailedJobs(olderThanDays: number = 7): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      return 0;
    }

    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      const removed = await this.redis.zremrangebyscore(this.failedKey, '-inf', cutoffTime);
      
      logger.info(`Cleaned up ${removed} failed jobs older than ${olderThanDays} days`);
      return removed;
    } catch (error) {
      logger.error('Error cleaning up failed jobs:', error);
      return 0;
    }
  }

  /**
   * Detener procesamiento
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    
    if (this.redis) {
      await this.redis.disconnect();
    }
    
    logger.info('Queue service stopped');
  }

  /**
   * Generar ID único para trabajo
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Función de utilidad para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener estado del servicio
   */
  getServiceStatus(): {
    enabled: boolean;
    connected: boolean;
    processing: boolean;
  } {
    return {
      enabled: this.isEnabled,
      connected: this.redis?.status === 'ready',
      processing: this.isProcessing,
    };
  }
}

export const queueService = new QueueService();
export default queueService;