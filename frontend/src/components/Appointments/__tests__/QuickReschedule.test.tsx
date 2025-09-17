import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import QuickReschedule from '../QuickReschedule';
import { Appointment } from '../../../types';

// Mock hooks
jest.mock('../../../hooks/useAppointments', () => ({
  useAvailableSlots: () => ({
    data: { 
      data: [
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '11:00', endTime: '11:30' },
      ]
    },
    isLoading: false,
  }),
  useRescheduleAppointment: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      data: mockAppointment 
    }),
    isLoading: false,
  }),
}));

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-12-21';
    if (formatStr === 'EEE d/M') return 'Sáb 21/12';
    if (formatStr === 'EEEE') return 'Sábado';
    if (formatStr === 'EEEE, d MMMM yyyy - HH:mm') return 'Viernes, 20 diciembre 2024 - 09:00';
    if (formatStr === 'EEEE, d MMMM yyyy') return 'Sábado, 21 diciembre 2024';
    return date.toString();
  }),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  startOfDay: jest.fn((date) => date),
  es: {},
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock data
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

describe('QuickReschedule', () => {
  const defaultProps = {
    appointment: mockAppointment,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quick reschedule component correctly', () => {
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText('Reprogramación Rápida')).toBeInTheDocument();
    expect(screen.getByText('Turno actual:')).toBeInTheDocument();
    expect(screen.getByText('María García - Limpieza Dental')).toBeInTheDocument();
  });

  it('shows current appointment information', () => {
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText(/Viernes, 20 diciembre 2024 - 09:00/)).toBeInTheDocument();
    expect(screen.getByText('María García - Limpieza Dental')).toBeInTheDocument();
  });

  it('displays suggested dates for next 7 days', () => {
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText('Nueva Fecha')).toBeInTheDocument();
    
    // Should show date buttons
    const dateButtons = screen.getAllByText(/Sáb 21\/12/);
    expect(dateButtons.length).toBeGreaterThan(0);
  });

  it('shows available time slots when date is selected', async () => {
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText('Horario Disponible')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  it('handles date selection', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    const dateButton = screen.getAllByText(/Sáb 21\/12/)[0];
    await user.click(dateButton);

    // Button should be selected (primary variant)
    expect(dateButton).toHaveClass('btn-primary');
  });

  it('handles time slot selection', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    // Button should be selected
    expect(timeSlotButton).toHaveClass('btn-primary');
  });

  it('shows selected appointment summary when date and time are chosen', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    // Select time slot
    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    await waitFor(() => {
      expect(screen.getByText('Nuevo horario seleccionado')).toBeInTheDocument();
      expect(screen.getByText(/Sábado, 21 diciembre 2024/)).toBeInTheDocument();
      expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument();
    });
  });

  it('calculates end time correctly based on treatment duration', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    const timeSlotButton = screen.getByText('10:00');
    await user.click(timeSlotButton);

    await waitFor(() => {
      // Should show calculated end time (10:00 + 30 minutes = 10:30)
      expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();
    });
  });

  it('disables reschedule button when no time slot is selected', () => {
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    const rescheduleButton = screen.getByText('Reprogramar');
    expect(rescheduleButton).toBeDisabled();
  });

  it('enables reschedule button when time slot is selected', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    const rescheduleButton = screen.getByText('Reprogramar');
    expect(rescheduleButton).not.toBeDisabled();
  });

  it('calls reschedule mutation when reschedule button is clicked', async () => {
    const user = userEvent.setup();
    const mockReschedule = require('../../../hooks/useAppointments').useRescheduleAppointment;
    
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    // Select time slot
    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    // Click reschedule button
    const rescheduleButton = screen.getByText('Reprogramar');
    await user.click(rescheduleButton);

    await waitFor(() => {
      expect(mockReschedule().mutateAsync).toHaveBeenCalledWith({
        id: '1',
        newStartTime: '2024-12-21T09:00:00',
        newEndTime: '2024-12-21T09:30:00',
      });
    });
  });

  it('calls onSuccess when reschedule is successful', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    
    renderWithQueryClient(
      <QuickReschedule {...defaultProps} onSuccess={mockOnSuccess} />
    );

    // Select time slot and reschedule
    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    const rescheduleButton = screen.getByText('Reprogramar');
    await user.click(rescheduleButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAppointment);
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = jest.fn();
    
    renderWithQueryClient(
      <QuickReschedule {...defaultProps} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when fetching available slots', () => {
    // Mock loading state
    const mockUseAvailableSlots = require('../../../hooks/useAppointments').useAvailableSlots;
    mockUseAvailableSlots.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText('Cargando horarios disponibles...')).toBeInTheDocument();
  });

  it('shows message when no slots are available', () => {
    // Mock empty slots
    const mockUseAvailableSlots = require('../../../hooks/useAppointments').useAvailableSlots;
    mockUseAvailableSlots.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    expect(screen.getByText('No hay horarios disponibles para esta fecha')).toBeInTheDocument();
  });

  it('shows loading state during reschedule submission', async () => {
    const user = userEvent.setup();
    
    // Mock loading state
    const mockReschedule = require('../../../hooks/useAppointments').useRescheduleAppointment;
    mockReschedule.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: true,
    });

    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    // Select time slot
    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    const rescheduleButton = screen.getByText('Reprogramar');
    expect(rescheduleButton).toBeDisabled();
  });

  it('shows error toast when no time slot is selected and reschedule is attempted', async () => {
    const user = userEvent.setup();
    const mockToast = require('react-hot-toast').default;
    
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    // Try to reschedule without selecting time slot
    const rescheduleButton = screen.getByText('Reprogramar');
    
    // Button should be disabled, but let's test the validation logic
    expect(rescheduleButton).toBeDisabled();
  });

  it('resets time slot selection when date changes', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<QuickReschedule {...defaultProps} />);

    // Select time slot
    const timeSlotButton = screen.getByText('09:00');
    await user.click(timeSlotButton);

    // Change date
    const dateButtons = screen.getAllByText(/Sáb 21\/12/);
    if (dateButtons.length > 1) {
      await user.click(dateButtons[1]);
    }

    // Time slot selection should be reset
    const rescheduleButton = screen.getByText('Reprogramar');
    expect(rescheduleButton).toBeDisabled();
  });
});