import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { treatmentTypeService } from '@/services/treatmentTypeService';
import { logger } from '@/config/logger';

class TreatmentTypeController {
  /**
   * POST /api/treatment-types
   * Crear nuevo tipo de tratamiento
   */
  async createTreatmentType(req: Request, res: Response): Promise<void> {
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

      const treatmentData = req.body;
      const treatmentType = await treatmentTypeService.createTreatmentType(treatmentData);

      res.status(201).json({
        success: true,
        message: 'Tipo de tratamiento creado exitosamente',
        data: treatmentType,
      });
    } catch (error) {
      logger.error('Error en createTreatmentType controller:', error);

      if (error instanceof Error) {
        if (error.message.includes('Profesional no encontrado')) {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'PROFESSIONAL_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Ya existe un tipo de tratamiento')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_TREATMENT_TYPE',
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
   * GET /api/treatment-types/:id
   * Obtener tipo de tratamiento por ID
   */
  async getTreatmentTypeById(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de tipo de tratamiento inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const includeRelations = req.query.include === 'relations';
      
      const treatmentType = await treatmentTypeService.getTreatmentTypeById(id, includeRelations);

      if (!treatmentType) {
        res.status(404).json({
          success: false,
          message: 'Tipo de tratamiento no encontrado',
          code: 'TREATMENT_TYPE_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Tipo de tratamiento obtenido exitosamente',
        data: treatmentType,
      });
    } catch (error) {
      logger.error('Error en getTreatmentTypeById controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/treatment-types
   * Obtener lista de tipos de tratamiento con filtros y paginación
   */
  async getTreatmentTypes(req: Request, res: Response): Promise<void> {
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
        professionalId,
        includeInactive,
      } = req.query;

      const pagination = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await treatmentTypeService.getTreatmentTypes(
        professionalId as string,
        pagination,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Tipos de tratamiento obtenidos exitosamente',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error en getTreatmentTypes controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/treatment-types/:id
   * Actualizar tipo de tratamiento
   */
  async updateTreatmentType(req: Request, res: Response): Promise<void> {
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

      const updatedTreatmentType = await treatmentTypeService.updateTreatmentType(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Tipo de tratamiento actualizado exitosamente',
        data: updatedTreatmentType,
      });
    } catch (error) {
      logger.error('Error en updateTreatmentType controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Tipo de tratamiento no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'TREATMENT_TYPE_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Ya existe un tipo de tratamiento')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_TREATMENT_TYPE',
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
   * DELETE /api/treatment-types/:id
   * Eliminar tipo de tratamiento (soft delete)
   */
  async deleteTreatmentType(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de tipo de tratamiento inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      await treatmentTypeService.deleteTreatmentType(id);

      res.status(200).json({
        success: true,
        message: 'Tipo de tratamiento eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error en deleteTreatmentType controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Tipo de tratamiento no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'TREATMENT_TYPE_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('turnos programados')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'TREATMENT_TYPE_HAS_APPOINTMENTS',
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
   * GET /api/treatment-types/by-professional/:professionalId
   * Obtener tipos de tratamiento por profesional
   */
  async getTreatmentTypesByProfessional(req: Request, res: Response): Promise<void> {
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

      const { professionalId } = req.params;
      const treatmentTypes = await treatmentTypeService.getTreatmentTypesByProfessional(professionalId);

      res.status(200).json({
        success: true,
        message: 'Tipos de tratamiento obtenidos exitosamente',
        data: treatmentTypes,
      });
    } catch (error) {
      logger.error('Error en getTreatmentTypesByProfessional controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/treatment-types/:id/duplicate
   * Duplicar tipo de tratamiento
   */
  async duplicateTreatmentType(req: Request, res: Response): Promise<void> {
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
      const { newName } = req.body;

      const duplicatedTreatmentType = await treatmentTypeService.duplicateTreatmentType(id, newName);

      res.status(201).json({
        success: true,
        message: 'Tipo de tratamiento duplicado exitosamente',
        data: duplicatedTreatmentType,
      });
    } catch (error) {
      logger.error('Error en duplicateTreatmentType controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Tipo de tratamiento no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'TREATMENT_TYPE_NOT_FOUND',
          });
          return;
        }

        if (error.message.includes('Ya existe un tipo de tratamiento')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'DUPLICATE_TREATMENT_TYPE',
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
   * GET /api/treatment-types/:id/stats
   * Obtener estadísticas de tipo de tratamiento
   */
  async getTreatmentTypeStats(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID de tipo de tratamiento inválido',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const stats = await treatmentTypeService.getTreatmentTypeStats(id);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getTreatmentTypeStats controller:', error);

      if (error instanceof Error) {
        if (error.message === 'Tipo de tratamiento no encontrado') {
          res.status(404).json({
            success: false,
            message: error.message,
            code: 'TREATMENT_TYPE_NOT_FOUND',
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
   * GET /api/treatment-types/search
   * Buscar tipos de tratamiento
   */
  async searchTreatmentTypes(req: Request, res: Response): Promise<void> {
    try {
      const { q, professionalId, limit } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido',
          code: 'MISSING_SEARCH_TERM',
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 10;
      const treatmentTypes = await treatmentTypeService.searchTreatmentTypes(
        q,
        professionalId as string,
        searchLimit
      );

      res.status(200).json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: treatmentTypes,
      });
    } catch (error) {
      logger.error('Error en searchTreatmentTypes controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/treatment-types/most-used
   * Obtener tipos de tratamiento más utilizados
   */
  async getMostUsedTreatmentTypes(req: Request, res: Response): Promise<void> {
    try {
      const { professionalId, limit } = req.query;

      const searchLimit = limit ? parseInt(limit as string, 10) : 5;
      const treatmentTypes = await treatmentTypeService.getMostUsedTreatmentTypes(
        professionalId as string,
        searchLimit
      );

      res.status(200).json({
        success: true,
        message: 'Tipos de tratamiento más utilizados obtenidos exitosamente',
        data: treatmentTypes,
      });
    } catch (error) {
      logger.error('Error en getMostUsedTreatmentTypes controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const treatmentTypeController = new TreatmentTypeController();
export default treatmentTypeController;