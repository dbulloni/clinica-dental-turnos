# Componentes Frontend - Sistema de Turnos

Este directorio contiene todos los componentes React del sistema de turnos odontológicos.

## Estructura de Componentes

### 🔐 Auth Components (`/Auth`)
- **ProtectedRoute**: Protege rutas que requieren autenticación
- **PermissionGuard**: Controla acceso basado en roles y permisos
- **ForgotPasswordForm**: Formulario de recuperación de contraseña
- **ChangePasswordForm**: Formulario para cambiar contraseña
- **UserProfileForm**: Formulario de edición de perfil de usuario
- **InactivityHandler**: Manejo de auto-logout por inactividad

### 🎨 UI Components (`/UI`)
Componentes base reutilizables con diseño consistente:

#### Componentes Base
- **Button**: Botón con variantes, tamaños y estados de carga
- **Input**: Campo de entrada con validación y iconos
- **Modal**: Modal responsivo con overlay y animaciones
- **Card**: Contenedor con header, body y footer
- **Table**: Tabla con ordenamiento, paginación y estados vacíos
- **Badge**: Etiquetas de estado con diferentes variantes
- **LoadingSpinner**: Indicador de carga con diferentes tamaños

#### Componentes de Utilidad
- **Alert**: Alertas de éxito, error, advertencia e información
- **EmptyState**: Estado vacío con icono, título y acción
- **ErrorBoundary**: Manejo de errores de React con recuperación
- **Skeleton**: Placeholders de carga para diferentes contenidos
- **DevTools**: Herramientas de desarrollo (solo en dev)

### 🏗️ Layout Components (`/Layout`)
- **Layout**: Layout principal con sidebar y header
- **Header**: Barra superior con navegación y usuario
- **Sidebar**: Navegación lateral con menús por rol

### 👥 Patient Components (`/Patients`)
- **PatientForm**: Formulario completo de registro/edición de pacientes
- **PatientList**: Tabla de pacientes con acciones y filtros
- **PatientSearch**: Búsqueda en tiempo real con autocompletado
- **PatientHistory**: Historial de turnos del paciente
- **PatientDetailsModal**: Modal con información completa del paciente

### 📅 Calendar Components (`/Calendar`)
- **CalendarView**: Componente principal del calendario con navegación
- **MonthView**: Vista mensual con turnos agrupados por día
- **WeekView**: Vista semanal con slots de tiempo detallados
- **DayView**: Vista diaria con información completa de turnos

### 🗓️ Appointment Components (`/Appointments`)
- **AppointmentForm**: Formulario completo de creación/edición de turnos

## 🎯 Hooks Personalizados (`/hooks`)

### useErrorHandler
Manejo centralizado de errores con mensajes específicos:
```typescript
const { handleError, handleApiError } = useErrorHandler();

// Manejo de errores generales
handleError(error, 'Mensaje personalizado');

// Manejo de errores de API con códigos específicos
handleApiError(apiError);
```

### useLoadingState
Gestión de estados de carga:
```typescript
const { isLoading, setLoading, withLoading } = useLoadingState();

// Ejecutar función con loading automático
const result = await withLoading(async () => {
  return await apiCall();
});
```

### useInactivityTimer
Auto-logout por inactividad:
```typescript
useInactivityTimer({
  timeout: 30 * 60 * 1000, // 30 minutos
  enabled: isAuthenticated,
  onTimeout: () => logout(),
});
```

### useDebounce
Debounce para búsquedas en tiempo real:
```typescript
const debouncedQuery = useDebounce(searchQuery, 300);
```

### usePatients
Gestión completa de pacientes:
```typescript
const { data, isLoading } = usePatients({ search: 'Juan', page: 1 });
const createMutation = useCreatePatient();
const updateMutation = useUpdatePatient();
```

### useCalendar
Navegación y gestión de calendario:
```typescript
const calendar = useCalendar({ initialView: 'month' });
const { currentDate, view, calendarDays, goToNext, goToPrevious } = calendar;
```

### useAppointments
Gestión completa de turnos:
```typescript
const { data } = useAppointmentsByDateRange(startDate, endDate);
const createMutation = useCreateAppointment();
const { data: slots } = useAvailableSlots(date, professionalId);
```

### useForm
Manejo de formularios con validación:
```typescript
const form = useForm({
  initialValues: { email: '', password: '' },
  validationRules: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 6 }
  },
  onSubmit: async (values) => {
    await login(values);
  }
});
```

