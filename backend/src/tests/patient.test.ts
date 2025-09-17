import { patientService } from '@/services/patientService';
import { mockPrisma } from './setup';
import { CreatePatientDTO, UpdatePatientDTO } from '@/types/database';

describe('PatientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    const patientData: CreatePatientDTO = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+5491123456789',
      document: '12345678',
      dateOfBirth: new Date('1985-03-15'),
      address: 'Av. Corrientes 1234',
      notes: 'Paciente nuevo',
      isActive: true,
    };

    it('debería crear un paciente exitosamente', async () => {
      // Arrange
      mockPrisma.patient.findUnique
        .mockResolvedValueOnce(null) // No existe documento
        .mockResolvedValueOnce(null); // No existe teléfono
      
      const createdPatient = {
        id: 'patient-1',
        ...patientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.patient.create.mockResolvedValue(createdPatient);

      // Act
      const result = await patientService.createPatient(patientData);

      // Assert
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { document: patientData.document },
      });
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { phone: patientData.phone },
      });
      expect(mockPrisma.patient.create).toHaveBeenCalledWith({
        data: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+5491123456789',
          document: '12345678',
          dateOfBirth: patientData.dateOfBirth,
          address: 'Av. Corrientes 1234',
          notes: 'Paciente nuevo',
        },
      });
      expect(result).toEqual(createdPatient);
    });

    it('debería fallar si el documento ya existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValueOnce({
        id: 'existing-patient',
        document: '12345678',
        firstName: 'Existing',
        lastName: 'Patient',
        email: null,
        phone: '+5491987654321',
        dateOfBirth: null,
        address: null,
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(patientService.createPatient(patientData)).rejects.toThrow(
        'Ya existe un paciente con este número de documento'
      );
    });

    it('debería fallar si el teléfono ya existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique
        .mockResolvedValueOnce(null) // Documento disponible
        .mockResolvedValueOnce({ // Teléfono ya existe
          id: 'existing-patient',
          document: '87654321',
          firstName: 'Existing',
          lastName: 'Patient',
          email: null,
          phone: '+5491123456789',
          dateOfBirth: null,
          address: null,
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Act & Assert
      await expect(patientService.createPatient(patientData)).rejects.toThrow(
        'Ya existe un paciente con este número de teléfono'
      );
    });
  });

  describe('getPatientById', () => {
    it('debería obtener un paciente por ID', async () => {
      // Arrange
      const mockPatient = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+5491123456789',
        document: '12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: 'Av. Corrientes 1234',
        notes: 'Paciente nuevo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);

      // Act
      const result = await patientService.getPatientById('patient-1');

      // Assert
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        include: undefined,
      });
      expect(result).toEqual(mockPatient);
    });

    it('debería obtener un paciente con relaciones', async () => {
      // Arrange
      const mockPatientWithRelations = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+5491123456789',
        document: '12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: 'Av. Corrientes 1234',
        notes: 'Paciente nuevo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        appointments: [],
        notifications: [],
      };

      mockPrisma.patient.findUnique.mockResolvedValue(mockPatientWithRelations);

      // Act
      const result = await patientService.getPatientById('patient-1', true);

      // Assert
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        include: {
          appointments: {
            include: {
              professional: true,
              treatmentType: true,
            },
            orderBy: { startTime: 'desc' },
          },
          notifications: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      expect(result).toEqual(mockPatientWithRelations);
    });

    it('debería retornar null si el paciente no existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      // Act
      const result = await patientService.getPatientById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPatients', () => {
    it('debería obtener pacientes con paginación', async () => {
      // Arrange
      const mockPatients = [
        {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+5491123456789',
          document: '12345678',
          dateOfBirth: new Date('1985-03-15'),
          address: 'Av. Corrientes 1234',
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.patient.count.mockResolvedValue(1);
      mockPrisma.patient.findMany.mockResolvedValue(mockPatients);

      // Act
      const result = await patientService.getPatients({}, { page: 1, limit: 10 });

      // Assert
      expect(mockPrisma.patient.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(mockPatients);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('debería filtrar pacientes por búsqueda', async () => {
      // Arrange
      const filters = { search: 'Juan' };
      mockPrisma.patient.count.mockResolvedValue(0);
      mockPrisma.patient.findMany.mockResolvedValue([]);

      // Act
      await patientService.getPatients(filters);

      // Assert
      expect(mockPrisma.patient.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: 'Juan', mode: 'insensitive' } },
            { lastName: { contains: 'Juan', mode: 'insensitive' } },
            { document: { contains: 'Juan', mode: 'insensitive' } },
            { phone: { contains: 'Juan', mode: 'insensitive' } },
            { email: { contains: 'Juan', mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('updatePatient', () => {
    const updateData: UpdatePatientDTO = {
      firstName: 'Juan Carlos',
      notes: 'Paciente actualizado',
    };

    it('debería actualizar un paciente exitosamente', async () => {
      // Arrange
      const existingPatient = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+5491123456789',
        document: '12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: 'Av. Corrientes 1234',
        notes: 'Paciente nuevo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPatient = {
        ...existingPatient,
        firstName: 'Juan Carlos',
        notes: 'Paciente actualizado',
      };

      mockPrisma.patient.findUnique.mockResolvedValue(existingPatient);
      mockPrisma.patient.update.mockResolvedValue(updatedPatient);

      // Act
      const result = await patientService.updatePatient('patient-1', updateData);

      // Assert
      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          firstName: 'Juan Carlos',
          notes: 'Paciente actualizado',
        },
      });
      expect(result).toEqual(updatedPatient);
    });

    it('debería fallar si el paciente no existe', async () => {
      // Arrange
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        patientService.updatePatient('nonexistent-id', updateData)
      ).rejects.toThrow('Paciente no encontrado');
    });
  });

  describe('deletePatient', () => {
    it('debería eliminar un paciente sin turnos activos', async () => {
      // Arrange
      const mockPatient = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+5491123456789',
        document: '12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: 'Av. Corrientes 1234',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        appointments: [], // Sin turnos activos
      };

      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.patient.update.mockResolvedValue({
        ...mockPatient,
        isActive: false,
      });

      // Act
      await patientService.deletePatient('patient-1');

      // Assert
      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: { isActive: false },
      });
    });

    it('debería fallar si el paciente tiene turnos activos', async () => {
      // Arrange
      const mockPatient = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+5491123456789',
        document: '12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: 'Av. Corrientes 1234',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        appointments: [
          {
            id: 'appointment-1',
            status: 'SCHEDULED',
            startTime: new Date(),
            endTime: new Date(),
            notes: null,
            observations: null,
            patientId: 'patient-1',
            professionalId: 'prof-1',
            treatmentTypeId: 'treatment-1',
            createdById: 'user-1',
            updatedById: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);

      // Act & Assert
      await expect(patientService.deletePatient('patient-1')).rejects.toThrow(
        'No se puede eliminar un paciente con turnos programados o confirmados'
      );
    });
  });

  describe('searchPatients', () => {
    it('debería buscar pacientes por término', async () => {
      // Arrange
      const mockPatients = [
        {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+5491123456789',
          document: '12345678',
          dateOfBirth: new Date('1985-03-15'),
          address: 'Av. Corrientes 1234',
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.patient.findMany.mockResolvedValue(mockPatients);

      // Act
      const result = await patientService.searchPatients('Juan');

      // Assert
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: 'Juan', mode: 'insensitive' } },
            { lastName: { contains: 'Juan', mode: 'insensitive' } },
            { document: { contains: 'Juan', mode: 'insensitive' } },
            { phone: { contains: 'Juan', mode: 'insensitive' } },
          ],
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        take: 10,
      });
      expect(result).toEqual(mockPatients);
    });

    it('debería retornar array vacío para términos muy cortos', async () => {
      // Act
      const result = await patientService.searchPatients('J');

      // Assert
      expect(result).toEqual([]);
      expect(mockPrisma.patient.findMany).not.toHaveBeenCalled();
    });
  });
});