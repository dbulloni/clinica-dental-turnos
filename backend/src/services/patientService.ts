import { Patient } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  CreatePatientDTO,
  UpdatePatientDTO,
  PatientWithRelations,
  PatientFilters,
  PaginationParams,
  PaginatedResponse,
} from '@/types/database';

class PatientService {
  /**
   * Crear nuevo paciente
   */
  async createPatient(patientData: CreatePatientDTO): Promise<Patient> {
    try {
      // Verificar que el documento no esté en uso
      const existingPatientByDocument = await prisma.patient.findUnique({
        where: { document: patientData.document },
      });

      if (existingPatientByDocument) {
        throw new Error('Ya existe un paciente con este número de documento');
      }

      // Verificar que el teléfono no esté en uso
      const existingPatientByPhone = await prisma.patient.findUnique({
        where: { phone: patientData.phone },
      });

      if (existingPatientByPhone) {
        throw new Error('Ya existe un paciente con este número de teléfono');
      }

      const patient = await prisma.patient.create({
        data: {
          firstName: patientData.firstName.trim(),
          lastName: patientData.lastName.trim(),
          email: patientData.email?.toLowerCase(),
          phone: patientData.phone,
          document: patientData.document,
          dateOfBirth: patientData.dateOfBirth,
          address: patientData.address?.trim(),
          notes: patientData.notes?.trim(),
        },
      });

      logger.info(`Paciente creado: ${patient.firstName} ${patient.lastName} (${patient.document})`);
      return patient;
    } catch (error) {
      logger.error('Error creando paciente:', error);
      throw error;
    }
  }

  /**
   * Obtener paciente por ID
   */
  async getPatientById(id: string, includeRelations = false): Promise<PatientWithRelations | null> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: includeRelations ? {
          appointments: {
            include: {
              professional: true,
              treatmentType: true,
            },
            orderBy: { startTime: 'desc' },
          },
          notifications: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Últimas 10 notificaciones
          },
        } : undefined,
      });

      return patient;
    } catch (error) {
      logger.error('Error obteniendo paciente por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener pacientes con filtros y paginación
   */
  async getPatients(
    filters: PatientFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Patient>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = pagination;

      const { search, isActive } = filters;

      // Construir condiciones de filtro
      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { document: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener total de registros
      const total = await prisma.patient.count({ where });

      // Obtener pacientes
      const patients = await prisma.patient.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      });

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data: patients,
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
      logger.error('Error obteniendo pacientes:', error);
      throw error;
    }
  }

  /**
   * Actualizar paciente
   */
  async updatePatient(id: string, updateData: UpdatePatientDTO): Promise<Patient> {
    try {
      // Verificar que el paciente existe
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        throw new Error('Paciente no encontrado');
      }

      // Verificar unicidad de documento si se está actualizando
      if (updateData.document && updateData.document !== existingPatient.document) {
        const patientWithDocument = await prisma.patient.findFirst({
          where: {
            document: updateData.document,
            NOT: { id },
          },
        });

        if (patientWithDocument) {
          throw new Error('Ya existe un paciente con este número de documento');
        }
      }

      // Verificar unicidad de teléfono si se está actualizando
      if (updateData.phone && updateData.phone !== existingPatient.phone) {
        const patientWithPhone = await prisma.patient.findFirst({
          where: {
            phone: updateData.phone,
            NOT: { id },
          },
        });

        if (patientWithPhone) {
          throw new Error('Ya existe un paciente con este número de teléfono');
        }
      }

      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          ...(updateData.firstName && { firstName: updateData.firstName.trim() }),
          ...(updateData.lastName && { lastName: updateData.lastName.trim() }),
          ...(updateData.email !== undefined && { 
            email: updateData.email ? updateData.email.toLowerCase() : null 
          }),
          ...(updateData.phone && { phone: updateData.phone }),
          ...(updateData.document && { document: updateData.document }),
          ...(updateData.dateOfBirth !== undefined && { dateOfBirth: updateData.dateOfBirth }),
          ...(updateData.address !== undefined && { 
            address: updateData.address ? updateData.address.trim() : null 
          }),
          ...(updateData.notes !== undefined && { 
            notes: updateData.notes ? updateData.notes.trim() : null 
          }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        },
      });

      logger.info(`Paciente actualizado: ${updatedPatient.firstName} ${updatedPatient.lastName} (${updatedPatient.document})`);
      return updatedPatient;
    } catch (error) {
      logger.error('Error actualizando paciente:', error);
      throw error;
    }
  }

  /**
   * Eliminar paciente (soft delete)
   */
  async deletePatient(id: string): Promise<void> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          appointments: {
            where: {
              status: {
                in: ['SCHEDULED', 'CONFIRMED'],
              },
            },
          },
        },
      });

      if (!patient) {
        throw new Error('Paciente no encontrado');
      }

      // Verificar que no tenga turnos activos
      if (patient.appointments.length > 0) {
        throw new Error('No se puede eliminar un paciente con turnos programados o confirmados');
      }

      // Soft delete
      await prisma.patient.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Paciente eliminado (soft delete): ${patient.firstName} ${patient.lastName} (${patient.document})`);
    } catch (error) {
      logger.error('Error eliminando paciente:', error);
      throw error;
    }
  }

  /**
   * Buscar pacientes por término de búsqueda (para autocompletado)
   */
  async searchPatients(searchTerm: string, limit = 10): Promise<Patient[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const patients = await prisma.patient.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { document: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        take: limit,
      });

      return patients;
    } catch (error) {
      logger.error('Error buscando pacientes:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de turnos de un paciente
   */
  async getPatientAppointmentHistory(patientId: string): Promise<any[]> {
    try {
      const appointments = await prisma.appointment.findMany({
        where: { patientId },
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              specialties: true,
            },
          },
          treatmentType: {
            select: {
              name: true,
              duration: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return appointments;
    } catch (error) {
      logger.error('Error obteniendo historial de turnos:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de documento
   */
  async isDocumentAvailable(document: string, excludeId?: string): Promise<boolean> {
    try {
      const where: any = { document };
      if (excludeId) {
        where.NOT = { id: excludeId };
      }

      const existingPatient = await prisma.patient.findFirst({ where });
      return !existingPatient;
    } catch (error) {
      logger.error('Error verificando disponibilidad de documento:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de teléfono
   */
  async isPhoneAvailable(phone: string, excludeId?: string): Promise<boolean> {
    try {
      const where: any = { phone };
      if (excludeId) {
        where.NOT = { id: excludeId };
      }

      const existingPatient = await prisma.patient.findFirst({ where });
      return !existingPatient;
    } catch (error) {
      logger.error('Error verificando disponibilidad de teléfono:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de pacientes
   */
  async getPatientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [total, active, inactive, newThisMonth] = await Promise.all([
        prisma.patient.count(),
        prisma.patient.count({ where: { isActive: true } }),
        prisma.patient.count({ where: { isActive: false } }),
        prisma.patient.count({
          where: {
            createdAt: { gte: startOfMonth },
          },
        }),
      ]);

      return {
        total,
        active,
        inactive,
        newThisMonth,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de pacientes:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();
export default patientService;