import { apiClient } from './client';
import { MessageTemplate, TemplateFormData } from '../../hooks/useMessageTemplates';

export interface TemplateResponse {
  data: MessageTemplate[];
  message: string;
}

export interface SingleTemplateResponse {
  data: MessageTemplate;
  message: string;
}

export const messageTemplatesApi = {
  // Get all templates
  getTemplates: (): Promise<TemplateResponse> => {
    return apiClient.get('/api/message-templates');
  },

  // Get template by ID
  getTemplate: (templateId: string): Promise<SingleTemplateResponse> => {
    return apiClient.get(`/api/message-templates/${templateId}`);
  },

  // Create new template
  createTemplate: (templateData: TemplateFormData): Promise<SingleTemplateResponse> => {
    return apiClient.post('/api/message-templates', templateData);
  },

  // Update template
  updateTemplate: (templateId: string, templateData: Partial<TemplateFormData>): Promise<SingleTemplateResponse> => {
    return apiClient.put(`/api/message-templates/${templateId}`, templateData);
  },

  // Delete template
  deleteTemplate: (templateId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/message-templates/${templateId}`);
  },

  // Duplicate template
  duplicateTemplate: (templateId: string): Promise<SingleTemplateResponse> => {
    return apiClient.post(`/api/message-templates/${templateId}/duplicate`);
  },

  // Set as default template
  setDefaultTemplate: (templateId: string): Promise<SingleTemplateResponse> => {
    return apiClient.patch(`/api/message-templates/${templateId}/set-default`);
  },

  // Preview template with variables
  previewTemplate: (templateId: string, variables: Record<string, string>): Promise<{
    data: {
      subject?: string;
      message: string;
      variables: Record<string, string>;
    };
    message: string;
  }> => {
    return apiClient.post(`/api/message-templates/${templateId}/preview`, { variables });
  },

  // Get available variables
  getAvailableVariables: (): Promise<{
    data: Array<{
      key: string;
      description: string;
      category: string;
      required: boolean;
    }>;
    message: string;
  }> => {
    return apiClient.get('/api/message-templates/variables');
  },

  // Validate template
  validateTemplate: (data: { message: string; type: 'whatsapp' | 'email' }): Promise<{
    data: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      variables: string[];
    };
    message: string;
  }> => {
    return apiClient.post('/api/message-templates/validate', data);
  },
};