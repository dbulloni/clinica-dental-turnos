import { 
  User, 
  Patient, 
  Professional, 
  TreatmentType, 
  WorkingHour, 
  ScheduleBlock, 
  Appointment, 
  Notification, 
  SystemConfig,
  UserRole,
  AppointmentStatus,
  NotificationStatus,
  NotificationType,
  NotificationChannel
} from '@prisma/client';

// Exportar tipos de Prisma
export {
  User,
  Patient,
  Professional,
  TreatmentType,
  WorkingHour,
  ScheduleBlock,
  Appointment,
  Notification,
  SystemConfig,
  UserRole,
  AppointmentStatus,
  NotificationStatus,
  NotificationType,
  NotificationChannel,
};

// Tipos extendidos con relaciones
export type UserWithRelations = User & {
  createdAppointments?: Appointment[];
  updatedAppointments?: Appointment[];
};

export type PatientWithRelations = Patient & {
  appointments?: AppointmentWithRelations[];
  notifications?: Notification[];
};

export type ProfessionalWithRelations = Professional & {
  appointments?: AppointmentWithRelations[];
  workingHours?: WorkingHour[];
  scheduleBlocks?: ScheduleBlock[];
  treatmentTypes?: TreatmentType[];
};

export type TreatmentTypeWithRelations = TreatmentType & {
  professional?: Professional;
  appointments?: Appointment[];
};

export type AppointmentWithRelations = Appointment & {
  patient?: Patient;
  professional?: Professional;
  treatmentType?: TreatmentType;
  createdBy?: User;
  updatedBy?: User;
  notifications?: Notification[];
};

export type NotificationWithRelations = Notification & {
  patient?: Patient;
  appointment?: AppointmentWithRelations;
};

// Tipos para DTOs (Data Transfer Objects)
export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDTO = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreatePatientDTO = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientDTO = Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateProfessionalDTO = Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProfessionalDTO = Partial<Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateTreatmentTypeDTO = Omit<TreatmentType, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTreatmentTypeDTO = Partial<Omit<TreatmentType, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateAppointmentDTO = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointmentDTO = Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateNotificationDTO = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNotificationDTO = Partial<Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>>;

// Tipos para filtros y consultas
export interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  professionalId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  treatmentTypeId?: string;
}

export interface PatientFilters {
  search?: string; // Búsqueda por nombre, documento o teléfono
  isActive?: boolean;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  channel?: NotificationChannel;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Tipos para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para estadísticas
export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
}

export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalPatients: number;
  activePatients: number;
  appointmentStats: AppointmentStats;
  notificationStats: {
    pending: number;
    sent: number;
    failed: number;
  };
}