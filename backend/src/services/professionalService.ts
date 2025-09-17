import { Professional, WorkingHour, ScheduleBlock, TreatmentType } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  CreateProfessionalDTO,
  UpdateProfessionalDTO,
  ProfessionalWithRelations,
  PaginationParams,
  PaginatedResponse,
} from '@/types/database';

interface CreateWorkingHourDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

interface CreateScheduleBlockDTO {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

class ProfessionalService {
  /**
   * Crear nuevo profesional
   */
  async createProfessional(professionalData: CreateProfessionalDTO): Promise<Professional> {
    try {
      // Verificar que la matrícula no esté en uso (si se proporciona)
      if (professionalData.license) {
        const existingProfessional = await prisma.professional.findUnique({
          where: { license: professionalData.license },
        });

        if (existingProfessional) {
          throw new Error('Ya existe un profesional con esta matrícula');
        }
      }

      const professional = await prisma.professional.create({
        data: {
          firstName: professionalData.firstName.trim(),
          lastName: professionalData.lastName.trim(),
          email: professionalData.email?.toLowerCase(),
          phone: professionalData.phone,
          license: professionalData.license,
          specialties: professionalData.specialties,
        },
      });

      logger.info(`Profesional creado: ${professional.firstName} ${professional.lastName} (${professional.license || 'sin matrícula'})`);
      return professional;
    } catch (error) {
      logger.error('Error creando profesional:', error);
      throw error;
    }
  }

