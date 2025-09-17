import React, { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Alert from '../UI/Alert';
import { useForm } from '../../hooks/useForm';
import { authApi } from '../../services/api/authApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface ForgotPasswordFormProps {
  onBack: () => void;
  onSuccess?: (email: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBack,
  onSuccess,
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { handleError } = useErrorHandler();

  const form = useForm({
    initialValues: {
      email: '',
    },
    validationRules: {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    onSubmit: async (values) => {
      try {
        // TODO: Implement forgot password API call
        // const response = await authApi.forgotPassword(values.email);
        
        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsSubmitted(true);
        onSuccess?.(values.email);
      } catch (error) {
        handleError(error, 'Error al enviar el correo de recuperación');
      }
    },
  });

  if (isSubmitted) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Correo Enviado
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Hemos enviado un enlace de recuperación a <strong>{form.values.email}</strong>.
            Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={onBack}
            >
              Volver al Login
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsSubmitted(false)}
            >
              Enviar Nuevamente
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={form.handleSubmit} className="space-y-6">
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.touched.email ? form.errors.email : undefined}
            placeholder="tu@email.com"
            required
            autoComplete="email"
            autoFocus
            startIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={form.isSubmitting}
              disabled={!form.isValid}
              icon={<Send className="w-4 h-4" />}
            >
              Enviar Enlace de Recuperación
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={onBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Volver al Login
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  );
};

export default ForgotPasswordForm;