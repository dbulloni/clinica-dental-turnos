import React, { useEffect } from 'react';
import { User, Save, X } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import Alert from '../UI/Alert';
import { useForm } from '../../hooks/useForm';
import { useCreatePatient, useUpdatePatient, useCheckPatientDuplicate } from '../../hooks/usePatients';
import { Patient, CreatePatientData } from '../../types';

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSuccess?: (patient: Patient) => void;
}

const PatientForm: React.FC<PatientFormProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) => {
  const isEditing = !!patient;
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const checkDuplicateMutation = useCheckPatientDuplicate();

  const form = useForm({
    initialValues: {
      firstName: patient?.firstName || '',
      lastName: patient?.lastName || '',
      email: patient?.email || '',
      phone: patient?.phone || '',
      document: patient?.document || '',
      dateOfBirth: patient?.dateOfBirth || '',
      address: patient?.address || '',
      notes: patient?.notes || '',
    },
    validationRules: {
      firstName: {
        required: true,
        minLength: 2,
      },
      lastName: {
        required: true,
        minLength: 2,
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value: string) => {
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Formato de email inválido';
          }
          return null;
        },
      },
      phone: {
        required: true,
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        custom: (value: string) => {
          if (!value) return 'El teléfono es requerido';
          if (!/^[\+]?[1-9][\d]{8,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return 'Formato de teléfono inválido (ej: +54 11 1234-5678)';
          }
          return null;
        },
      },
      document: {
        required: true,
        minLength: 7,
        custom: (value: string) => {
          if (!value) return 'El documento es requerido';
          if (value.length < 7) return 'El documento debe tener al menos 7 caracteres';
          return null;
        },
      },
      dateOfBirth: {
        custom: (value: string) => {
          if (value) {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (birthDate > today) {
              return 'La fecha de nacimiento no puede ser futura';
            }
            if (age > 120) {
              return 'La fecha de nacimiento no es válida';
            }
          }
          return null;
        },
      },
    },
    onSubmit: async (values) => {
      try {
        // Verificar duplicados antes de crear/actualizar
        const duplicateCheck = await checkDuplicateMutation.mutateAsync({
          document: values.document,
          phone: values.phone.replace(/[\s\-\(\)]/g, ''),
          excludeId: patient?.id,
        });

        if (duplicateCheck.success && duplicateCheck.data) {
          const { documentExists, phoneExists } = duplicateCheck.data;
          
          if (documentExists) {
            form.setFieldError('document', 'Ya existe un paciente con este documento');
            return;
          }
          
          if (phoneExists) {
            form.setFieldError('phone', 'Ya existe un paciente con este teléfono');
            return;
          }
        }

        // Limpiar formato del teléfono
        const cleanedData: CreatePatientData = {
          ...values,
          phone: values.phone.replace(/[\s\-\(\)]/g, ''),
          email: values.email || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          address: values.address || undefined,
          notes: values.notes || undefined,
        };

        let response;
        if (isEditing) {
          response = await updatePatientMutation.mutateAsync({
            id: patient.id,
            data: cleanedData,
          });
        } else {
          response = await createPatientMutation.mutateAsync(cleanedData);
        }

        if (response.success && response.data) {
          onSuccess?.(response.data);
          handleClose();
        }
      } catch (error) {
        // Error handling is done by the mutation hooks
        console.error('Error submitting patient form:', error);
      }
    },
  });

  // Reset form when patient changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.resetForm();
      if (patient) {
        Object.keys(form.values).forEach((key) => {
          const value = patient[key as keyof Patient];
          form.setFieldValue(key as keyof typeof form.values, value || '');
        });
      }
    }
  }, [isOpen, patient]);

  const handleClose = () => {
    form.resetForm();
    onClose();
  };

  const isSubmitting = createPatientMutation.isLoading || 
                     updatePatientMutation.isLoading || 
                     checkDuplicateMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
      size="lg"
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="firstName"
              value={form.values.firstName}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.firstName ? form.errors.firstName : undefined}
              placeholder="Nombre del paciente"
              required
              autoComplete="given-name"
            />

            <Input
              label="Apellido"
              name="lastName"
              value={form.values.lastName}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.lastName ? form.errors.lastName : undefined}
              placeholder="Apellido del paciente"
              required
              autoComplete="family-name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Documento"
              name="document"
              value={form.values.document}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.document ? form.errors.document : undefined}
              placeholder="DNI, CI, Pasaporte"
              required
            />

            <Input
              label="Fecha de Nacimiento"
              type="date"
              name="dateOfBirth"
              value={form.values.dateOfBirth}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.dateOfBirth ? form.errors.dateOfBirth : undefined}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Información de Contacto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              name="phone"
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.phone ? form.errors.phone : undefined}
              placeholder="+54 11 1234-5678"
              required
              autoComplete="tel"
              helperText="Formato: +54 11 1234-5678 (para WhatsApp)"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.email ? form.errors.email : undefined}
              placeholder="email@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <Input
            label="Dirección"
            name="address"
            value={form.values.address}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.touched.address ? form.errors.address : undefined}
            placeholder="Dirección completa"
            autoComplete="street-address"
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Información Adicional
          </h3>
          
          <div className="space-y-2">
            <label className="label">Notas</label>
            <textarea
              name="notes"
              value={form.values.notes}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className="input min-h-[80px] resize-none"
              placeholder="Observaciones, alergias, tratamientos previos, etc."
              rows={3}
            />
            {form.touched.notes && form.errors.notes && (
              <p className="form-error">{form.errors.notes}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            icon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!form.isValid}
            icon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Paciente
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientForm;