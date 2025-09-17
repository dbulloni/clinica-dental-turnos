import { Appointment, AppointmentStatus } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  AppointmentWithRelations,
  AppointmentFilters,
  PaginationParams,
  PaginatedResponse,
} from '@/types/database';
import { addMinutes, format, startOfDay, endOfDay, parseISO } from 'date-fns';

class AppointmentService {
  /**
   * Crear nuevo turno
   */
  async createAppointment(appointmentData: CreateAppointmentDTO): Promise<AppointmentWithRelations> {
    try {
      // Validar que el paciente existe y está activo
      const patient = await prisma.patient.findUnique({
        where: { id: appointmentData.patientId },
      });

      if (!patient || !patient.isActive) {
        throw new Error('Paciente no encontrado o inactivo');
      }

      // Validar que el profesional existe y está activo
      const professional = await prisma.professional.findUnique({
        where: { id: appointmentData.professionalId },
      });

      if (!professional || !professional.isActive) {
        throw new Error('Profesional no encontrado o inactivo');
      }

      // Validar que el tipo de tratamiento existe y pertenece al profesional
      const treatmentType = await prisma.treatmentType.findFirst({
        where: {
          id: appointmentData.treatmentTypeId,
          professionalId: appointmentData.professionalId,
          isActive: true,
        },
      });

      if (!treatmentType) {
        throw new Error('Tipo de tratamiento no válido para este profesional');
      }

      // Validar disponibilidad de horario
      const isAvailable = await this.checkAvailability(
        appointmentData.professionalId,
        appointmentData.startTime,
        appointmentData.endTime
      );

      if (!isAvailable) {
        throw new Error('El horario seleccionado no está disponible');
      }

      // Validar horarios de trabajo del profesional
      const isWithinWorkingHours = await this.isWithinWorkingHours(
        appointmentData.professionalId,
        appointmentData.startTime,
        appointmentData.endTime
      );

      if (!isWithinWorkingHours) {
        throw new Error('El horario está fuera del horario de trabajo del profesional');
      }

      const appointment = await prisma.appointment.create({
        data: appointmentData,
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
        },
      });

      logger.info(`Turno creado: ${appointment.id} para paciente ${patient.firstName} ${patient.lastName}`);
      return appointment;
    } catch (error) {
      logger.error('Error creando turno:', error);
      throw error;
    }
  }

  /**
   * Obtener turno por ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
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

      return appointment;
    } catch (error) {
      logger.error('Error obteniendo turno por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener turnos con filtros y paginación
   */
  async getAppointments(
    filters: AppointmentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'startTime',
        sortOrder = 'asc',
      } = pagination;

      const {
        startDate,
        endDate,
        professionalId,
        patientId,
        status,
        treatmentTypeId,
      } = filters;

      // Construir condiciones de filtro
      const where: any = {};

      if (startDate && endDate) {
        where.startTime = {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        };
      } else if (startDate) {
        where.startTime = { gte: startOfDay(startDate) };
      } else if (endDate) {
        where.startTime = { lte: endOfDay(endDate) };
      }

      if (professionalId) {
        where.professionalId = professionalId;
      }

      if (patientId) {
        where.patientId = patientId;
      }

      if (status) {
        where.status = status;
      }

      if (treatmentTypeId) {
        where.treatmentTypeId = treatmentTypeId;
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Obtener total de registros
      const total = await prisma.appointment.count({ where });

      // Obtener turnos
      const appointments = await prisma.appointment.findMany({
        where,
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
        data: appointments,
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
      logger.error('Error obteniendo turnos:', error);
      throw error;
    }
  }

  /**
   * Actualizar turno
   */
  async updateAppointment(
    id: string,
    updateData: UpdateAppointmentDTO,
    updatedById: string
  ): Promise<AppointmentWithRelations> {
    try {
      // Verificar que el turno existe
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: true,
          professional: true,
        },
      });

      if (!existingAppointment) {
        throw new Error('Turno no encontrado');
      }

      // Si se están actualizando fechas/horas, validar disponibilidad
      if (updateData.startTime || updateData.endTime) {
        const newStartTime = updateData.startTime || existingAppointment.startTime;
        const newEndTime = updateData.endTime || existingAppointment.endTime;

        // Validar disponibilidad (excluyendo el turno actual)
        const isAvailable = await this.checkAvailability(
          existingAppointment.professionalId,
          newStartTime,
          newEndTime,
          id
        );

        if (!isAvailable) {
          throw new Error('El nuevo horario no está disponible');
        }

        // Validar horarios de trabajo
        const isWithinWorkingHours = await this.isWithinWorkingHours(
          existingAppointment.professionalId,
          newStartTime,
          newEndTime
        );

        if (!isWithinWorkingHours) {
          throw new Error('El horario está fuera del horario de trabajo del profesional');
        }
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          ...updateData,
          updatedById,
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

      logger.info(`Turno actualizado: ${updatedAppointment.id}`);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error actualizando turno:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de turno
   */
  async changeAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    updatedById: string,
    observations?: string
  ): Promise<AppointmentWithRelations> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new Error('Turno no encontrado');
      }

      // Validar transiciones de estado válidas
      this.validateStatusTransition(appointment.status, status);

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status,
          updatedById,
          ...(observations && { observations }),
        },
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
        },
      });

      logger.info(`Estado de turno cambiado: ${id} -> ${status}`);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error cambiando estado de turno:', error);
      throw error;
    }
  }

  /**
   * Obtener slots disponibles para un profesional en una fecha
   */
  async getAvailableSlots(
    professionalId: string,
    date: Date,
    treatmentTypeId?: string
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    try {
      const dayOfWeek = date.getDay();
      
      // Obtener horarios de trabajo del profesional para ese día
      const workingHours = await prisma.workingHour.findFirst({
        where: {
          professionalId,
          dayOfWeek,
          isActive: true,
        },
      });

      if (!workingHours) {
        return []; // No trabaja ese día
      }

      // Obtener duración del tratamiento si se especifica
      let duration = 30; // Duración por defecto
      if (treatmentTypeId) {
        const treatmentType = await prisma.treatmentType.findUnique({
          where: { id: treatmentTypeId },
        });
        if (treatmentType) {
          duration = treatmentType.duration;
        }
      }

      // Crear slots de tiempo basados en el horario de trabajo
      const slots: { startTime: Date; endTime: Date }[] = [];
      const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
      const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

      const workStart = new Date(date);
      workStart.setHours(startHour, startMinute, 0, 0);

      const workEnd = new Date(date);
      workEnd.setHours(endHour, endMinute, 0, 0);

      let currentSlot = new Date(workStart);
      while (currentSlot < workEnd) {
        const slotEnd = addMinutes(currentSlot, duration);
        if (slotEnd <= workEnd) {
          slots.push({
            startTime: new Date(currentSlot),
            endTime: new Date(slotEnd),
          });
        }
        currentSlot = addMinutes(currentSlot, 30); // Slots cada 30 minutos
      }

      // Filtrar slots ocupados
      const occupiedSlots = await prisma.appointment.findMany({
        where: {
          professionalId,
          startTime: {
            gte: startOfDay(date),
            lt: endOfDay(date),
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      // Verificar bloqueos de horario
      const scheduleBlocks = await prisma.scheduleBlock.findMany({
        where: {
          professionalId,
          startDate: { lte: endOfDay(date) },
          endDate: { gte: startOfDay(date) },
        },
      });

      const availableSlots = slots.filter(slot => {
        // Verificar si el slot está ocupado por un turno
        const isOccupied = occupiedSlots.some(occupied => 
          (slot.startTime >= occupied.startTime && slot.startTime < occupied.endTime) ||
          (slot.endTime > occupied.startTime && slot.endTime <= occupied.endTime) ||
          (slot.startTime <= occupied.startTime && slot.endTime >= occupied.endTime)
        );

        // Verificar si el slot está bloqueado
        const isBlocked = scheduleBlocks.some(block =>
          (slot.startTime >= block.startDate && slot.startTime < block.endDate) ||
          (slot.endTime > block.startDate && slot.endTime <= block.endDate) ||
          (slot.startTime <= block.startDate && slot.endTime >= block.endDate)
        );

        return !isOccupied && !isBlocked;
      });

      return availableSlots;
    } catch (error) {
      logger.error('Error obteniendo slots disponibles:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de horario
   */
  async checkAvailability(
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const where: any = {
        professionalId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      };

      if (excludeAppointmentId) {
        where.NOT = { id: excludeAppointmentId };
      }

      const conflictingAppointments = await prisma.appointment.findMany({
        where,
      });

      // Verificar bloqueos de horario
      const scheduleBlocks = await prisma.scheduleBlock.findMany({
        where: {
          professionalId,
          startDate: { lte: endTime },
          endDate: { gte: startTime },
        },
      });

      return conflictingAppointments.length === 0 && scheduleBlocks.length === 0;
    } catch (error) {
      logger.error('Error verificando disponibilidad:', error);
      throw error;
    }
  }

  /**
   * Verificar si el horario está dentro de las horas de trabajo
   */
  private async isWithinWorkingHours(
    professionalId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const dayOfWeek = startTime.getDay();
      
      const workingHour = await prisma.workingHour.findFirst({
        where: {
          professionalId,
          dayOfWeek,
          isActive: true,
        },
      });

      if (!workingHour) {
        return false; // No trabaja ese día
      }

      const [workStartHour, workStartMinute] = workingHour.startTime.split(':').map(Number);
      const [workEndHour, workEndMinute] = workingHour.endTime.split(':').map(Number);

      const appointmentStartHour = startTime.getHours();
      const appointmentStartMinute = startTime.getMinutes();
      const appointmentEndHour = endTime.getHours();
      const appointmentEndMinute = endTime.getMinutes();

      const workStartMinutes = workStartHour * 60 + workStartMinute;
      const workEndMinutes = workEndHour * 60 + workEndMinute;
      const appointmentStartMinutes = appointmentStartHour * 60 + appointmentStartMinute;
      const appointmentEndMinutes = appointmentEndHour * 60 + appointmentEndMinute;

      return appointmentStartMinutes >= workStartMinutes && appointmentEndMinutes <= workEndMinutes;
    } catch (error) {
      logger.error('Error verificando horarios de trabajo:', error);
      return false;
    }
  }

  /**
   * Validar transiciones de estado válidas
   */
  private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.NO_SHOW,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CANCELLED]: [], // No se puede cambiar desde cancelado
      [AppointmentStatus.COMPLETED]: [], // No se puede cambiar desde completado
      [AppointmentStatus.NO_SHOW]: [], // No se puede cambiar desde no show
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Transición de estado inválida: ${currentStatus} -> ${newStatus}`);
    }
  }

  /**
   * Obtener turnos del día para un profesional
   */
  async getTodayAppointments(professionalId?: string): Promise<AppointmentWithRelations[]> {
    try {
      const today = new Date();
      const where: any = {
        startTime: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          professional: true,
          treatmentType: true,
        },
        orderBy: { startTime: 'asc' },
      });

      return appointments;
    } catch (error) {
      logger.error('Error obteniendo turnos del día:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de turnos
   */
  async getAppointmentStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    scheduled: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  }> {
    try {
      const where: any = {};

      if (startDate && endDate) {
        where.startTime = {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        };
      }

      const [total, scheduled, confirmed, cancelled, completed, noShow] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.count({ where: { ...where, status: AppointmentStatus.SCHEDULED } }),
        prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CONFIRMED } }),
        prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
        prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
        prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
      ]);

      return {
        total,
        scheduled,
        confirmed,
        cancelled,
        completed,
        noShow,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de turnos:', error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;