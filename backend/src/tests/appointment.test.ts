import { appointmentService } from '@/services/appointmentService';
import { mockPrisma } from './setup';
import { CreateAppointmentDTO, UpdateAppointmentDTO } from '@/types/database';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    const appointmentData: CreateAppointmentDTO = {
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:30:00Z'),
      patientId: 'patient-1',
      professionalId: 'professional-1',
      treatmentTypeId: 'treatment-1',
      createdById: 'user-1',
      notes: 'Consulta general',
      status: AppointmentStatus.SCHEDULED,
    };

    const mockPatient = {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      isActive: true,
      email: null,
      phone: '+5491123456789',
      document: '12345678',
      dateOfBirth: null,
      address: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProfessional = {
      id: 'professional-1',
      firstName: 'Dr. Juan',
      lastName: 'García',
      isActive: true,
      email: null,
      phone: null,
      license: null,
      specialties: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTreatmentType = {
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
    };

    const mockWorkingHour = {
      id: 'working-hour-1',
      dayOfWeek: 1, // Lunes
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
      professionalId: 'professional-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('debería crear un turno exitosamente', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.treatmentType.findFirst.mockResolvedValue(mockTreatmentType);
      mockPrisma.appointment.findMany.mockResolvedValue([]); // No hay conflictos
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]); // No hay bloqueos
      mockPrisma.workingHour.findFirst.mockResolvedValue(mockWorkingHour);

      const createdAppointment = {
        id: 'appointment-1',
        ...appointmentData,
        patient: mockPatient,
        professional: mockProfessional,
        treatmentType: mockTreatmentType,
        createdBy: {
          id: 'user-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
        },
        updatedBy: null,
        notifications: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.appointment.create.mockResolvedValue(createdAppointment);

      // Act
      const result = await appointmentService.createAppointment(appointmentData);

      // Assert
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
      expect(mockPrisma.professional.findUnique).toHaveBeenCalledWith({
        where: { id: 'professional-1' },
      });
      expect(mockPrisma.treatmentType.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'treatment-1',
          professionalId: 'professional-1',
          isActive: true,
        },
      });
      expect(result).toEqual(createdAppointment);
    });

    it('debería fallar si el paciente no existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(
        'Paciente no encontrado o inactivo'
      );
    });

    it('debería fallar si el paciente está inactivo', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        isActive: false,
      });

      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(
        'Paciente no encontrado o inactivo'
      );
    });

    it('debería fallar si el profesional no existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.professional.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(
        'Profesional no encontrado o inactivo'
      );
    });

    it('debería fallar si el tipo de tratamiento no es válido para el profesional', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.treatmentType.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(
        'Tipo de tratamiento no válido para este profesional'
      );
    });

    it('debería fallar si hay conflicto de horarios', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.treatmentType.findFirst.mockResolvedValue(mockTreatmentType);
      
      // Simular conflicto de horario
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-appointment',
          startTime: new Date('2024-01-15T10:15:00Z'),
          endTime: new Date('2024-01-15T10:45:00Z'),
          status: AppointmentStatus.SCHEDULED,
          notes: null,
          observations: null,
          patientId: 'other-patient',
          professionalId: 'professional-1',
          treatmentTypeId: 'treatment-1',
          createdById: 'user-1',
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(
        'El horario seleccionado no está disponible'
      );
    });
  });

  describe('getAppointmentById', () => {
    it('debería obtener un turno por ID', async () => {
      // Arrange
      const mockAppointment = {
        id: 'appointment-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: AppointmentStatus.SCHEDULED,
        notes: 'Consulta general',
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
        },
        professional: {
          id: 'professional-1',
          firstName: 'Dr. Juan',
          lastName: 'García',
        },
        treatmentType: {
          id: 'treatment-1',
          name: 'Consulta General',
        },
        createdBy: {
          id: 'user-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
        },
        updatedBy: null,
        notifications: [],
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      // Act
      const result = await appointmentService.getAppointmentById('appointment-1');

      // Assert
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          notifications: true,
        },
      });
      expect(result).toEqual(mockAppointment);
    });

    it('debería retornar null si el turno no existe', async () => {
      // Arrange
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      // Act
      const result = await appointmentService.getAppointmentById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateAppointment', () => {
    const updateData: UpdateAppointmentDTO = {
      notes: 'Turno actualizado',
      status: AppointmentStatus.CONFIRMED,
    };

    it('debería actualizar un turno exitosamente', async () => {
      // Arrange
      const existingAppointment = {
        id: 'appointment-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: AppointmentStatus.SCHEDULED,
        notes: 'Consulta general',
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
        },
        professional: {
          id: 'professional-1',
          firstName: 'Dr. Juan',
          lastName: 'García',
        },
      };

      const updatedAppointment = {
        ...existingAppointment,
        notes: 'Turno actualizado',
        status: AppointmentStatus.CONFIRMED,
        updatedById: 'user-2',
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(existingAppointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);

      // Act
      const result = await appointmentService.updateAppointment('appointment-1', updateData, 'user-2');

      // Assert
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        include: {
          patient: true,
          professional: true,
        },
      });
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: {
          ...updateData,
          updatedById: 'user-2',
        },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedAppointment);
    });

    it('debería fallar si el turno no existe', async () => {
      // Arrange
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        appointmentService.updateAppointment('nonexistent-id', updateData, 'user-2')
      ).rejects.toThrow('Turno no encontrado');
    });
  });

  describe('changeAppointmentStatus', () => {
    it('debería cambiar el estado de un turno exitosamente', async () => {
      // Arrange
      const existingAppointment = {
        id: 'appointment-1',
        status: AppointmentStatus.SCHEDULED,
        startTime: new Date(),
        endTime: new Date(),
        notes: null,
        observations: null,
        patientId: 'patient-1',
        professionalId: 'professional-1',
        treatmentTypeId: 'treatment-1',
        createdById: 'user-1',
        updatedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAppointment = {
        ...existingAppointment,
        status: AppointmentStatus.CONFIRMED,
        updatedById: 'user-2',
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(existingAppointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);

      // Act
      const result = await appointmentService.changeAppointmentStatus(
        'appointment-1',
        AppointmentStatus.CONFIRMED,
        'user-2'
      );

      // Assert
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: {
          status: AppointmentStatus.CONFIRMED,
          updatedById: 'user-2',
        },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
        },
      });
      expect(result).toEqual(updatedAppointment);
    });

    it('debería fallar con transición de estado inválida', async () => {
      // Arrange
      const existingAppointment = {
        id: 'appointment-1',
        status: AppointmentStatus.CANCELLED, // Estado que no permite cambios
        startTime: new Date(),
        endTime: new Date(),
        notes: null,
        observations: null,
        patientId: 'patient-1',
        professionalId: 'professional-1',
        treatmentTypeId: 'treatment-1',
        createdById: 'user-1',
        updatedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(existingAppointment);

      // Act & Assert
      await expect(
        appointmentService.changeAppointmentStatus(
          'appointment-1',
          AppointmentStatus.CONFIRMED,
          'user-2'
        )
      ).rejects.toThrow('Transición de estado inválida');
    });
  });

  describe('checkAvailability', () => {
    it('debería retornar true si el horario está disponible', async () => {
      // Arrange
      mockPrisma.appointment.findMany.mockResolvedValue([]); // No hay conflictos
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]); // No hay bloqueos

      // Act
      const result = await appointmentService.checkAvailability(
        'professional-1',
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-15T10:30:00Z')
      );

      // Assert
      expect(result).toBe(true);
    });

    it('debería retornar false si hay conflicto de horarios', async () => {
      // Arrange
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-appointment',
          startTime: new Date('2024-01-15T10:15:00Z'),
          endTime: new Date('2024-01-15T10:45:00Z'),
          status: AppointmentStatus.SCHEDULED,
          notes: null,
          observations: null,
          patientId: 'patient-1',
          professionalId: 'professional-1',
          treatmentTypeId: 'treatment-1',
          createdById: 'user-1',
          updatedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      // Act
      const result = await appointmentService.checkAvailability(
        'professional-1',
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-15T10:30:00Z')
      );

      // Assert
      expect(result).toBe(false);
    });

    it('debería retornar false si hay bloqueo de horario', async () => {
      // Arrange
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([
        {
          id: 'block-1',
          title: 'Bloqueo',
          description: null,
          startDate: new Date('2024-01-15T10:00:00Z'),
          endDate: new Date('2024-01-15T11:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          professionalId: 'professional-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const result = await appointmentService.checkAvailability(
        'professional-1',
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-15T10:30:00Z')
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});