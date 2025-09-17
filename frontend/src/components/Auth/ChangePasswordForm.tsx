import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Save } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Alert from '../UI/Alert';
import { useForm } from '../../hooks/useForm';
import { authApi } from '../../services/api/authApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCard?: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel,
  showCard = true,
}) => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const { handleError } = useErrorHandler();

  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationRules: {
      currentPassword: {
        required: true,
        minLength: 1,
      },
      newPassword: {
        required: true,
        minLength: 6,
        custom: (value: string) => {
          if (value.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
          }
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
          }
          return null;
        },
      },
      confirmPassword: {
        required: true,
        custom: (value: string) => {
          if (value !== form.values.newPassword) {
            return 'Las contraseñas no coinciden';
          }
          return null;
        },
      },
    },
    onSubmit: async (values) => {
      try {
        const response = await authApi.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

        if (response.success) {
          toast.success('Contraseña cambiada exitosamente');
          form.resetForm();
          onSuccess?.();
        } else {
          throw new Error(response.message || 'Error al cambiar la contraseña');
        }
      } catch (error) {
        handleError(error, 'Error al cambiar la contraseña');
      }
    },
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const formContent = (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Cambiar Contraseña
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Actualiza tu contraseña para mantener tu cuenta segura.
        </p>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-6">
        <Input
          label="Contraseña Actual"
          type={showPasswords.current ? 'text' : 'password'}
          name="currentPassword"
          value={form.values.currentPassword}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.currentPassword ? form.errors.currentPassword : undefined}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          startIcon={<Lock className="w-4 h-4" />}
          endIcon={
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPasswords.current ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <Input
          label="Nueva Contraseña"
          type={showPasswords.new ? 'text' : 'password'}
          name="newPassword"
          value={form.values.newPassword}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.newPassword ? form.errors.newPassword : undefined}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          startIcon={<Lock className="w-4 h-4" />}
          endIcon={
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
          helperText="Mínimo 6 caracteres, debe incluir mayúscula, minúscula y número"
        />

        <Input
          label="Confirmar Nueva Contraseña"
          type={showPasswords.confirm ? 'text' : 'password'}
          name="confirmPassword"
          value={form.values.confirmPassword}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.confirmPassword ? form.errors.confirmPassword : undefined}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          startIcon={<Lock className="w-4 h-4" />}
          endIcon={
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <div className="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            loading={form.isSubmitting}
            disabled={!form.isValid}
            icon={<Save className="w-4 h-4" />}
          >
            Cambiar Contraseña
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </>
  );

  if (showCard) {
    return (
      <Card>
        <Card.Body>
          {formContent}
        </Card.Body>
      </Card>
    );
  }

  return <div>{formContent}</div>;
};

export default ChangePasswordForm;