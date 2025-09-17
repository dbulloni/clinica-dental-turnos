import { schedulerService } from '@/services/schedulerService';
import { mockPrisma } from './setup';
import { AppointmentStatus, NotificationStatus, NotificationType } from '@prisma/client';

// Mock de node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    running: false,
    nextDate: jest.fn(() => ({ toDate: () => new Date() })),
  })),
}));

// Mock de los servicios
jest.mock('@/services/notificationService', () => ({
  notificationService: {
    sendAppointmentNotification: jest.fn(),
    resendFailedNotification: jest.fn(),
  },
}));

jest.mock('@/services/queueService', () => ({
  queueService: {
    getQueueStats: jest.fn(() => ({ pending: 0, processing: 0, failed: 0 })),
    cleanupFailedJobs: jest.fn(() => Promise.resolve(5)),
  },
}));

describe('SchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('debería inicializar el servicio correctamente', async () => {
      // Act
      await schedulerService.initialize();

      // Assert
      const stats = schedulerService.getSchedulerStats();
      expect(stats.initialized).toBe(true);
      expect(stats.totalTasks).toBeGreaterThan(0);
    });

    it('no debería inicializar dos veces', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      await schedulerService.initialize();

      // Assert - No debería lanzar error
      const stats = schedulerService.getSchedulerStats();
      expect(stats.initialized).toBe(true);
    });
  });

  describe('getTasksStatus', () => {
    it('debería retornar el estado de todas las tareas', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      const tasks = schedulerService.getTasksStatus();

      // Assert
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      const reminderTask = tasks.find(t => t.name === 'appointment-reminders');
      expect(reminderTask).toBeDefined();
      expect(reminderTask?.schedule).toBe('0 * * * *');
      expect(reminderTask?.enabled).toBe(true);
    });
  });

  describe('toggleTask', () => {
    it('debería habilitar/deshabilitar una tarea', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      const result1 = schedulerService.toggleTask('appointment-reminders', false);
      const result2 = schedulerService.toggleTask('appointment-reminders', true);

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('debería retornar false para tarea inexistente', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      const result = schedulerService.toggleTask('nonexistent-task', true);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('runTaskManually', () => {
    beforeEach(async () => {
      await schedulerService.initialize();
    });

    it('debería ejecutar tarea de recordatorios manualmente', async () => {
      // Arrange
      const mockAppointments = [
        {
          id: 'appointment-1',
          startTime: new Date(),
          endTime: new Date(),
          status: AppointmentStatus.SCHEDULED,
          patient: {
            id: 'patient-1',
            firstName: 'Juan',
            lastName: 'Pérez',
            phone: '+5491123456789',
            email: 'juan@test.com',
          },
          professional: {
            id: 'prof-1',
            firstName: 'Dr. García',
            lastName: 'López',
          },
          treatmentType: {
            id: 'treatment-1',
            name: 'Consulta',
          },
          notifications: [], // Sin recordatorios previos
        },
      ];

      mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const { notificationService } = await import('@/services/notificationService');
      (notificationService.sendAppointmentNotification as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await schedulerService.runTaskManually('appointment-reminders');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.appointment.findMany).toHaveBeenCalled();
      expect(notificationService.sendAppointmentNotification).toHaveBeenCalledWith(
        'appointment-1',
        NotificationType.REMINDER
      );
    });

    it('debería ejecutar tarea de limpieza manualmente', async () => {
      // Arrange
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      const { queueService } = await import('@/services/queueService');
      (queueService.cleanupFailedJobs as jest.Mock).mockResolvedValue(5);

      // Act
      const result = await schedulerService.runTaskManually('daily-cleanup');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalled();
      expect(queueService.cleanupFailedJobs).toHaveBeenCalledWith(7);
    });

    it('debería ejecutar health check manualmente', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const { queueService } = await import('@/services/queueService');
      (queueService.getQueueStats as jest.Mock).mockResolvedValue({
        pending: 5,
        processing: 2,
        failed: 1,
      });

      // Act
      const result = await schedulerService.runTaskManually('health-check');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(queueService.getQueueStats).toHaveBeenCalled();
    });

    it('debería ejecutar actualización de estado de notificaciones manualmente', async () => {
      // Arrange
      const mockNotifications = [
        {
          id: 'notification-1',
          status: NotificationStatus.SENT,
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.update.mockResolvedValue({});

      // Act
      const result = await schedulerService.runTaskManually('notification-status-update');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.notification.findMany).toHaveBeenCalled();
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: NotificationStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        },
      });
    });

    it('debería ejecutar reintento de trabajos fallidos manualmente', async () => {
      // Arrange
      const mockFailedNotifications = [
        {
          id: 'notification-1',
          status: NotificationStatus.FAILED,
          retryCount: 1,
          updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockFailedNotifications);

      const { notificationService } = await import('@/services/notificationService');
      (notificationService.resendFailedNotification as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await schedulerService.runTaskManually('failed-job-retry');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.notification.findMany).toHaveBeenCalled();
      expect(notificationService.resendFailedNotification).toHaveBeenCalledWith('notification-1');
    });

    it('debería retornar false para tarea inexistente', async () => {
      // Act
      const result = await schedulerService.runTaskManually('nonexistent-task');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSchedulerStats', () => {
    it('debería retornar estadísticas del scheduler', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      const stats = schedulerService.getSchedulerStats();

      // Assert
      expect(stats).toHaveProperty('initialized');
      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('enabledTasks');
      expect(stats).toHaveProperty('runningTasks');
      expect(typeof stats.initialized).toBe('boolean');
      expect(typeof stats.totalTasks).toBe('number');
      expect(typeof stats.enabledTasks).toBe('number');
      expect(typeof stats.runningTasks).toBe('number');
    });
  });

  describe('stop', () => {
    it('debería detener todas las tareas', async () => {
      // Arrange
      await schedulerService.initialize();

      // Act
      await schedulerService.stop();

      // Assert
      const stats = schedulerService.getSchedulerStats();
      expect(stats.initialized).toBe(false);
      expect(stats.totalTasks).toBe(0);
    });
  });

  describe('error handling', () => {
    it('debería manejar errores en tarea de recordatorios', async () => {
      // Arrange
      await schedulerService.initialize();
      mockPrisma.appointment.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await schedulerService.runTaskManually('appointment-reminders');

      // Assert
      expect(result).toBe(true); // La tarea se ejecuta pero maneja el error internamente
    });

    it('debería manejar errores en tarea de limpieza', async () => {
      // Arrange
      await schedulerService.initialize();
      mockPrisma.notification.deleteMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await schedulerService.runTaskManually('daily-cleanup');

      // Assert
      expect(result).toBe(true); // La tarea se ejecuta pero maneja el error internamente
    });

    it('debería manejar errores en health check', async () => {
      // Arrange
      await schedulerService.initialize();
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection error'));

      // Act
      const result = await schedulerService.runTaskManually('health-check');

      // Assert
      expect(result).toBe(true); // La tarea se ejecuta pero maneja el error internamente
    });
  });
});