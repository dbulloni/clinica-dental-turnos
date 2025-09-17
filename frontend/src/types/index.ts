// Tipos de usuario y autenticación
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SECRETARY';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Tipos de pacientes
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  document: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  document: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
}

// Tipos de profesionales
export interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  license?: string;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfessionalData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  license?: string;
  specialties: string[];
}

// Tipos de tratamientos
export interface TreatmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
  isActive: boolean;
  professionalId: string;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    specialties: string[];
  };
}

export interface CreateTreatmentTypeData {
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
  professionalId: string;
}

// Tipos de turnos
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  professional: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentType: {
    id: string;
    name: string;
    duration: number;
    color?: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateAppointmentData {
  startTime: string;
  endTime: string;
  patientId: string;
  professionalId: string;
  treatmentTypeId: string;
  notes?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

// Tipos de notificaciones
export type NotificationType = 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'MODIFICATION' | 'CUSTOM';
export type NotificationChannel = 'WHATSAPP' | 'EMAIL' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  appointment?: {
    id: string;
    startTime: string;
    status: AppointmentStatus;
  };
}

// Tipos de horarios de trabajo
export interface WorkingHour {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  professionalId: string;
}

export interface CreateWorkingHourData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

// Tipos de bloqueos de horario
export interface ScheduleBlock {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  professionalId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleBlockData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

// Tipos de configuración
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

// Tipos de estadísticas
export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalPatients: number;
  activePatients: number;
  totalProfessionals: number;
  activeProfessionals: number;
  appointmentStats: {
    total: number;
    scheduled: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    noShow: number;
  };
  notificationStats: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// Tipos de paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Tipos de respuesta de API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
  code?: string;
}

// Tipos de filtros
export interface PatientFilters {
  search?: string;
  isActive?: boolean;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  treatmentTypeId?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  createdBy?: string;
  hasNotes?: string;
  notificationStatus?: string;
}

export interface ProfessionalFilters {
  search?: string;
  isActive?: boolean;
  specialty?: string;
}

export interface TreatmentTypeFilters {
  search?: string;
  isActive?: boolean;
  professionalId?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  channel?: NotificationChannel;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

// Tipos de formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'select' | 'date' | 'time' | 'datetime-local' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Tipos de componentes UI
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

// Tipos de calendario
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  resource?: any;
}

// Tipos de estado de la aplicación
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

// Tipos de errores
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Tipos de hooks personalizados
export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface UseMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  onSettled?: () => void;
}

// Tipos de utilidades
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

// Constantes de la aplicación
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'Programado',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
  NO_SHOW: 'No se presentó',
} as const;

export const NOTIFICATION_TYPES = {
  CONFIRMATION: 'Confirmación',
  REMINDER: 'Recordatorio',
  CANCELLATION: 'Cancelación',
  MODIFICATION: 'Modificación',
  CUSTOM: 'Personalizado',
} as const;

export const NOTIFICATION_CHANNELS = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  SMS: 'SMS',
} as const;

export const NOTIFICATION_STATUSES = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
  READ: 'Leído',
} as const;

export const USER_ROLES = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretaria',
} as const;

export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;