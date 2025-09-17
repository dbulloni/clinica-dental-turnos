import { useState, useEffect } from 'react';
import { messageTemplatesApi } from '../services/api/messageTemplatesApi';

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email';
  category: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancellation' | 'appointment_rescheduled' | 'custom';
  subject?: string;
  message: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  name: string;
  type: 'whatsapp' | 'email';
  category: string;
  subject?: string;
  message: string;
  isActive: boolean;
  isDefault: boolean;
}

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageTemplatesApi.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: TemplateFormData) => {
    try {
      const response = await messageTemplatesApi.createTemplate(templateData);
      await fetchTemplates(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al crear la plantilla');
    }
  };

  const updateTemplate = async (templateId: string, templateData: Partial<TemplateFormData>) => {
    try {
      const response = await messageTemplatesApi.updateTemplate(templateId, templateData);
      await fetchTemplates(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al actualizar la plantilla');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await messageTemplatesApi.deleteTemplate(templateId);
      await fetchTemplates(); // Refresh the list
    } catch (err) {
      throw new Error('Error al eliminar la plantilla');
    }
  };

  const duplicateTemplate = async (templateId: string) => {
    try {
      const response = await messageTemplatesApi.duplicateTemplate(templateId);
      await fetchTemplates(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al duplicar la plantilla');
    }
  };

  const setDefaultTemplate = async (templateId: string) => {
    try {
      const response = await messageTemplatesApi.setDefaultTemplate(templateId);
      await fetchTemplates(); // Refresh the list
      return response.data;
    } catch (err) {
      throw new Error('Error al establecer como predeterminada');
    }
  };

  const previewTemplate = async (templateId: string, variables: Record<string, string>) => {
    try {
      const response = await messageTemplatesApi.previewTemplate(templateId, variables);
      return response.data;
    } catch (err) {
      throw new Error('Error al generar la vista previa');
    }
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.filter(template => template.category === category && template.isActive);
  };

  const getTemplatesByType = (type: 'whatsapp' | 'email') => {
    return templates.filter(template => template.type === type && template.isActive);
  };

  const getDefaultTemplate = (category: string, type: 'whatsapp' | 'email') => {
    return templates.find(template => 
      template.category === category && 
      template.type === type && 
      template.isDefault && 
      template.isActive
    );
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    previewTemplate,
    getTemplatesByCategory,
    getTemplatesByType,
    getDefaultTemplate,
    refetch: fetchTemplates,
  };
};

export const useTemplatePreview = () => {
  const [previewData, setPreviewData] = useState<{
    subject?: string;
    message: string;
    variables: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async (
    templateId: string, 
    variables: Record<string, string>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageTemplatesApi.previewTemplate(templateId, variables);
      setPreviewData(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la vista previa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviewData(null);
    setError(null);
  };

  return {
    previewData,
    loading,
    error,
    generatePreview,
    clearPreview,
  };
};

export const useTemplateVariables = () => {
  const [availableVariables, setAvailableVariables] = useState<Array<{
    key: string;
    description: string;
    category: string;
    required: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableVariables = async () => {
    try {
      setLoading(true);
      const response = await messageTemplatesApi.getAvailableVariables();
      setAvailableVariables(response.data);
    } catch (err) {
      console.error('Error loading available variables:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateTemplate = async (message: string, type: 'whatsapp' | 'email') => {
    try {
      const response = await messageTemplatesApi.validateTemplate({ message, type });
      return response.data;
    } catch (err) {
      throw new Error('Error al validar la plantilla');
    }
  };

  const extractVariables = (message: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(message)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  };

  const replaceVariables = (message: string, variables: Record<string, string>): string => {
    let result = message;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  };

  useEffect(() => {
    fetchAvailableVariables();
  }, []);

  return {
    availableVariables,
    loading,
    validateTemplate,
    extractVariables,
    replaceVariables,
    refetch: fetchAvailableVariables,
  };
};