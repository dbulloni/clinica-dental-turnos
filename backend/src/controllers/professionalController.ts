import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { professionalService } from '@/services/professionalService';
import { logger } from '@/config/logger';

class ProfessionalController {
  /**
   * POST /api/professionals
   * Crear nuevo profesional
   */
  async createProfessional(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const professionalData = req.body;
      const professional = await professionalService.createProfessional(professionalData);

      res.status(201).json({
        success: true,
        message: 'Profesional creado exitosamente',
        data: professional,
      });
    } catch (error) {
      logger.error('Error en createProfessional controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('Ya existe un profesional')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_PROFESSIONAL',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals/:id
   * Obtener profesional por ID
   */
  async getProfessionalById(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de profesional inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const includeRelations = req.query.include === 'relations';
      
      const professional = await professionalService.getProfessionalById(id, includeRelations);

      if (!professional) {
        res.status(404).json({
          success: false,
          message: 'Profesional no encontrado',
          code: 'PROFESSIONAL_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profesional obtenido exitosamente',
        data: professional,
      });
    } catch (error) {
      logger.error('Error en getProfessionalById controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals
   * Obtener lista de profesionales con paginación
   */
  async getProfessionals(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: errors.array(),
        });
        return;
      }

      const {
        page,
        limit,
        sortBy,
        sortOrder,
        includeInactive,
      } = req.query;

      const pagination = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await professionalService.getProfessionals(
        pagination,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Profesionales obtenidos exitosamente',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error en getProfessionals controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/professionals/:id
   * Actualizar profesional
   */
  async updateProfessional(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const updatedProfessional = await professionalService.updateProfessional(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Profesional actualizado exitosamente',
        data: updatedProfessional,
      });
    } catch (error) {
      logger.error('Error en updateProfessional controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Profesional no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Ya existe un profesional')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_PROFESSIONAL',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * DELETE /api/professionals/:id
   * Eliminar profesional (soft delete)
   */
  async deleteProfessional(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de profesional inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      await professionalService.deleteProfessional(id);

      res.status(200).json({
        success: true,
        message: 'Profesional eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error en deleteProfessional controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Profesional no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('turnos programados')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_HAS_APPOINTMENTS',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/professionals/:id/working-hours
   * Configurar horarios de trabajo
   */
  async setWorkingHours(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { workingHours } = req.body;

      const createdHours = await professionalService.setWorkingHours(id, workingHours);

      res.status(200).json({
        success: true,
        message: 'Horarios de trabajo configurados exitosamente',
        data: createdHours,
      });
    } catch (error) {
      logger.error('Error en setWorkingHours controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Profesional no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('inválido') || error.message.includes('debe')) {
          res.status(400).json({
            success: false,
            message: error.message,
            code: 'INVALID_WORKING_HOURS',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals/:id/working-hours
   * Obtener horarios de trabajo
   */
  async getWorkingHours(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de profesional inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const workingHours = await professionalService.getWorkingHours(id);

      res.status(200).json({
        success: true,
        message: 'Horarios de trabajo obtenidos exitosamente',
        data: workingHours,
      });
    } catch (error) {
      logger.error('Error en getWorkingHours controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/professionals/:id/schedule-blocks
   * Crear bloqueo de horario
   */
  async createScheduleBlock(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const blockData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const scheduleBlock = await professionalService.createScheduleBlock(id, blockData);

      res.status(201).json({
        success: true,
        message: 'Bloqueo de horario creado exitosamente',
        data: scheduleBlock,
      });
    } catch (error) {
      logger.error('Error en createScheduleBlock controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Profesional no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('conflicta') || error.message.includes('posterior')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'SCHEDULE_CONFLICT',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals/:id/schedule-blocks
   * Obtener bloqueos de horario
   */
  async getScheduleBlocks(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const scheduleBlocks = await professionalService.getScheduleBlocks(
        id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Bloqueos de horario obtenidos exitosamente',
        data: scheduleBlocks,
      });
    } catch (error) {
      logger.error('Error en getScheduleBlocks controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * DELETE /api/professionals/schedule-blocks/:blockId
   * Eliminar bloqueo de horario
   */
  async deleteScheduleBlock(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de bloqueo inválido',
          errors: errors.array(),
        });
        return;
      }

      const { blockId } = req.params;
      await professionalService.deleteScheduleBlock(blockId);

      res.status(200).json({
        success: true,
        message: 'Bloqueo de horario eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error en deleteScheduleBlock controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Bloqueo de horario no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'SCHEDULE_BLOCK_NOT_FOUND',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals/:id/stats
   * Obtener estadísticas de profesional
   */
  async getProfessionalStats(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de profesional inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const stats = await professionalService.getProfessionalStats(id);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getProfessionalStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/professionals/active
   * Obtener profesionales activos (para selects)
   */
  async getActiveProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const professionals = await professionalService.getActiveProfessionals();

      res.status(200).json({
        success: true,
        message: 'Profesionales activos obtenidos exitosamente',
        data: professionals,
      });
    } catch (error) {
      logger.error('Error en getActiveProfessionals controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const professionalController = new ProfessionalController();
export default professionalController;