## 📱 Páginas (`/pages`)

### Páginas Implementadas
- **LoginPage**: Autenticación de usuarios con recuperación de contraseña
- **ProfilePage**: Perfil de usuario con cambio de contraseña
- **DashboardPage**: Panel principal con estadísticas
- **PatientsPage**: Gestión completa de pacientes con CRUD, búsqueda y filtros
- **AppointmentsPage**: Calendario completo de turnos con vistas múltiples
- **ProfessionalsPage**: Gestión de profesionales (solo admin)
- **TreatmentTypesPage**: Tipos de tratamiento (solo admin)
- **NotificationsPage**: Monitoreo de notificaciones
- **SettingsPage**: Configuración del sistema (solo admin)

## 🎨 Estilos y Temas

### Sistema de Diseño
- **Tailwind CSS**: Framework de utilidades CSS
- **Colores**: Paleta consistente con variables CSS
- **Tipografía**: Inter font con diferentes pesos
- **Espaciado**: Sistema de espaciado consistente
- **Sombras**: Niveles de elevación definidos

### Clases Personalizadas
```css
/* Botones */
.btn, .btn-primary, .btn-secondary, etc.

/* Inputs */
.input, .input-error, .input-success

/* Cards */
.card, .card-header, .card-body, .card-footer

/* Badges */
.badge, .badge-primary, .badge-success, etc.

/* Alerts */
.alert, .alert-success, .alert-error, etc.
```

## 🔧 Configuración

### React Query
- Cache configurado para 5 minutos
- Reintentos automáticos
- DevTools habilitadas en desarrollo

### React Router
- Rutas protegidas por autenticación
- Guards por roles (admin/secretaria)
- Redirecciones automáticas

### Notificaciones
- React Hot Toast configurado
- Estilos personalizados
- Duración por tipo de mensaje

## 🚀 Características Implementadas

### ✅ Completado
- [x] Componentes UI base reutilizables
- [x] Sistema de routing con guards
- [x] Contexto de autenticación global
- [x] Layout responsivo con navegación
- [x] Manejo de errores y estados de carga
- [x] React Query configurado
- [x] Páginas base implementadas
- [x] Hooks personalizados
- [x] Sistema de permisos
- [x] Herramientas de desarrollo
- [x] Módulo de autenticación completo
- [x] Auto-logout por inactividad
- [x] Recuperación de contraseña
- [x] Cambio de contraseña
- [x] Gestión de perfil de usuario
- [x] Tests básicos de autenticación
- [x] Interfaz completa de gestión de pacientes
- [x] Formulario de pacientes con validación avanzada
- [x] Búsqueda en tiempo real con debounce
- [x] Lista de pacientes con paginación y ordenamiento
- [x] Modal de confirmación para eliminación
- [x] Vista de historial de turnos por paciente
- [x] Hooks personalizados para gestión de pacientes
- [x] Calendario completo de turnos con múltiples vistas
- [x] Vista mensual con turnos agrupados por día
- [x] Vista semanal con slots de tiempo detallados
- [x] Vista diaria con información completa de turnos
- [x] Formulario de turnos con validación de disponibilidad
- [x] Navegación intuitiva del calendario
- [x] Filtros por estado y profesional
- [x] Indicadores visuales de estado de turnos
- [x] Integración con búsqueda de pacientes
- [x] Hooks especializados para gestión de turnos

### 🔄 Próximos Pasos
- [ ] Implementar funcionalidad completa de páginas
- [ ] Conectar con APIs del backend
- [ ] Agregar validaciones de formularios
- [ ] Implementar calendario de turnos
- [ ] Agregar tests unitarios
- [ ] Optimizar performance

## 📝 Notas de Desarrollo

### Convenciones
- Componentes en PascalCase
- Hooks con prefijo `use`
- Archivos de tipos en `/types`
- Servicios de API en `/services`

### Estructura de Archivos
```
src/
├── components/
│   ├── Auth/
│   ├── Layout/
│   └── UI/
├── pages/
├── hooks/
├── contexts/
├── services/
├── types/
├── styles/
└── utils/
```

### Performance
- Lazy loading de componentes pesados
- Memoización con React.memo
- Code splitting por rutas
- Optimización de imágenes

Este sistema de componentes proporciona una base sólida y escalable para el desarrollo del frontend del sistema de turnos odontológicos.