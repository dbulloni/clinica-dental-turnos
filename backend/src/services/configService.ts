import { SystemConfig } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

interface ConfigUpdate {
  key: string;
  value: string;
  description?: string;
}

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalPatients: number;
  activePatients: number;
  totalProfessionals: number;
  activeProfessionals: number;
  appointmentStats: {
    total: number;
    scheduled: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  };
  notificationStats: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

class ConfigService {
  /**
   * Obtener todas las configuraciones
   */
  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const configs = await prisma.systemConfig.findMany({
        orderBy: { key: 'asc' },
      });

      return configs;
    } catch (error) {
      logger.error('Error obteniendo configuraciones:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración por clave
   */
  async getConfigByKey(key: string): Promise<SystemConfig | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key },
      });

      return config;
    } catch (error) {
      logger.error('Error obteniendo configuración por clave:', error);
      throw error;
    }
  }

  /**
   * Obtener valor de configuración
   */
  async getConfigValue(key: string, defaultValue?: string): Promise<string | null> {
    try {
      const config = await this.getConfigByKey(key);
      return config?.value || defaultValue || null;
    } catch (error) {
      logger.error('Error obteniendo valor de configuración:', error);
      return defaultValue || null;
    }
  }

  /**
   * Actualizar configuración
   */
  async updateConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    try {
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: {
          value,
          ...(description && { description }),
        },
        create: {
          key,
          value,
          description,
        },
      });

      logger.info(`Configuración actualizada: ${key} = ${value}`);
      return config;
    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  /**
   * Actualizar múltiples configuraciones
   */
  async updateMultipleConfigs(configs: ConfigUpdate[]): Promise<SystemConfig[]> {
    try {
      const updatedConfigs = await Promise.all(
        configs.map(config =>
          this.updateConfig(config.key, config.value, config.description)
        )
      );

      logger.info(`${configs.length} configuraciones actualizadas`);
      return updatedConfigs;
    } catch (error) {
      logger.error('Error actualizando múltiples configuraciones:', error);
      throw error;
    }
  }

  /**
   * Eliminar configuración
   */
  async deleteConfig(key: string): Promise<void> {
    try {
      await prisma.systemConfig.delete({
        where: { key },
      });

      logger.info(`Configuración eliminada: ${key}`);
    } catch (error) {
      logger.error('Error eliminando configuración:', error);
      throw error;
    }
  }

  /**
   * Obtener configuraciones de la clínica
   */
  async getClinicConfig(): Promise<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
  }> {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              'CLINIC_NAME',
              'CLINIC_ADDRESS',
              'CLINIC_PHONE',
              'CLINIC_EMAIL',
              'CLINIC_WEBSITE',
              'CLINIC_DESCRIPTION',
            ],
          },
        },
      });

      const configMap = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);

      return {
        name: configMap.CLINIC_NAME || 'Clínica Dental',
        address: configMap.CLINIC_ADDRESS || '',
        phone: configMap.CLINIC_PHONE || '',
        email: configMap.CLINIC_EMAIL || '',
        website: configMap.CLINIC_WEBSITE || '',
        description: configMap.CLINIC_DESCRIPTION || '',
      };
    } catch (error) {
      logger.error('Error obteniendo configuración de clínica:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuraciones de la clínica
   */
  async updateClinicConfig(clinicData: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
  }): Promise<void> {
    try {
      const updates: ConfigUpdate[] = [];

      if (clinicData.name !== undefined) {
        updates.push({
          key: 'CLINIC_NAME',
          value: clinicData.name,
          description: 'Nombre de la clínica',
        });
      }

      if (clinicData.address !== undefined) {
        updates.push({
          key: 'CLINIC_ADDRESS',
          value: clinicData.address,
          description: 'Dirección de la clínica',
        });
      }

      if (clinicData.phone !== undefined) {
        updates.push({
          key: 'CLINIC_PHONE',
          value: clinicData.phone,
          description: 'Teléfono de la clínica',
        });
      }

      if (clinicData.email !== undefined) {
        updates.push({
          key: 'CLINIC_EMAIL',
          value: clinicData.email,
          description: 'Email de la clínica',
        });
      }

      if (clinicData.website !== undefined) {
        updates.push({
          key: 'CLINIC_WEBSITE',
          value: clinicData.website,
          description: 'Sitio web de la clínica',
        });
      }

      if (clinicData.description !== undefined) {
        updates.push({
          key: 'CLINIC_DESCRIPTION',
          value: clinicData.description,
          description: 'Descripción de la clínica',
        });
      }

      if (updates.length > 0) {
        await this.updateMultipleConfigs(updates);
      }
    } catch (error) {
      logger.error('Error actualizando configuración de clínica:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Obtener estadísticas de turnos
      const [
        todayAppointments,
        weekAppointments,
        monthAppointments,
        totalPatients,
        activePatients,
        totalProfessionals,
        activeProfessionals,
      ] = await Promise.all([
        prisma.appointment.count({
          where: {
            startTime: { gte: startOfDay },
          },
        }),
        prisma.appointment.count({
          where: {
            startTime: { gte: startOfWeek },
          },
        }),
        prisma.appointment.count({
          where: {
            startTime: { gte: startOfMonth },
          },
        }),
        prisma.patient.count(),
        prisma.patient.count({
          where: { isActive: true },
        }),
        prisma.professional.count(),
        prisma.professional.count({
          where: { isActive: true },
        }),
      ]);

      // Estadísticas de turnos por estado
      const appointmentStats = await this.getAppointmentStatsByStatus();

      // Estadísticas de notificaciones
      const notificationStats = await this.getNotificationStatsByStatus();

      // Actividad reciente
      const recentActivity = await this.getRecentActivity();

      return {
        todayAppointments,
        weekAppointments,
        monthAppointments,
        totalPatients,
        activePatients,
        totalProfessionals,
        activeProfessionals,
        appointmentStats,
        notificationStats,
        recentActivity,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de turnos por estado
   */
  private async getAppointmentStatsByStatus(): Promise<{
    total: number;
    scheduled: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  }> {
    const [total, scheduled, confirmed, cancelled, completed, noShow] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'NO_SHOW' } }),
    ]);

    return {
      total,
      scheduled,
      confirmed,
      cancelled,
      completed,
      noShow,
    };
  }

  /**
   * Obtener estadísticas de notificaciones por estado
   */
  private async getNotificationStatsByStatus(): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }> {
    const [total, pending, sent, delivered, failed] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'PENDING' } }),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'DELIVERED' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      total,
      pending,
      sent,
      delivered,
      failed,
    };
  }

  /**
   * Obtener actividad reciente
   */
  private async getRecentActivity(): Promise<Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>> {
    try {
      const recentAppointments = await prisma.appointment.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24 horas
        },
        include: {
          patient: {
            select: { firstName: true, lastName: true },
          },
          professional: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const recentPatients = await prisma.patient.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24 horas
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      const activity: Array<{
        type: string;
        description: string;
        timestamp: Date;
      }> = [];

      // Agregar turnos recientes
      recentAppointments.forEach(appointment => {
        activity.push({
          type: 'appointment',
          description: `Nuevo turno: ${appointment.patient.firstName} ${appointment.patient.lastName} con ${appointment.professional.firstName} ${appointment.professional.lastName}`,
          timestamp: appointment.createdAt,
        });
      });

      // Agregar pacientes recientes
      recentPatients.forEach(patient => {
        activity.push({
          type: 'patient',
          description: `Nuevo paciente: ${patient.firstName} ${patient.lastName}`,
          timestamp: patient.createdAt,
        });
      });

      // Ordenar por timestamp descendente y tomar los primeros 10
      return activity
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
    } catch (error) {
      logger.error('Error obteniendo actividad reciente:', error);
      return [];
    }
  }

  /**
   * Obtener configuraciones por categoría
   */
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: `${category.toUpperCase()}_` },
        },
        orderBy: { key: 'asc' },
      });

      return configs;
    } catch (error) {
      logger.error('Error obteniendo configuraciones por categoría:', error);
      throw error;
    }
  }

  /**
   * Resetear configuraciones a valores por defecto
   */
  async resetToDefaults(): Promise<void> {
    try {
      // Eliminar todas las configuraciones existentes
      await prisma.systemConfig.deleteMany();

      // Crear configuraciones por defecto
      const defaultConfigs: ConfigUpdate[] = [
        {
          key: 'CLINIC_NAME',
          value: 'Clínica Dental',
          description: 'Nombre de la clínica',
        },
        {
          key: 'CLINIC_ADDRESS',
          value: '',
          description: 'Dirección de la clínica',
        },
        {
          key: 'CLINIC_PHONE',
          value: '',
          description: 'Teléfono de la clínica',
        },
        {
          key: 'CLINIC_EMAIL',
          value: '',
          description: 'Email de la clínica',
        },
        {
          key: 'REMINDER_HOURS_BEFORE',
          value: '24',
          description: 'Horas antes del turno para enviar recordatorio',
        },
        {
          key: 'MAX_APPOINTMENTS_PER_DAY',
          value: '20',
          description: 'Máximo número de turnos por día',
        },
        {
          key: 'DEFAULT_APPOINTMENT_DURATION',
          value: '30',
          description: 'Duración por defecto de los turnos en minutos',
        },
        {
          key: 'ENABLE_WHATSAPP_NOTIFICATIONS',
          value: 'true',
          description: 'Habilitar notificaciones por WhatsApp',
        },
        {
          key: 'ENABLE_EMAIL_NOTIFICATIONS',
          value: 'true',
          description: 'Habilitar notificaciones por email',
        },
      ];

      await this.updateMultipleConfigs(defaultConfigs);

      logger.info('Configuraciones reseteadas a valores por defecto');
    } catch (error) {
      logger.error('Error reseteando configuraciones:', error);
      throw error;
    }
  }

  /**
   * Exportar configuraciones
   */
  async exportConfigs(): Promise<SystemConfig[]> {
    try {
      const configs = await this.getAllConfigs();
      logger.info('Configuraciones exportadas');
      return configs;
    } catch (error) {
      logger.error('Error exportando configuraciones:', error);
      throw error;
    }
  }

  /**
   * Importar configuraciones
   */
  async importConfigs(configs: ConfigUpdate[]): Promise<void> {
    try {
      await this.updateMultipleConfigs(configs);
      logger.info(`${configs.length} configuraciones importadas`);
    } catch (error) {
      logger.error('Error importando configuraciones:', error);
      throw error;
    }
  }
}

export const configService = new ConfigService();
export default configService;