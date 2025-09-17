import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Settings,
  TestTube,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Badge from '../UI/Badge';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useForm } from '../../hooks/useForm';
import toast from 'react-hot-toast';

interface NotificationSettingsData {
  // WhatsApp Configuration
  whatsappEnabled: boolean;
  whatsappApiUrl: string;
  whatsappToken: string;
  whatsappPhoneNumber: string;
  whatsappWebhookUrl: string;
  
  // Email Configuration
  emailEnabled: boolean;
  emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  
  // Notification Rules
  appointmentReminderHours: number;
  maxRetryAttempts: number;
  retryIntervalMinutes: number;
  enableConfirmationRequests: boolean;
  enableCancellationNotifications: boolean;
  enableReschedulingNotifications: boolean;
  
  // Business Hours
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  
  // Advanced Settings
  enableDeliveryReports: boolean;
  enableReadReceipts: boolean;
  enableAutoResend: boolean;
  enableBulkNotifications: boolean;
  rateLimitPerMinute: number;
  enableNotificationQueue: boolean;
}

const NotificationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'rules' | 'advanced'>('whatsapp');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const {
    settings,
    loading,
    updateSettings,
    testWhatsAppConnection,
    testEmailConnection,
    refetch
  } = useNotificationSettings();

  const {
    data: formData,
    errors,
    handleChange,
    handleSubmit,
    setData,
  } = useForm<NotificationSettingsData>({
    initialData: settings || {} as NotificationSettingsData,
    validationRules: {
      whatsappToken: { required: formData.whatsappEnabled },
      whatsappPhoneNumber: { required: formData.whatsappEnabled },
      emailHost: { required: formData.emailEnabled },
      emailPort: { required: formData.emailEnabled, min: 1, max: 65535 },
      emailUser: { required: formData.emailEnabled, email: true },
      emailFromAddress: { required: formData.emailEnabled, email: true },
      appointmentReminderHours: { required: true, min: 1, max: 168 },
      maxRetryAttempts: { required: true, min: 1, max: 10 },
      retryIntervalMinutes: { required: true, min: 1, max: 1440 },
      rateLimitPerMinute: { required: true, min: 1, max: 1000 },
    },
  });

  React.useEffect(() => {
    if (settings) {
      setData(settings);
    }
  }, [settings, setData]);

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    try {
      const result = await testWhatsAppConnection({
        token: formData.whatsappToken,
        phoneNumber: formData.whatsappPhoneNumber,
        apiUrl: formData.whatsappApiUrl,
      });
      
      if (result.success) {
        toast.success('Conexión WhatsApp exitosa');
      } else {
        toast.error(`Error en WhatsApp: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al probar la conexión WhatsApp');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const result = await testEmailConnection({
        provider: formData.emailProvider,
        host: formData.emailHost,
        port: formData.emailPort,
        user: formData.emailUser,
        password: formData.emailPassword,
        fromAddress: formData.emailFromAddress,
      });
      
      if (result.success) {
        toast.success('Conexión Email exitosa');
      } else {
        toast.error(`Error en Email: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al probar la conexión Email');
    } finally {
      setTestingEmail(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateSettings(data);
      toast.success('Configuración guardada exitosamente');
      refetch();
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  });

  const tabs = [
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { key: 'rules', label: 'Reglas', icon: <Bell className="w-4 h-4" /> },
    { key: 'advanced', label: 'Avanzado', icon: <Settings className="w-4 h-4" /> },
  ];

  const businessDaysOptions = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const handleBusinessDayChange = (day: string, checked: boolean) => {
    const currentDays = formData.businessDays || [];
    const newDays = checked 
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    
    handleChange({ target: { name: 'businessDays', value: newDays } } as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h2>
          <p className="text-gray-600 mt-1">
            Configura los servicios de WhatsApp y Email para las notificaciones
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onSubmit}
          icon={<Save className="w-4 h-4" />}
          loading={loading}
        >
          Guardar Cambios
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* WhatsApp Configuration */}
        {activeTab === 'whatsapp' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Configuración WhatsApp</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="whatsappEnabled"
                    checked={formData.whatsappEnabled}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Habilitado</span>
                </label>
              </div>
            </Card.Header>
            <Card.Body>
              {formData.whatsappEnabled ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="URL de la API"
                        name="whatsappApiUrl"
                        value={formData.whatsappApiUrl}
                        onChange={handleChange}
                        placeholder="https://api.whatsapp.com/v1"
                      />
                    </div>
                    <div>
                      <Input
                        label="Número de teléfono"
                        name="whatsappPhoneNumber"
                        value={formData.whatsappPhoneNumber}
                        onChange={handleChange}
                        error={errors.whatsappPhoneNumber}
                        placeholder="+54 11 1234-5678"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Token de acceso"
                      name="whatsappToken"
                      type="password"
                      value={formData.whatsappToken}
                      onChange={handleChange}
                      error={errors.whatsappToken}
                      placeholder="Token de la API de WhatsApp"
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="URL del Webhook"
                      name="whatsappWebhookUrl"
                      value={formData.whatsappWebhookUrl}
                      onChange={handleChange}
                      placeholder="https://tu-dominio.com/webhook/whatsapp"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleTestWhatsApp}
                      loading={testingWhatsApp}
                      icon={<TestTube className="w-4 h-4" />}
                    >
                      Probar Conexión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    WhatsApp está deshabilitado. Actívalo para configurar las opciones.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Email Configuration */}
        {activeTab === 'email' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Configuración Email</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="emailEnabled"
                    checked={formData.emailEnabled}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Habilitado</span>
                </label>
              </div>
            </Card.Header>
            <Card.Body>
              {formData.emailEnabled ? (
                <div className="space-y-6">
                  <div>
                    <label className="label">Proveedor de Email</label>
                    <select
                      name="emailProvider"
                      value={formData.emailProvider}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="smtp">SMTP Personalizado</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Servidor SMTP"
                        name="emailHost"
                        value={formData.emailHost}
                        onChange={handleChange}
                        error={errors.emailHost}
                        placeholder="smtp.gmail.com"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Puerto"
                        name="emailPort"
                        type="number"
                        value={formData.emailPort}
                        onChange={handleChange}
                        error={errors.emailPort}
                        placeholder="587"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Usuario"
                        name="emailUser"
                        type="email"
                        value={formData.emailUser}
                        onChange={handleChange}
                        error={errors.emailUser}
                        placeholder="usuario@gmail.com"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Contraseña"
                        name="emailPassword"
                        type="password"
                        value={formData.emailPassword}
                        onChange={handleChange}
                        placeholder="Contraseña de aplicación"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Email remitente"
                        name="emailFromAddress"
                        type="email"
                        value={formData.emailFromAddress}
                        onChange={handleChange}
                        error={errors.emailFromAddress}
                        placeholder="noreply@clinica.com"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Nombre remitente"
                        name="emailFromName"
                        value={formData.emailFromName}
                        onChange={handleChange}
                        placeholder="Clínica Dental"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleTestEmail}
                      loading={testingEmail}
                      icon={<TestTube className="w-4 h-4" />}
                    >
                      Probar Conexión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Email está deshabilitado. Actívalo para configurar las opciones.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Notification Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Reglas de Notificación</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Input
                        label="Recordatorio (horas antes)"
                        name="appointmentReminderHours"
                        type="number"
                        value={formData.appointmentReminderHours}
                        onChange={handleChange}
                        error={errors.appointmentReminderHours}
                        min={1}
                        max={168}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Máximo intentos"
                        name="maxRetryAttempts"
                        type="number"
                        value={formData.maxRetryAttempts}
                        onChange={handleChange}
                        error={errors.maxRetryAttempts}
                        min={1}
                        max={10}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Intervalo entre intentos (min)"
                        name="retryIntervalMinutes"
                        type="number"
                        value={formData.retryIntervalMinutes}
                        onChange={handleChange}
                        error={errors.retryIntervalMinutes}
                        min={1}
                        max={1440}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Tipos de Notificación</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="enableConfirmationRequests"
                          checked={formData.enableConfirmationRequests}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Solicitudes de confirmación</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="enableCancellationNotifications"
                          checked={formData.enableCancellationNotifications}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Notificaciones de cancelación</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="enableReschedulingNotifications"
                          checked={formData.enableReschedulingNotifications}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Notificaciones de reprogramación</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Horario Comercial</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="businessHoursEnabled"
                      checked={formData.businessHoursEnabled}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Respetar horario comercial</span>
                  </label>
                </div>
              </Card.Header>
              <Card.Body>
                {formData.businessHoursEnabled && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Input
                          label="Hora de inicio"
                          name="businessHoursStart"
                          type="time"
                          value={formData.businessHoursStart}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Input
                          label="Hora de fin"
                          name="businessHoursEnd"
                          type="time"
                          value={formData.businessHoursEnd}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Días laborables</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {businessDaysOptions.map((day) => (
                          <label key={day.key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.businessDays?.includes(day.key) || false}
                              onChange={(e) => handleBusinessDayChange(day.key, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Configuración Avanzada</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Límite de envíos por minuto"
                      name="rateLimitPerMinute"
                      type="number"
                      value={formData.rateLimitPerMinute}
                      onChange={handleChange}
                      error={errors.rateLimitPerMinute}
                      min={1}
                      max={1000}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Opciones Avanzadas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="enableDeliveryReports"
                        checked={formData.enableDeliveryReports}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Reportes de entrega</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="enableReadReceipts"
                        checked={formData.enableReadReceipts}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Confirmaciones de lectura</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="enableAutoResend"
                        checked={formData.enableAutoResend}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Reenvío automático</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="enableBulkNotifications"
                        checked={formData.enableBulkNotifications}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Notificaciones masivas</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="enableNotificationQueue"
                        checked={formData.enableNotificationQueue}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Cola de notificaciones</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Importante</p>
                      <p className="mt-1">
                        Los cambios en la configuración avanzada pueden afectar el rendimiento del sistema.
                        Asegúrate de probar la configuración antes de aplicarla en producción.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
      </form>
    </div>
  );
};

export default NotificationSettings;