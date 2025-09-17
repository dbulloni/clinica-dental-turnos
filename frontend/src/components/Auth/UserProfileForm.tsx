import React from 'react';
import { User, Save } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api/authApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

interface UserProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCard?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSuccess,
  onCancel,
  showCard = true,
}) => {
  const { user, updateUser } = useAuth();
  const { handleError } = useErrorHandler();

  const form = useForm({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
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
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    onSubmit: async (values) => {
      try {
        const response = await authApi.updateProfile(values);

        if (response.success && response.data) {
          updateUser(response.data);
          toast.success('Perfil actualizado exitosamente');
          onSuccess?.();
        } else {
          throw new Error(response.message || 'Error al actualizar el perfil');
        }
      } catch (error) {
        handleError(error, 'Error al actualizar el perfil');
      }
    },
  });

  if (!user) {
    return null;
  }

  const formContent = (
    <>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Perfil de Usuario
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={user.role === 'ADMIN' ? 'primary' : 'secondary'}>
                {user.role === 'ADMIN' ? 'Administrador' : 'Secretaria'}
              </Badge>
              <Badge variant={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            type="text"
            name="firstName"
            value={form.values.firstName}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.touched.firstName ? form.errors.firstName : undefined}
            placeholder="Tu nombre"
            required
            autoComplete="given-name"
          />

          <Input
            label="Apellido"
            type="text"
            name="lastName"
            value={form.values.lastName}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.touched.lastName ? form.errors.lastName : undefined}
            placeholder="Tu apellido"
            required
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          name="email"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.email ? form.errors.email : undefined}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Información de la Cuenta
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Fecha de Creación:</strong> {new Date(user.createdAt).toLocaleDateString('es-ES')}</p>
            <p><strong>Última Actualización:</strong> {new Date(user.updatedAt).toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            loading={form.isSubmitting}
            disabled={!form.isValid}
            icon={<Save className="w-4 h-4" />}
          >
            Guardar Cambios
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

export default UserProfileForm;