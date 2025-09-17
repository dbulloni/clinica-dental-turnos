import { notificationService } from '@/services/notificationService';
import { mockPrisma } from './setup';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

// Mock de los servicios externos
jest.mock('@/services/whatsappService', () => ({
  whatsappService: {
    sendMessage: jest.fn(),
    getServiceStatus: jest.fn(() => ({ enabled: true, configured: true })),
  },
}));

jest.mock('@/services/emailService', () => ({
  emailService: {
    sendEmail: jest.fn(),
    getServiceStatus: jest.fn(() => ({ enabled: true, configured: true })),
  },
}));

jest.mock('@/services/queueService', () => ({
  queueService: {
    addJob: jest.fn(),
    getQueueStats: jest.fn(() => ({ pending: 0, processing: 0, failed: 0 })),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('debería crear una notificación exitosamente', async () => {
      // Arrange
      const notificationData = {
        type: NotificationType.CONFIRMATION,
        channel: NotificationChannel.WHATSAPP,
        recipient: '+5491123456789',
        message: 'Test message',
        status: NotificationStatus.PENDING,
        patientId: 'patient-1',
        appointmentId: 'appointment-1',
        scheduledAt: new Date(),
      };

      const createdNotification = {
        id: 'notification-1',
        ...notificationData,
        subject: null,
        sentAt: null,
        deliveredAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notification.create.mockResolvedValue(createdNotification);

      // Act
      const result = await notificationService.createNotification(notificationData);

      // Assert
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: notificationData,
      });
      expect(result).toEqual(createdNotification);
    });
  });

  describe('sendAppointmentNotification', () => {
    const mockAppointment = {
      id: 'appointment-1',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:30:00Z'),
      status: 'SCHEDULED',
      notes: null,
      observations: null,
      patientId: 'patient-1',
      professionalId: 'professional-1',
      treatmentTypeId: 'treatment-1',
      createdById: 'user-1',
      updatedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      patient: {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+5491123456789',
        email: 'juan.perez@email.com',
        document: '12345678',
        dateOfBirth: null,
        address: null,
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      professional: {
        id: 'professional-1',
        firstName: 'Dr. Juan',
        lastName: 'García',
        email: null,
        phone: null,
        license: null,
        specialties: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      treatmentType: {
        id: 'treatment-1',
        name: 'Consulta General',
        description: null,
        duration: 30,
        price: null,
        color: null,
        isActive: true,
        professionalId: 'professional-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const mockClinicConfig = [
      { key: 'CLINIC_NAME', value: 'Clínica Test' },
      { key: 'CLINIC_ADDRESS', value: 'Av. Test 123' },
      { key: 'CLINIC_PHONE', value: '+5491123456789' },
    ];

    it('debería enviar notificación de turno por WhatsApp y email', async () => {
      // Arrange
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.systemConfig.findMany.mockResolvedValue(mockClinicConfig);
      mockPrisma.notification.create
        .mockResolvedValueOnce({
          id: 'notification-whatsapp',
          type: NotificationType.CONFIRMATION,
          channel: NotificationChannel.WHATSAPP,
          recipient: '+5491123456789',
          message: 'WhatsApp message',
          status: NotificationStatus.PENDING,
          patientId: 'patient-1',
          appointmentId: 'appointment-1',
          scheduledAt: new Date(),
          subject: null,
          sentAt: null,
          deliveredAt: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'notification-email',
          type: NotificationType.CONFIRMATION,
          channel: NotificationChannel.EMAIL,
          recipient: 'juan.perez@email.com',
          message: 'Email message',
          status: NotificationStatus.PENDING,
          patientId: 'patient-1',
          appointmentId: 'appointment-1',
          scheduledAt: new Date(),
          subject: 'Email subject',
          sentAt: null,
          deliveredAt: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const { queueService } = await import('@/services/queueService');
      (queueService.addJob as jest.Mock).mockResolvedValue('job-id');

      // Act
      await notificationService.sendAppointmentNotification(
        'appointment-1',
        NotificationType.CONFIRMATION
      );

      // Assert
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
        },
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(queueService.addJob).toHaveBeenCalledTimes(2);
      expect(queueService.addJob).toHaveBeenCalledWith('send_whatsapp', expect.any(Object));
      expect(queueService.addJob).toHaveBeenCalledWith('send_email', expect.any(Object));
    });

    it('debería fallar si el turno no existe', async () => {
      // Arrange
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        notificationService.sendAppointmentNotification(
          'nonexistent-appointment',
          NotificationType.CONFIRMATION
        )
      ).rejects.toThrow('Appointment not found');
    });

    it('debería manejar paciente sin métodos de contacto', async () => {
      // Arrange
      const appointmentWithoutContact = {
        ...mockAppointment,
        patient: {
          ...mockAppointment.patient,
          phone: null,
          email: null,
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(appointmentWithoutContact);
      mockPrisma.systemConfig.findMany.mockResolvedValue(mockClinicConfig);

      // Act
      await notificationService.sendAppointmentNotification(
        'appointment-1',
        NotificationType.CONFIRMATION
      );

      // Assert
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('updateNotificationStatus', () => {
    it('debería actualizar el estado de una notificación', async () => {
      // Arrange
      const updatedNotification = {
        id: 'notification-1',
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      };

      mockPrisma.notification.update.mockResolvedValue(updatedNotification);

      // Act
      await notificationService.updateNotificationStatus(
        'notification-1',
        NotificationStatus.SENT,
        'message-id-123'
      );

      // Assert
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: NotificationStatus.SENT,
          sentAt: expect.any(Date),
          id: 'message-id-123',
        },
      });
    });

    it('debería actualizar con mensaje de error para notificaciones fallidas', async () => {
      // Arrange
      mockPrisma.notification.update.mockResolvedValue({});

      // Act
      await notificationService.updateNotificationStatus(
        'notification-1',
        NotificationStatus.FAILED,
        undefined,
        'Error sending message'
      );

      // Assert
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: 'Error sending message',
        },
      });
    });
  });

  describe('getNotifications', () => {
    it('debería obtener notificaciones con paginación', async () => {
      // Arrange
      const mockNotifications = [
        {
          id: 'notification-1',
          type: NotificationType.CONFIRMATION,
          channel: NotificationChannel.WHATSAPP,
          recipient: '+5491123456789',
          message: 'Test message',
          status: NotificationStatus.SENT,
          patientId: 'patient-1',
          appointmentId: 'appointment-1',
          scheduledAt: new Date(),
          subject: null,
          sentAt: new Date(),
          deliveredAt: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          patient: {
            id: 'patient-1',
            firstName: 'Juan',
            lastName: 'Pérez',
            phone: '+5491123456789',
            email: 'juan.perez@email.com',
          },
          appointment: {
            id: 'appointment-1',
            startTime: new Date(),
            status: 'SCHEDULED',
          },
        },
      ];

      mockPrisma.notification.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      // Act
      const result = await notificationService.getNotifications(
        { status: NotificationStatus.SENT },
        { page: 1, limit: 10 }
      );

      // Assert
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
      });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
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
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(mockNotifications);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('resendFailedNotification', () => {
    it('debería reenviar una notificación fallida', async () => {
      // Arrange
      const failedNotification = {
        id: 'notification-1',
        type: NotificationType.CONFIRMATION,
        channel: NotificationChannel.WHATSAPP,
        recipient: '+5491123456789',
        message: 'Test message',
        status: NotificationStatus.FAILED,
        subject: null,
        patientId: 'patient-1',
        appointmentId: 'appointment-1',
        scheduledAt: new Date(),
        sentAt: null,
        deliveredAt: null,
        errorMessage: 'Previous error',
        retryCount: 3,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notification.findUnique.mockResolvedValue(failedNotification);
      mockPrisma.notification.update.mockResolvedValue({
        ...failedNotification,
        status: NotificationStatus.PENDING,
        retryCount: 0,
        errorMessage: null,
      });

      const { queueService } = await import('@/services/queueService');
      (queueService.addJob as jest.Mock).mockResolvedValue('job-id');

      // Act
      await notificationService.resendFailedNotification('notification-1');

      // Assert
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: NotificationStatus.PENDING,
          retryCount: 0,
          errorMessage: null,
          sentAt: null,
          deliveredAt: null,
        },
      });
      expect(queueService.addJob).toHaveBeenCalledWith('send_whatsapp', {
        notificationId: 'notification-1',
        phone: '+5491123456789',
        message: 'Test message',
      });
    });

    it('debería fallar si la notificación no existe', async () => {
      // Arrange
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        notificationService.resendFailedNotification('nonexistent-id')
      ).rejects.toThrow('Notification not found');
    });

    it('debería fallar si la notificación no está en estado fallido', async () => {
      // Arrange
      const sentNotification = {
        id: 'notification-1',
        status: NotificationStatus.SENT,
        type: NotificationType.CONFIRMATION,
        channel: NotificationChannel.WHATSAPP,
        recipient: '+5491123456789',
        message: 'Test message',
        subject: null,
        patientId: 'patient-1',
        appointmentId: 'appointment-1',
        scheduledAt: new Date(),
        sentAt: new Date(),
        deliveredAt: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notification.findUnique.mockResolvedValue(sentNotification);

      // Act & Assert
      await expect(
        notificationService.resendFailedNotification('notification-1')
      ).rejects.toThrow('Only failed notifications can be resent');
    });
  });

  describe('getNotificationStats', () => {
    it('debería obtener estadísticas de notificaciones', async () => {
      // Arrange
      mockPrisma.notification.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10)  // pending
        .mockResolvedValueOnce(80)  // sent
        .mockResolvedValueOnce(5)   // delivered
        .mockResolvedValueOnce(5);  // failed

      mockPrisma.notification.groupBy
        .mockResolvedValueOnce([
          { channel: NotificationChannel.WHATSAPP, _count: { channel: 60 } },
          { channel: NotificationChannel.EMAIL, _count: { channel: 40 } },
        ])
        .mockResolvedValueOnce([
          { type: NotificationType.CONFIRMATION, _count: { type: 50 } },
          { type: NotificationType.REMINDER, _count: { type: 30 } },
          { type: NotificationType.CANCELLATION, _count: { type: 20 } },
        ]);

      // Act
      const result = await notificationService.getNotificationStats();

      // Assert
      expect(result).toEqual({
        total: 100,
        pending: 10,
        sent: 80,
        delivered: 5,
        failed: 5,
        byChannel: {
          [NotificationChannel.WHATSAPP]: 60,
          [NotificationChannel.EMAIL]: 40,
        },
        byType: {
          [NotificationType.CONFIRMATION]: 50,
          [NotificationType.REMINDER]: 30,
          [NotificationType.CANCELLATION]: 20,
        },
      });
    });
  });
});