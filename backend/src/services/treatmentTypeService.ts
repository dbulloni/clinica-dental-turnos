import { TreatmentType } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  CreateTreatmentTypeDTO,
  UpdateTreatmentTypeDTO,
  TreatmentTypeWithRelations,
  PaginationParams,
  PaginatedResponse,
} from '@/types/database';

class TreatmentTypeService {
  /**
   * Crear nuevo tipo de tratamiento
   */
  async createTreatmentType(treatmentData: CreateTreatmentTypeDTO): Promise<TreatmentType> {
    try {
      // Verificar que el profesional existe
      const professional = await prisma.professional.findUnique({
        where: { id: treatmentData.professionalId },
      });

      if (!professional || !professional.isActive) {
        throw new Error('Profesional no encontrado o inactivo');
      }

      // Verificar que no exista un tratamiento con el mismo nombre para el profesional
      const existingTreatment = await prisma.treatmentType.findFirst({
        where: {
          name: treatmentData.name,
          professionalId: treatmentData.professionalId,
          isActive: true,
        },
      });

      if (existingTreatment) {
        throw new Error('Ya existe un tipo de tratamiento con este nombre para el profesional');
      }

      const treatmentType = await prisma.treatmentType.create({
        data: {
          name: treatmentData.name.trim(),
          description: treatmentData.description?.trim(),
          duration: treatmentData.duration,
          price: treatmentData.price,
          color: treatmentData.color,
          professionalId: treatmentData.professionalId,
        },
      });

      logger.info(`Tipo de tratamiento creado: ${treatmentType.name} para profesional ${treatmentData.professionalId}`);
      return treatmentType;
    } catch (error) {
      logger.error('Error creando tipo de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Obtener tipo de tratamiento por ID
   */
  async getTreatmentTypeById(id: string, includeRelations = false): Promise<TreatmentTypeWithRelations | null> {
    try {
      const treatmentType = await prisma.treatmentType.findUnique({
        where: { id },
        include: includeRelations ? {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialties: true,
            },
          },
          appointments: {
            where: {
              startTime: { gte: new Date() }, // Solo turnos futuros
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { startTime: 'asc' },
            take: 5, // Próximos 5 turnos
          },
        } : undefined,
      });

      return treatmentType;
    } catch (error) {
      logger.error('Error obteniendo tipo de tratamiento por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de tratamiento con filtros y paginación
   */
  async getTreatmentTypes(
    professionalId?: string,
    pagination: PaginationParams = {},
    includeInactive = false
  ): Promise<PaginatedResponse<TreatmentTypeWithRelations>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc',
      } = pagination;

      // Construir condiciones de filtro
      const where: any = {};
      
      if (professionalId) {
        where.professionalId = professionalId;
      }
      
      if (!includeInactive) {
        where.isActive = true;
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener total de registros
      const total = await prisma.treatmentType.count({ where });

      // Obtener tipos de tratamiento
      const treatmentTypes = await prisma.treatmentType.findMany({
        where,
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialties: true,
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
        data: treatmentTypes,
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
      logger.error('Error obteniendo tipos de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Actualizar tipo de tratamiento
   */
  async updateTreatmentType(id: string, updateData: UpdateTreatmentTypeDTO): Promise<TreatmentType> {
    try {
      // Verificar que el tipo de tratamiento existe
      const existingTreatment = await prisma.treatmentType.findUnique({
        where: { id },
      });

      if (!existingTreatment) {
        throw new Error('Tipo de tratamiento no encontrado');
      }

      // Verificar unicidad de nombre si se está actualizando
      if (updateData.name && updateData.name !== existingTreatment.name) {
        const treatmentWithName = await prisma.treatmentType.findFirst({
          where: {
            name: updateData.name,
            professionalId: existingTreatment.professionalId,
            isActive: true,
            NOT: { id },
          },
        });

        if (treatmentWithName) {
          throw new Error('Ya existe un tipo de tratamiento con este nombre para el profesional');
        }
      }

      const updatedTreatment = await prisma.treatmentType.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name.trim() }),
          ...(updateData.description !== undefined && { 
            description: updateData.description ? updateData.description.trim() : null 
          }),
          ...(updateData.duration && { duration: updateData.duration }),
          ...(updateData.price !== undefined && { price: updateData.price }),
          ...(updateData.color !== undefined && { color: updateData.color }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        },
      });

      logger.info(`Tipo de tratamiento actualizado: ${updatedTreatment.name}`);
      return updatedTreatment;
    } catch (error) {
      logger.error('Error actualizando tipo de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Eliminar tipo de tratamiento (soft delete)
   */
  async deleteTreatmentType(id: string): Promise<void> {
    try {
      const treatmentType = await prisma.treatmentType.findUnique({
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

      if (!treatmentType) {
        throw new Error('Tipo de tratamiento no encontrado');
      }

      // Verificar que no tenga turnos activos
      if (treatmentType.appointments.length > 0) {
        throw new Error('No se puede eliminar un tipo de tratamiento con turnos programados o confirmados');
      }

      // Soft delete
      await prisma.treatmentType.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Tipo de tratamiento eliminado (soft delete): ${treatmentType.name}`);
    } catch (error) {
      logger.error('Error eliminando tipo de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de tratamiento por profesional (para selects)
   */
  async getTreatmentTypesByProfessional(professionalId: string): Promise<TreatmentType[]> {
    try {
      const treatmentTypes = await prisma.treatmentType.findMany({
        where: {
          professionalId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });

      return treatmentTypes;
    } catch (error) {
      logger.error('Error obteniendo tipos de tratamiento por profesional:', error);
      throw error;
    }
  }

  /**
   * Duplicar tipo de tratamiento
   */
  async duplicateTreatmentType(id: string, newName?: string): Promise<TreatmentType> {
    try {
      const originalTreatment = await prisma.treatmentType.findUnique({
        where: { id },
      });

      if (!originalTreatment) {
        throw new Error('Tipo de tratamiento no encontrado');
      }

      const duplicatedName = newName || `${originalTreatment.name} (Copia)`;

      // Verificar que el nuevo nombre no exista
      const existingTreatment = await prisma.treatmentType.findFirst({
        where: {
          name: duplicatedName,
          professionalId: originalTreatment.professionalId,
          isActive: true,
        },
      });

      if (existingTreatment) {
        throw new Error('Ya existe un tipo de tratamiento con este nombre');
      }

      const duplicatedTreatment = await prisma.treatmentType.create({
        data: {
          name: duplicatedName,
          description: originalTreatment.description,
          duration: originalTreatment.duration,
          price: originalTreatment.price,
          color: originalTreatment.color,
          professionalId: originalTreatment.professionalId,
        },
      });

      logger.info(`Tipo de tratamiento duplicado: ${duplicatedTreatment.name}`);
      return duplicatedTreatment;
    } catch (error) {
      logger.error('Error duplicando tipo de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de tipo de tratamiento
   */
  async getTreatmentTypeStats(id: string): Promise<{
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    averageDuration: number;
    totalRevenue: number;
  }> {
    try {
      const treatmentType = await prisma.treatmentType.findUnique({
        where: { id },
      });

      if (!treatmentType) {
        throw new Error('Tipo de tratamiento no encontrado');
      }

      const now = new Date();

      const [
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
      ] = await Promise.all([
        prisma.appointment.count({
          where: { treatmentTypeId: id },
        }),
        prisma.appointment.count({
          where: {
            treatmentTypeId: id,
            startTime: { gte: now },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
        }),
        prisma.appointment.count({
          where: {
            treatmentTypeId: id,
            status: 'COMPLETED',
          },
        }),
      ]);

      // Calcular ingresos totales (solo turnos completados)
      const totalRevenue = treatmentType.price 
        ? treatmentType.price * completedAppointments 
        : 0;

      return {
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        averageDuration: treatmentType.duration,
        totalRevenue,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de tipo de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Buscar tipos de tratamiento por nombre
   */
  async searchTreatmentTypes(searchTerm: string, professionalId?: string, limit = 10): Promise<TreatmentType[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const where: any = {
        isActive: true,
        name: { contains: searchTerm, mode: 'insensitive' },
      };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      const treatmentTypes = await prisma.treatmentType.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
      });

      return treatmentTypes;
    } catch (error) {
      logger.error('Error buscando tipos de tratamiento:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de tratamiento más utilizados
   */
  async getMostUsedTreatmentTypes(professionalId?: string, limit = 5): Promise<Array<{
    treatmentType: TreatmentType;
    appointmentCount: number;
  }>> {
    try {
      const where: any = { isActive: true };
      if (professionalId) {
        where.professionalId = professionalId;
      }

      // Obtener tipos de tratamiento con conteo de turnos
      const treatmentTypesWithCount = await prisma.treatmentType.findMany({
        where,
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        orderBy: {
          appointments: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return treatmentTypesWithCount.map(tt => ({
        treatmentType: {
          id: tt.id,
          name: tt.name,
          description: tt.description,
          duration: tt.duration,
          price: tt.price,
          color: tt.color,
          isActive: tt.isActive,
          professionalId: tt.professionalId,
          createdAt: tt.createdAt,
          updatedAt: tt.updatedAt,
        },
        appointmentCount: tt._count.appointments,
      }));
    } catch (error) {
      logger.error('Error obteniendo tipos de tratamiento más utilizados:', error);
      throw error;
    }
  }
}

export const treatmentTypeService = new TreatmentTypeService();
export default treatmentTypeService;