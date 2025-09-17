import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { configService } from '@/services/configService';
import { logger } from '@/config/logger';

class ConfigController {
  /**
   * GET /api/config
   * Obtener todas las configuraciones
   */
  async getAllConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configs = await configService.getAllConfigs();

      res.status(200).json({
        success: true,
        message: 'Configuraciones obtenidas exitosamente',
        data: configs,
      });
    } catch (error) {
      logger.error('Error en getAllConfigs controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/config/:key
   * Obtener configuración por clave
   */
  async getConfigByKey(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Clave de configuración inválida',
          errors: errors.array(),
        });
        return;
      }

      const { key } = req.params;
      const config = await configService.getConfigByKey(key);

      if (!config) {
        res.status(404).json({
          success: false,
          message: 'Configuración no encontrada',
          code: 'CONFIG_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: config,
      });
    } catch (error) {
      logger.error('Error en getConfigByKey controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/config/:key
   * Actualizar configuración
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
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

      const { key } = req.params;
      const { value, description } = req.body;

      const config = await configService.updateConfig(key, value, description);

      res.status(200).json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: config,
      });
    } catch (error) {
      logger.error('Error en updateConfig controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/config/bulk-update
   * Actualizar múltiples configuraciones
   */
  async updateMultipleConfigs(req: Request, res: Response): Promise<void> {
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

      const { configs } = req.body;

      const updatedConfigs = await configService.updateMultipleConfigs(configs);

      res.status(200).json({
        success: true,
        message: 'Configuraciones actualizadas exitosamente',
        data: updatedConfigs,
      });
    } catch (error) {
      logger.error('Error en updateMultipleConfigs controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * DELETE /api/config/:key
   * Eliminar configuración
   */
  async deleteConfig(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Clave de configuración inválida',
          errors: errors.array(),
        });
        return;
      }

      const { key } = req.params;
      await configService.deleteConfig(key);

      res.status(200).json({
        success: true,
        message: 'Configuración eliminada exitosamente',
      });
    } catch (error) {
      logger.error('Error en deleteConfig controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/config/clinic/info
   * Obtener configuración de la clínica
   */
  async getClinicConfig(req: Request, res: Response): Promise<void> {
    try {
      const clinicConfig = await configService.getClinicConfig();

      res.status(200).json({
        success: true,
        message: 'Configuración de clínica obtenida exitosamente',
        data: clinicConfig,
      });
    } catch (error) {
      logger.error('Error en getClinicConfig controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * PUT /api/config/clinic/info
   * Actualizar configuración de la clínica
   */
  async updateClinicConfig(req: Request, res: Response): Promise<void> {
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

      const clinicData = req.body;
      await configService.updateClinicConfig(clinicData);

      res.status(200).json({
        success: true,
        message: 'Configuración de clínica actualizada exitosamente',
      });
    } catch (error) {
      logger.error('Error en updateClinicConfig controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/config/dashboard/stats
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await configService.getDashboardStats();

      res.status(200).json({
        success: true,
        message: 'Estadísticas del dashboard obtenidas exitosamente',
        data: stats,
      });
    } catch (error) {
      logger.error('Error en getDashboardStats controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/config/category/:category
   * Obtener configuraciones por categoría
   */
  async getConfigsByCategory(req: Request, res: Response): Promise<void> {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Categoría inválida',
          errors: errors.array(),
        });
        return;
      }

      const { category } = req.params;
      const configs = await configService.getConfigsByCategory(category);

      res.status(200).json({
        success: true,
        message: 'Configuraciones por categoría obtenidas exitosamente',
        data: configs,
      });
    } catch (error) {
      logger.error('Error en getConfigsByCategory controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/config/reset-defaults
   * Resetear configuraciones a valores por defecto
   */
  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      await configService.resetToDefaults();

      logger.info(`Configuraciones reseteadas por usuario: ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Configuraciones reseteadas a valores por defecto exitosamente',
      });
    } catch (error) {
      logger.error('Error en resetToDefaults controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * GET /api/config/export
   * Exportar configuraciones
   */
  async exportConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configs = await configService.exportConfigs();

      logger.info(`Configuraciones exportadas por usuario: ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Configuraciones exportadas exitosamente',
        data: configs,
      });
    } catch (error) {
      logger.error('Error en exportConfigs controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /api/config/import
   * Importar configuraciones
   */
  async importConfigs(req: Request, res: Response): Promise<void> {
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

      const { configs } = req.body;
      await configService.importConfigs(configs);

      logger.info(`Configuraciones importadas por usuario: ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Configuraciones importadas exitosamente',
      });
    } catch (error) {
      logger.error('Error en importConfigs controller:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const configController = new ConfigController();
export default configController;