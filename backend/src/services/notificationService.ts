import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { queueService } from './queueService';
import { whatsappService } from './whatsappService';
import { emailService } from './emailService';
import {
  CreateNotificationDTO,
  UpdateNotificationDTO,
  NotificationWithRelations,
  NotificationFilters,
  PaginationParams,
  PaginatedResponse,
} from '@/types/database';
import { format, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationTemplate {
  whatsapp: string;
  email: {
    subject: string;
    text: string;
  };
}

class NotificationService {
  private templates: Record<NotificationType, NotificationTemplate> = {
    CONFIRMATION: {
      whatsapp: `¡Hola {{patientName}}! 👋

Tu turno ha sido confirmado:

📅 Fecha: {{date}}
🕐 Hora: {{time}}
👨‍⚕️ Profesional: {{professional}}
🦷 Tratamiento: {{treatment}}

📍 {{clinicAddress}}
📞 {{clinicPhone}}

Por favor, llega 10 minutos antes. ¡Te esperamos!

{{clinicName}}`,
      email: {
        subject: 'Confirmación de Turno - {{clinicName}}',
        text: `Hola {{patientName}},

Tu turno ha sido confirmado:

📅 Fecha: {{date}}
🕐 Hora: {{time}}
👨‍⚕️ Profesional: {{professional}}
🦷 Tratamiento: {{treatment}}

📍 {{clinicAddress}}
📞 {{clinicPhone}}

Por favor, llega 10 minutos antes de tu cita.

Saludos,
{{clinicName}}`,
      },
    },
    REMINDER: {
      whatsapp: `¡Hola {{patientName}}! 🔔

Te recordamos tu turno para MAÑANA:

📅 {{date}}
🕐 {{time}}
👨‍⚕️ {{professional}}
🦷 {{treatment}}

📍 {{clinicAddress}}

Por favor confirma tu asistencia respondiendo este mensaje.

{{clinicName}}
📞 {{clinicPhone}}`,
      email: {
        subject: 'Recordatorio de Turno - Mañana - {{clinicName}}',
        text: `Hola {{patientName}},

Te recordamos que tienes un turno programado para MAÑANA:

📅 Fecha: {{date}}
🕐 Hora: {{time}}
👨‍⚕️ Profesional: {{professional}}
🦷 Tratamiento: {{treatment}}

📍 {{clinicAddress}}
📞 {{clinicPhone}}

Por favor, confirma tu asistencia.

Saludos,
{{clinicName}}`,
      },
    },
    CANCELLATION: {
      whatsapp: `Hola {{patientName}},

Tu turno del {{date}} a las {{time}} con {{professional}} ha sido cancelado.

Si deseas reprogramar, contáctanos al {{clinicPhone}}.

{{clinicName}}`,
      email: {
        subject: 'Turno Cancelado - {{clinicName}}',
        text: `Hola {{patientName}},

Te informamos que tu turno ha sido cancelado:

📅 Fecha: {{date}}
🕐 Hora: {{time}}
👨‍⚕️ Profesional: {{professional}}

Si deseas reprogramar, contáctanos al {{clinicPhone}}.

Saludos,
{{clinicName}}`,
      },
    },
    MODIFICATION: {
      whatsapp: `Hola {{patientName}},

Tu turno ha sido modificado:

🔄 NUEVO HORARIO:
📅 {{date}}
🕐 {{time}}
👨‍⚕️ {{professional}}
🦷 {{treatment}}

📍 {{clinicAddress}}

{{clinicName}}
📞 {{clinicPhone}}`,
      email: {
        subject: 'Turno Modificado - {{clinicName}}',
        text: `Hola {{patientName}},

Tu turno ha sido modificado:

NUEVO HORARIO:
📅 Fecha: {{date}}
🕐 Hora: {{time}}
👨‍⚕️ Profesional: {{professional}}
🦷 Tratamiento: {{treatment}}

📍 {{clinicAddress}}
📞 {{clinicPhone}}

Saludos,
{{clinicName}}`,
      },
    },
    CUSTOM: {
      whatsapp: '{{message}}',
      email: {
        subject: '{{subject}}',
        text: '{{message}}',
      },
    },
  };

  /**
   * Crear notificación
   */
  async createNotification(notificationData: CreateNotificationDTO): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: notificationData,
      });

      logger.info(`Notification created: ${notification.id} (${notification.type})`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de turno
   */
  async sendAppointmentNotification(
    appointmentId: string,
    type: NotificationType,
    customMessage?: string
  ): Promise<void> {
    try {
      // Obtener datos del turno
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Obtener configuración de la clínica
      const clinicConfig = await this.getClinicConfig();

      // Preparar variables para plantillas
      const templateVars = {
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        date: format(appointment.startTime, 'EEEE, dd/MM/yyyy', { locale: es }),
        time: format(appointment.startTime, 'HH:mm'),
        professional: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
        treatment: appointment.treatmentType.name,
        clinicName: clinicConfig.name,
        clinicAddress: clinicConfig.address,
        clinicPhone: clinicConfig.phone,
        message: customMessage || '',
        subject: customMessage || '',
      };

      // Intentar enviar por WhatsApp primero
      if (appointment.patient.phone) {
        await this.sendWhatsAppNotification(
          appointment.patient.id,
          appointment.patient.phone,
          type,
          templateVars,
          appointmentId
        );
      }

      // Enviar por email como fallback o complemento
      if (appointment.patient.email) {
        await this.sendEmailNotification(
          appointment.patient.id,
          appointment.patient.email,
          type,
          templateVars,
          appointmentId
        );
      }

      if (!appointment.patient.phone && !appointment.patient.email) {
        logger.warn(`No contact methods available for patient ${appointment.patient.id}`);
      }
    } catch (error) {
      logger.error('Error sending appointment notification:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación por WhatsApp
   */
  private async sendWhatsAppNotification(
    patientId: string,
    phone: string,
    type: NotificationType,
    templateVars: Record<string, string>,
    appointmentId?: string
  ): Promise<void> {
    try {
      // Crear registro de notificación
      const notification = await this.createNotification({
        type,
        channel: NotificationChannel.WHATSAPP,
        recipient: phone,
        message: this.processTemplate(this.templates[type].whatsapp, templateVars),
        status: NotificationStatus.PENDING,
        patientId,
        appointmentId,
        scheduledAt: new Date(),
      });

      // Agregar a cola de procesamiento
      await queueService.addJob('send_whatsapp', {
        notificationId: notification.id,
        phone,
        message: notification.message,
      });

      logger.info(`WhatsApp notification queued: ${notification.id}`);
    } catch (error) {
      logger.error('Error sending WhatsApp notification:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación por email
   */
  private async sendEmailNotification(
    patientId: string,
    email: string,
    type: NotificationType,
    templateVars: Record<string, string>,
    appointmentId?: string
  ): Promise<void> {
    try {
      const template = this.templates[type].email;
      
      // Crear registro de notificación
      const notification = await this.createNotification({
        type,
        channel: NotificationChannel.EMAIL,
        recipient: email,
        subject: this.processTemplate(template.subject, templateVars),
        message: this.processTemplate(template.text, templateVars),
        status: NotificationStatus.PENDING,
        patientId,
        appointmentId,
        scheduledAt: new Date(),
      });

      // Agregar a cola de procesamiento
      await queueService.addJob('send_email', {
        notificationId: notification.id,
        email,
        subject: notification.subject,
        message: notification.message,
      });

      logger.info(`Email notification queued: ${notification.id}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Programar recordatorios automáticos
   */
  async scheduleAppointmentReminders(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Programar recordatorio 24 horas antes
      const reminderTime = addHours(appointment.startTime, -24);
      
      if (reminderTime > new Date()) {
        const delay = reminderTime.getTime() - Date.now();

        // Crear notificación programada
        if (appointment.patient.phone) {
          const notification = await this.createNotification({
            type: NotificationType.REMINDER,
            channel: NotificationChannel.WHATSAPP,
            recipient: appointment.patient.phone,
            message: '', // Se generará al momento del envío
            status: NotificationStatus.PENDING,
            patientId: appointment.patient.id,
            appointmentId,
            scheduledAt: reminderTime,
          });

          // Programar en cola con delay
          await queueService.addJob(
            'send_whatsapp',
            {
              notificationId: notification.id,
              appointmentId,
              type: NotificationType.REMINDER,
            },
            { delay }
          );
        }

        if (appointment.patient.email) {
          const notification = await this.createNotification({
            type: NotificationType.REMINDER,
            channel: NotificationChannel.EMAIL,
            recipient: appointment.patient.email,
            message: '', // Se generará al momento del envío
            status: NotificationStatus.PENDING,
            patientId: appointment.patient.id,
            appointmentId,
            scheduledAt: reminderTime,
          });

          // Programar en cola con delay
          await queueService.addJob(
            'send_email',
            {
              notificationId: notification.id,
              appointmentId,
              type: NotificationType.REMINDER,
            },
            { delay }
          );
        }

        logger.info(`Reminders scheduled for appointment ${appointmentId} at ${reminderTime}`);
      }
    } catch (error) {
      logger.error('Error scheduling appointment reminders:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de notificación
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...(status === NotificationStatus.SENT && { sentAt: new Date() }),
        ...(status === NotificationStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(messageId && { id: messageId }), // Guardar ID del mensaje externo
        ...(errorMessage && { errorMessage }),
      };

      await prisma.notification.update({
        where: { id: notificationId },
        data: updateData,
      });

      logger.debug(`Notification status updated: ${notificationId} -> ${status}`);
    } catch (error) {
      logger.error('Error updating notification status:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones con filtros
   */
  async getNotifications(
    filters: NotificationFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<NotificationWithRelations>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = pagination;

      const {
        status,
        type,
        channel,
        patientId,
        startDate,
        endDate,
      } = filters;

      // Construir condiciones de filtro
      const where: any = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (channel) where.channel = channel;
      if (patientId) where.patientId = patientId;

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      } else if (startDate) {
        where.createdAt = { gte: startDate };
      } else if (endDate) {
        where.createdAt = { lte: endDate };
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener total de registros
      const total = await prisma.notification.count({ where });

      // Obtener notificaciones
      const notifications = await prisma.notification.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          appointment: {
            select: {
              id: true,
              startTime: true,
              status: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      });

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Reenviar notificación fallida
   */
  async resendFailedNotification(notificationId: string): Promise<void> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status !== NotificationStatus.FAILED) {
        throw new Error('Only failed notifications can be resent');
      }

      // Resetear estado y contadores
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.PENDING,
          retryCount: 0,
          errorMessage: null,
          sentAt: null,
          deliveredAt: null,
        },
      });

      // Reenviar según el canal
      const jobType = notification.channel === NotificationChannel.WHATSAPP ? 'send_whatsapp' : 'send_email';
      const jobData = notification.channel === NotificationChannel.WHATSAPP
        ? {
            notificationId: notification.id,
            phone: notification.recipient,
            message: notification.message,
          }
        : {
            notificationId: notification.id,
            email: notification.recipient,
            subject: notification.subject,
            message: notification.message,
          };

      await queueService.addJob(jobType, jobData);

      logger.info(`Failed notification resent: ${notificationId}`);
    } catch (error) {
      logger.error('Error resending failed notification:', error);
      throw error;
    }
  }

  /**
   * Procesar plantilla con variables
   */
  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });

    return processed;
  }

  /**
   * Obtener configuración de la clínica
   */
  private async getClinicConfig(): Promise<{
    name: string;
    address: string;
    phone: string;
  }> {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: ['CLINIC_NAME', 'CLINIC_ADDRESS', 'CLINIC_PHONE'],
          },
        },
      });

      const configMap = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);

      return {
        name: configMap.CLINIC_NAME || 'Clínica Dental',
        address: configMap.CLINIC_ADDRESS || 'Dirección no configurada',
        phone: configMap.CLINIC_PHONE || 'Teléfono no configurado',
      };
    } catch (error) {
      logger.error('Error getting clinic config:', error);
      return {
        name: 'Clínica Dental',
        address: 'Dirección no configurada',
        phone: 'Teléfono no configurado',
      };
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
  }> {
    try {
      const [
        total,
        pending,
        sent,
        delivered,
        failed,
        byChannel,
        byType,
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { status: NotificationStatus.PENDING } }),
        prisma.notification.count({ where: { status: NotificationStatus.SENT } }),
        prisma.notification.count({ where: { status: NotificationStatus.DELIVERED } }),
        prisma.notification.count({ where: { status: NotificationStatus.FAILED } }),
        prisma.notification.groupBy({
          by: ['channel'],
          _count: { channel: true },
        }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: { type: true },
        }),
      ]);

      const channelStats = byChannel.reduce((acc, item) => {
        acc[item.channel] = item._count.channel;
        return acc;
      }, {} as Record<NotificationChannel, number>);

      const typeStats = byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<NotificationType, number>);

      return {
        total,
        pending,
        sent,
        delivered,
        failed,
        byChannel: channelStats,
        byType: typeStats,
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;