  /**
   * Obtener profesional por ID
   */
  async getProfessionalById(id: string, includeRelations = false): Promise<ProfessionalWithRelations | null> {
    try {
      const professional = await prisma.professional.findUnique({
        where: { id },
        include: includeRelations ? {
          workingHours: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
          treatmentTypes: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          scheduleBlocks: {
            where: {
              endDate: { gte: new Date() }, // Solo bloques futuros o actuales
            },
            orderBy: { startDate: 'asc' },
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
              treatmentType: {
                select: {
                  name: true,
                  duration: true,
                },
              },
            },
            orderBy: { startTime: 'asc' },
            take: 10, // Próximos 10 turnos
          },
        } : undefined,
      });

      return professional;
    } catch (error) {
      logger.error('Error obteniendo profesional por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener profesionales con paginación
   */
  async getProfessionals(
    pagination: PaginationParams = {},
    includeInactive = false
  ): Promise<PaginatedResponse<Professional>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'firstName',
        sortOrder = 'asc',
      } = pagination;

      // Construir condiciones de filtro
      const where: any = {};
      if (!includeInactive) {
        where.isActive = true;
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener total de registros
      const total = await prisma.professional.count({ where });

      // Obtener profesionales
      const professionals = await prisma.professional.findMany({
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
        data: professionals,
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
      logger.error('Error obteniendo profesionales:', error);
      throw error;
    }
  }

  /**
   * Actualizar profesional
   */
  async updateProfessional(id: string, updateData: UpdateProfessionalDTO): Promise<Professional> {
    try {
      // Verificar que el profesional existe
      const existingProfessional = await prisma.professional.findUnique({
        where: { id },
      });

      if (!existingProfessional) {
        throw new Error('Profesional no encontrado');
      }

      // Verificar unicidad de matrícula si se está actualizando
      if (updateData.license && updateData.license !== existingProfessional.license) {
        const professionalWithLicense = await prisma.professional.findFirst({
          where: {
            license: updateData.license,
            NOT: { id },
          },
        });

        if (professionalWithLicense) {
          throw new Error('Ya existe un profesional con esta matrícula');
        }
      }

      const updatedProfessional = await prisma.professional.update({
        where: { id },
        data: {
          ...(updateData.firstName && { firstName: updateData.firstName.trim() }),
          ...(updateData.lastName && { lastName: updateData.lastName.trim() }),
          ...(updateData.email !== undefined && { 
            email: updateData.email ? updateData.email.toLowerCase() : null 
          }),
          ...(updateData.phone !== undefined && { phone: updateData.phone }),
          ...(updateData.license !== undefined && { license: updateData.license }),
          ...(updateData.specialties && { specialties: updateData.specialties }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        },
      });

      logger.info(`Profesional actualizado: ${updatedProfessional.firstName} ${updatedProfessional.lastName}`);
      return updatedProfessional;
    } catch (error) {
      logger.error('Error actualizando profesional:', error);
      throw error;
    }
  }

  /**
   * Eliminar profesional (soft delete)
   */
  async deleteProfessional(id: string): Promise<void> {
    try {
      const professional = await prisma.professional.findUnique({
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

      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      // Verificar que no tenga turnos activos
      if (professional.appointments.length > 0) {
        throw new Error('No se puede eliminar un profesional con turnos programados o confirmados');
      }

      // Soft delete
      await prisma.professional.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Profesional eliminado (soft delete): ${professional.firstName} ${professional.lastName}`);
    } catch (error) {
      logger.error('Error eliminando profesional:', error);
      throw error;
    }
  }

  /**
   * Configurar horarios de trabajo
   */
  async setWorkingHours(professionalId: string, workingHours: CreateWorkingHourDTO[]): Promise<WorkingHour[]> {
    try {
      // Verificar que el profesional existe
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
      });

      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      // Validar horarios
      this.validateWorkingHours(workingHours);

      // Eliminar horarios existentes
      await prisma.workingHour.deleteMany({
        where: { professionalId },
      });

      // Crear nuevos horarios
      const createdHours = await Promise.all(
        workingHours.map(hour =>
          prisma.workingHour.create({
            data: {
              professionalId,
              dayOfWeek: hour.dayOfWeek,
              startTime: hour.startTime,
              endTime: hour.endTime,
              isActive: hour.isActive ?? true,
            },
          })
        )
      );

      logger.info(`Horarios de trabajo configurados para profesional ${professionalId}: ${workingHours.length} horarios`);
      return createdHours;
    } catch (error) {
      logger.error('Error configurando horarios de trabajo:', error);
      throw error;
    }
  }

  /**
   * Obtener horarios de trabajo
   */
  async getWorkingHours(professionalId: string): Promise<WorkingHour[]> {
    try {
      const workingHours = await prisma.workingHour.findMany({
        where: {
          professionalId,
          isActive: true,
        },
        orderBy: { dayOfWeek: 'asc' },
      });

      return workingHours;
    } catch (error) {
      logger.error('Error obteniendo horarios de trabajo:', error);
      throw error;
    }
  }

  /**
   * Crear bloqueo de horario
   */
  async createScheduleBlock(professionalId: string, blockData: CreateScheduleBlockDTO): Promise<ScheduleBlock> {
    try {
      // Verificar que el profesional existe
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
      });

      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      // Validar fechas
      if (blockData.startDate >= blockData.endDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Verificar conflictos con turnos existentes
      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          professionalId,
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
          OR: [
            {
              startTime: { lt: blockData.endDate },
              endTime: { gt: blockData.startDate },
            },
          ],
        },
      });

      if (conflictingAppointments.length > 0) {
        throw new Error('El bloqueo de horario conflicta con turnos existentes');
      }

      const scheduleBlock = await prisma.scheduleBlock.create({
        data: {
          professionalId,
          title: blockData.title.trim(),
          description: blockData.description?.trim(),
          startDate: blockData.startDate,
          endDate: blockData.endDate,
          isRecurring: blockData.isRecurring ?? false,
          recurrenceRule: blockData.recurrenceRule,
        },
      });

      logger.info(`Bloqueo de horario creado para profesional ${professionalId}: ${scheduleBlock.title}`);
      return scheduleBlock;
    } catch (error) {
      logger.error('Error creando bloqueo de horario:', error);
      throw error;
    }
  }

  /**
   * Obtener bloqueos de horario
   */
  async getScheduleBlocks(
    professionalId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ScheduleBlock[]> {
    try {
      const where: any = { professionalId };

      if (startDate && endDate) {
        where.OR = [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ];
      } else if (startDate) {
        where.endDate = { gte: startDate };
      } else if (endDate) {
        where.startDate = { lte: endDate };
      }

      const scheduleBlocks = await prisma.scheduleBlock.findMany({
        where,
        orderBy: { startDate: 'asc' },
      });

      return scheduleBlocks;
    } catch (error) {
      logger.error('Error obteniendo bloqueos de horario:', error);
      throw error;
    }
  }

  /**
   * Eliminar bloqueo de horario
   */
  async deleteScheduleBlock(id: string): Promise<void> {
    try {
      const scheduleBlock = await prisma.scheduleBlock.findUnique({
        where: { id },
      });

      if (!scheduleBlock) {
        throw new Error('Bloqueo de horario no encontrado');
      }

      await prisma.scheduleBlock.delete({
        where: { id },
      });

      logger.info(`Bloqueo de horario eliminado: ${scheduleBlock.title}`);
    } catch (error) {
      logger.error('Error eliminando bloqueo de horario:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de profesional
   */
  async getProfessionalStats(professionalId: string): Promise<{
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    treatmentTypes: number;
    workingDays: number;
  }> {
    try {
      const now = new Date();

      const [
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        treatmentTypes,
        workingDays,
      ] = await Promise.all([
        prisma.appointment.count({
          where: { professionalId },
        }),
        prisma.appointment.count({
          where: {
            professionalId,
            startTime: { gte: now },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
        }),
        prisma.appointment.count({
          where: {
            professionalId,
            status: 'COMPLETED',
          },
        }),
        prisma.appointment.count({
          where: {
            professionalId,
            status: 'CANCELLED',
          },
        }),
        prisma.treatmentType.count({
          where: {
            professionalId,
            isActive: true,
          },
        }),
        prisma.workingHour.count({
          where: {
            professionalId,
            isActive: true,
          },
        }),
      ]);

      return {
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        treatmentTypes,
        workingDays,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de profesional:', error);
      throw error;
    }
  }

  /**
   * Validar horarios de trabajo
   */
  private validateWorkingHours(workingHours: CreateWorkingHourDTO[]): void {
    for (const hour of workingHours) {
      // Validar día de la semana
      if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
        throw new Error('Día de la semana debe estar entre 0 (domingo) y 6 (sábado)');
      }

      // Validar formato de hora
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(hour.startTime) || !timeRegex.test(hour.endTime)) {
        throw new Error('Formato de hora inválido (debe ser HH:MM)');
      }

      // Validar que la hora de fin sea posterior a la de inicio
      const [startHour, startMin] = hour.startTime.split(':').map(Number);
      const [endHour, endMin] = hour.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    // Verificar duplicados por día
    const days = workingHours.map(h => h.dayOfWeek);
    const uniqueDays = new Set(days);
    if (days.length !== uniqueDays.size) {
      throw new Error('No puede haber horarios duplicados para el mismo día');
    }
  }

  /**
   * Buscar profesionales activos (para selects)
   */
  async getActiveProfessionals(): Promise<Professional[]> {
    try {
      const professionals = await prisma.professional.findMany({
        where: { isActive: true },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      });

      return professionals;
    } catch (error) {
      logger.error('Error obteniendo profesionales activos:', error);
      throw error;
    }
  }
}

export const professionalService = new ProfessionalService();
export default professionalService;