import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import AppointmentForm from '../AppointmentForm';
import { Appointment, Professional, TreatmentType } from '../../../types';

// Mock hooks
jest.mock('../../../hooks/useAppointments', () => ({
  useCreateAppointment: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockAppointment }),
    isLoading: false,
  }),
  useUpdateAppointment: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockAppointment }),
    isLoading: false,
  }),
  useAvailableSlots: () => ({
    data: { data: [{ startTime: '09:00', endTime: '09:30' }] },
    isLoading: false,
  }),
  useCheckSlotAvailability: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      data: { available: true, conflicts: [] } 
    }),
  }),
}));

jest.mock('../../../hooks/usePatients', () => ({
  usePatientSearch: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

jest.mock('../../../hooks/useForm', () => ({
  useForm: ({ initialValues, onSubmit }: any) => ({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn((e) => {
      e.preventDefault();
      onSubmit(initialValues);
    }),
    setFieldValue: jest.fn(),
    setFieldError: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

// Mock data
const mockProfessionals: Professional[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    phone: '123456789',
    license: 'LIC123',
    specialties: ['Odontología General'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockTreatmentTypes: TreatmentType[] = [
  {
    id: '1',
    name: 'Limpieza Dental',
    description: 'Limpieza dental básica',
    duration: 30,
    price: 50,
    color: '#blue',
    isActive: true,
    professionalId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockAppointment: Appointment = {
  id: '1',
  startTime: '2024-12-20T09:00:00',
  endTime: '2024-12-20T09:30:00',
  status: 'SCHEDULED',
  notes: 'Test appointment',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  patient: {
    id: '1',
    firstName: 'María',
    lastName: 'García',
    phone: '987654321',
    email: 'maria@test.com',
  },
  professional: {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
  },
  treatmentType: {
    id: '1',
    name: 'Limpieza Dental',
    duration: 30,
    color: '#blue',
  },
  createdBy: {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
  },
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AppointmentForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    professionals: mockProfessionals,
    treatmentTypes: mockTreatmentTypes,
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create appointment form correctly', () => {
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    expect(screen.getByText('Nuevo Turno')).toBeInTheDocument();
    expect(screen.getByText('Paciente')).toBeInTheDocument();
    expect(screen.getByText('Detalles del Turno')).toBeInTheDocument();
    expect(screen.getByText('Observaciones')).toBeInTheDocument();
  });

  it('renders edit appointment form correctly', () => {
    renderWithQueryClient(
      <AppointmentForm {...defaultProps} appointment={mockAppointment} />
    );

    expect(screen.getByText('Editar Turno')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('shows professional selection dropdown', () => {
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    const professionalSelect = screen.getByDisplayValue('Seleccionar profesional');
    expect(professionalSelect).toBeInTheDocument();
    
    fireEvent.click(professionalSelect);
    expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
  });

  it('shows treatment type selection dropdown', () => {
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    const treatmentSelect = screen.getByDisplayValue('Seleccionar tratamiento');
    expect(treatmentSelect).toBeInTheDocument();
  });

  it('displays available time slots when date and professional are selected', async () => {
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    // Should show available slots info when conditions are met
    await waitFor(() => {
      expect(screen.getByText(/Horarios disponibles/)).toBeInTheDocument();
    });
  });

  it('shows conflict warning when there are scheduling conflicts', async () => {
    // Mock conflict response
    const mockUseCheckSlotAvailability = require('../../../hooks/useAppointments').useCheckSlotAvailability;
    mockUseCheckSlotAvailability.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        success: true,
        data: { 
          available: false, 
          conflicts: [{ id: '2', startTime: '09:00' }] 
        }
      }),
    });

    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Conflicto de horario detectado/)).toBeInTheDocument();
    });
  });

  it('calculates end time automatically based on treatment duration', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    // Select treatment type
    const treatmentSelect = screen.getByDisplayValue('Seleccionar tratamiento');
    await user.selectOptions(treatmentSelect, '1');

    // Select start time
    const startTimeInput = screen.getByDisplayValue('');
    await user.type(startTimeInput, '09:00');

    // End time should be calculated automatically (09:30 for 30-minute treatment)
    await waitFor(() => {
      const endTimeInput = screen.getByDisplayValue('09:30');
      expect(endTimeInput).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    const submitButton = screen.getByText('Crear Turno');
    
    // Submit button should be disabled when required fields are empty
    expect(submitButton).toBeDisabled();
  });

  it('submits form with correct data for new appointment', async () => {
    const mockOnSuccess = jest.fn();
    const mockCreateAppointment = require('../../../hooks/useAppointments').useCreateAppointment;
    
    renderWithQueryClient(
      <AppointmentForm {...defaultProps} onSuccess={mockOnSuccess} />
    );

    // Form should call create mutation when submitted
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateAppointment().mutateAsync).toHaveBeenCalled();
    });
  });

  it('submits form with correct data for appointment update', async () => {
    const mockOnSuccess = jest.fn();
    const mockUpdateAppointment = require('../../../hooks/useAppointments').useUpdateAppointment;
    
    renderWithQueryClient(
      <AppointmentForm 
        {...defaultProps} 
        appointment={mockAppointment}
        onSuccess={mockOnSuccess} 
      />
    );

    // Form should call update mutation when submitted
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUpdateAppointment().mutateAsync).toHaveBeenCalled();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    renderWithQueryClient(
      <AppointmentForm {...defaultProps} onClose={mockOnClose} />
    );

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during form submission', () => {
    const mockCreateAppointment = require('../../../hooks/useAppointments').useCreateAppointment;
    mockCreateAppointment.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: true,
    });

    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    const submitButton = screen.getByText('Crear Turno');
    expect(submitButton).toBeDisabled();
  });

  it('handles patient selection correctly', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    // Should show patient search initially
    expect(screen.getByPlaceholderText(/Buscar y seleccionar paciente/)).toBeInTheDocument();
  });

  it('validates date is not in the past', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentForm {...defaultProps} />);

    const dateInput = screen.getByLabelText('Fecha');
    
    // Try to set a past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];
    
    await user.type(dateInput, pastDate);

    await waitFor(() => {
      expect(screen.getByText(/No se pueden crear turnos en fechas pasadas/)).toBeInTheDocument();
    });
  });
});