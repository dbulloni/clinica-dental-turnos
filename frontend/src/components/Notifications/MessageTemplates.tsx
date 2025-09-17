import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Save,
  X,
  FileText,
  Calendar,
  User,
  Clock,
  MapPin
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import Table from '../UI/Table';
import { useMessageTemplates } from '../../hooks/useMessageTemplates';
import { useForm } from '../../hooks/useForm';
import toast from 'react-hot-toast';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email';
  category: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancellation' | 'appointment_rescheduled' | 'custom';
  subject?: string;
  message: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  type: 'whatsapp' | 'email';
  category: string;
  subject: string;
  message: string;
  isActive: boolean;
  isDefault: boolean;
}

const MessageTemplates: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    refetch
  } = useMessageTemplates();

  const initialFormData: TemplateFormData = {
    name: '',
    type: 'whatsapp',
    category: 'custom',
    subject: '',
    message: '',
    isActive: true,
    isDefault: false,
  };

  const {
    data: formData,
    errors,
    handleChange,
    handleSubmit,
    reset,
    setData,
  } = useForm<TemplateFormData>({
    initialData: initialFormData,
    validationRules: {
      name: { required: true, minLength: 3 },
      message: { required: true, minLength: 10 },
      subject: { required: formData.type === 'email' },
    },
  });

  // Available variables for templates
  const availableVariables = [
    { key: '{{patientName}}', description: 'Nombre del paciente' },
    { key: '{{appointmentDate}}', description: 'Fecha del turno' },
    { key: '{{appointmentTime}}', description: 'Hora del turno' },
    { key: '{{professionalName}}', description: 'Nombre del profesional' },
    { key: '{{treatmentType}}', description: 'Tipo de tratamiento' },
    { key: '{{clinicName}}', description: 'Nombre de la clínica' },
    { key: '{{clinicAddress}}', description: 'Dirección de la clínica' },
    { key: '{{clinicPhone}}', description: 'Teléfono de la clínica' },
    { key: '{{confirmationLink}}', description: 'Link de confirmación' },
    { key: '{{cancellationLink}}', description: 'Link de cancelación' },
  ];

  // Predefined templates
  const predefinedTemplates = {
    appointment_confirmation: {
      whatsapp: {
        name: 'Confirmación de Turno - WhatsApp',
        message: `Hola {{patientName}}! 👋

Tu turno ha sido confirmado:
📅 Fecha: {{appointmentDate}}
🕐 Hora: {{appointmentTime}}
👨‍⚕️ Profesional: {{professionalName}}
🦷 Tratamiento: {{treatmentType}}

📍 {{clinicName}}
{{clinicAddress}}

¡Te esperamos! Si necesitas cancelar o reprogramar, contáctanos al {{clinicPhone}}.`
      },
      email: {
        name: 'Confirmación de Turno - Email',
        subject: 'Confirmación de turno - {{clinicName}}',
        message: `Estimado/a {{patientName}},

Su turno ha sido confirmado con los siguientes detalles:

Fecha: {{appointmentDate}}
Hora: {{appointmentTime}}
Profesional: {{professionalName}}
Tratamiento: {{treatmentType}}

Ubicación:
{{clinicName}}
{{clinicAddress}}
Teléfono: {{clinicPhone}}

Si necesita cancelar o reprogramar su turno, por favor contáctenos con al menos 24 horas de anticipación.

Saludos cordiales,
Equipo de {{clinicName}}`
      }
    },
    appointment_reminder: {
      whatsapp: {
        name: 'Recordatorio de Turno - WhatsApp',
        message: `Hola {{patientName}}! 🔔

Te recordamos tu turno para mañana:
📅 {{appointmentDate}} a las {{appointmentTime}}
👨‍⚕️ Con {{professionalName}}
🦷 {{treatmentType}}

📍 {{clinicAddress}}

¡No olvides asistir! Si tienes algún inconveniente, llámanos al {{clinicPhone}}.`
      },
      email: {
        name: 'Recordatorio de Turno - Email',
        subject: 'Recordatorio: Turno mañana - {{clinicName}}',
        message: `Estimado/a {{patientName}},

Le recordamos que tiene un turno programado para mañana:

Fecha: {{appointmentDate}}
Hora: {{appointmentTime}}
Profesional: {{professionalName}}
Tratamiento: {{treatmentType}}

Por favor, llegue 10 minutos antes de su cita.

Si no puede asistir, le pedimos que nos avise con anticipación llamando al {{clinicPhone}}.

Saludos,
{{clinicName}}`
      }
    }
  };

  const handleCreate = () => {
    reset();
    setShowCreateModal(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setData({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      message: template.message,
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
    setShowEditModal(true);
  };

  const handlePreview = (template: MessageTemplate) => {
    // Mock data for preview
    const mockData = {
      patientName: 'Juan Pérez',
      appointmentDate: '15 de Diciembre, 2024',
      appointmentTime: '14:30',
      professionalName: 'Dr. María González',
      treatmentType: 'Limpieza dental',
      clinicName: 'Clínica Dental Sonrisa',
      clinicAddress: 'Av. Corrientes 1234, CABA',
      clinicPhone: '+54 11 1234-5678',
      confirmationLink: 'https://clinica.com/confirm/abc123',
      cancellationLink: 'https://clinica.com/cancel/abc123',
    };

    let previewMessage = template.message;
    let previewSubject = template.subject || '';

    // Replace variables with mock data
    Object.entries(mockData).forEach(([key, value]) => {
      const variable = `{{${key}}}`;
      previewMessage = previewMessage.replace(new RegExp(variable, 'g'), value);
      previewSubject = previewSubject.replace(new RegExp(variable, 'g'), value);
    });

    setPreviewData({
      ...template,
      message: previewMessage,
      subject: previewSubject,
    });
    setShowPreviewModal(true);
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (template.isDefault) {
      toast.error('No se puede eliminar una plantilla predeterminada');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
        toast.success('Plantilla eliminada exitosamente');
        refetch();
      } catch (error) {
        toast.error('Error al eliminar la plantilla');
      }
    }
  };

  const handleDuplicate = async (template: MessageTemplate) => {
    try {
      await duplicateTemplate(template.id);
      toast.success('Plantilla duplicada exitosamente');
      refetch();
    } catch (error) {
      toast.error('Error al duplicar la plantilla');
    }
  };

  const handleSetDefault = async (template: MessageTemplate) => {
    try {
      await setDefaultTemplate(template.id);
      toast.success('Plantilla establecida como predeterminada');
      refetch();
    } catch (error) {
      toast.error('Error al establecer como predeterminada');
    }
  };

  const onSubmitCreate = handleSubmit(async (data) => {
    try {
      await createTemplate(data);
      toast.success('Plantilla creada exitosamente');
      setShowCreateModal(false);
      reset();
      refetch();
    } catch (error) {
      toast.error('Error al crear la plantilla');
    }
  });

  const onSubmitEdit = handleSubmit(async (data) => {
    if (!selectedTemplate) return;
    try {
      await updateTemplate(selectedTemplate.id, data);
      toast.success('Plantilla actualizada exitosamente');
      setShowEditModal(false);
      reset();
      refetch();
    } catch (error) {
      toast.error('Error al actualizar la plantilla');
    }
  });

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentMessage = formData.message;
      const newMessage = currentMessage.substring(0, start) + variable + currentMessage.substring(end);
      
      handleChange({ target: { name: 'message', value: newMessage } } as any);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const loadPredefinedTemplate = (category: string, type: 'whatsapp' | 'email') => {
    const template = predefinedTemplates[category as keyof typeof predefinedTemplates]?.[type];
    if (template) {
      setData({
        ...formData,
        name: template.name,
        message: template.message,
        subject: template.subject || '',
        category,
        type,
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const categories = {
      appointment_confirmation: { label: 'Confirmación', color: 'bg-blue-100 text-blue-800' },
      appointment_reminder: { label: 'Recordatorio', color: 'bg-yellow-100 text-yellow-800' },
      appointment_cancellation: { label: 'Cancelación', color: 'bg-red-100 text-red-800' },
      appointment_rescheduled: { label: 'Reprogramación', color: 'bg-purple-100 text-purple-800' },
      custom: { label: 'Personalizada', color: 'bg-gray-100 text-gray-800' },
    };

    const config = categories[category as keyof typeof categories] || categories.custom;
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (template: MessageTemplate) => (
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            template.type === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {template.type === 'whatsapp' ? 
              <MessageSquare className="w-4 h-4 text-green-600" /> :
              <Mail className="w-4 h-4 text-blue-600" />
            }
          </div>
          <div>
            <div className="font-medium text-gray-900">{template.name}</div>
            <div className="text-sm text-gray-500 capitalize">{template.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (template: MessageTemplate) => getCategoryBadge(template.category),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (template: MessageTemplate) => (
        <div className="flex items-center space-x-2">
          <Badge variant={template.isActive ? 'success' : 'secondary'}>
            {template.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
          {template.isDefault && (
            <Badge variant="primary" size="sm">Predeterminada</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (template: MessageTemplate) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview(template)}
            icon={<Eye className="w-4 h-4" />}
          >
            Vista previa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(template)}
            icon={<Edit className="w-4 h-4" />}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(template)}
            icon={<Copy className="w-4 h-4" />}
          >
            Duplicar
          </Button>
          {!template.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(template)}
              icon={<Trash2 className="w-4 h-4" />}
              className="text-red-600 hover:text-red-700"
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  const TemplateForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Nombre de la plantilla"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="input"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Categoría</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
          >
            <option value="appointment_confirmation">Confirmación de turno</option>
            <option value="appointment_reminder">Recordatorio de turno</option>
            <option value="appointment_cancellation">Cancelación de turno</option>
            <option value="appointment_rescheduled">Reprogramación de turno</option>
            <option value="custom">Personalizada</option>
          </select>
        </div>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadPredefinedTemplate(formData.category, formData.type)}
            disabled={formData.category === 'custom'}
          >
            Cargar plantilla predefinida
          </Button>
        </div>
      </div>

      {formData.type === 'email' && (
        <div>
          <Input
            label="Asunto"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            error={errors.subject}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <label className="label">Mensaje</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={`input min-h-[200px] resize-none ${errors.message ? 'border-red-500' : ''}`}
            placeholder="Escribe tu mensaje aquí..."
            rows={8}
          />
          {errors.message && (
            <p className="text-sm text-red-600 mt-1">{errors.message}</p>
          )}
        </div>

        <div>
          <label className="label">Variables disponibles</label>
          <div className="bg-gray-50 border rounded-lg p-3 max-h-[200px] overflow-y-auto">
            <div className="space-y-2">
              {availableVariables.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  className="w-full text-left p-2 text-xs bg-white border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-mono text-blue-600">{variable.key}</div>
                  <div className="text-gray-600">{variable.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange({ target: { name: 'isActive', value: e.target.checked } } as any)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Plantilla activa</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={(e) => handleChange({ target: { name: 'isDefault', value: e.target.checked } } as any)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Plantilla predeterminada</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            reset();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {submitText}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plantillas de Mensajes</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las plantillas para notificaciones WhatsApp y email
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          icon={<Plus className="w-4 h-4" />}
        >
          Nueva Plantilla
        </Button>
      </div>

      {/* Templates Table */}
      <Card>
        <Card.Body>
          <Table
            data={templates}
            columns={columns}
            loading={loading}
            emptyMessage="No se encontraron plantillas"
          />
        </Card.Body>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Plantilla de Mensaje"
        size="xl"
      >
        <TemplateForm onSubmit={onSubmitCreate} submitText="Crear Plantilla" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Plantilla de Mensaje"
        size="xl"
      >
        <TemplateForm onSubmit={onSubmitEdit} submitText="Actualizar Plantilla" />
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Vista Previa de Plantilla"
        size="lg"
      >
        {previewData && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                previewData.type === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {previewData.type === 'whatsapp' ? 
                  <MessageSquare className="w-4 h-4 text-green-600" /> :
                  <Mail className="w-4 h-4 text-blue-600" />
                }
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{previewData.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{previewData.type}</p>
              </div>
            </div>

            {previewData.subject && (
              <div>
                <label className="label">Asunto</label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-900">
                  {previewData.subject}
                </div>
              </div>
            )}

            <div>
              <label className="label">Mensaje</label>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-900 whitespace-pre-wrap border">
                {previewData.message}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MessageTemplates;