import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentConfirmationModal from '../AppointmentConfirmationModal';
import { Appointment } from '../../../types';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-12-20';
    if (formatStr === 'dd/MM/yyyy HH:mm') return '20/12/2024 09:00';
    return date.toString();
  }),
  es: {},
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

describe('AppointmentConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    appointment: mockAppointment,
    action: 'cancel' as const,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cancel confirmation modal correctly', () => {
    render(<AppointmentConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Cancelar Turno')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de que quieres cancelar este turno?')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('20/12/2024 09:00')).toBeInTheDocument();
  });

  it('renders delete confirmation modal correctly', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="delete"
      />
    );

    expect(screen.getByText('Eliminar Turno')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de que quieres eliminar este turno permanentemente?')).toBeInTheDocument();
    expect(screen.getByText('Eliminar Permanentemente')).toBeInTheDocument();
  });

  it('renders confirm appointment modal correctly', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="confirm"
      />
    );

    expect(screen.getByText('Confirmar Turno')).toBeInTheDocument();
    expect(screen.getByText('¿Confirmar este turno?')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Turno')).toBeInTheDocument();
  });

  it('renders complete appointment modal correctly', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="complete"
      />
    );

    expect(screen.getByText('Completar Turno')).toBeInTheDocument();
    expect(screen.getByText('¿Marcar este turno como completado?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: Tratamiento completado satisfactoriamente/)).toBeInTheDocument();
  });

  it('renders no-show modal correctly', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="no-show"
      />
    );

    expect(screen.getByText('Marcar como No Se Presentó')).toBeInTheDocument();
    expect(screen.getByText('¿Marcar que el paciente no se presentó?')).toBeInTheDocument();
  });

  it('shows appointment details correctly', () => {
    render(<AppointmentConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Detalles del Turno')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('20/12/2024 09:00')).toBeInTheDocument();
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument();
    expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Programado')).toBeInTheDocument();
  });

  it('shows reason input for cancel action', () => {
    render(<AppointmentConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Motivo de cancelación (opcional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: Reagendado por el paciente/)).toBeInTheDocument();
  });

  it('shows observations input for complete action', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="complete"
      />
    );

    expect(screen.getByText('Observaciones del tratamiento (opcional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: Tratamiento completado satisfactoriamente/)).toBeInTheDocument();
  });

  it('shows notification toggle for actions that support it', () => {
    render(<AppointmentConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Notificar al paciente')).toBeInTheDocument();
    expect(screen.getByText('Se enviará un mensaje por WhatsApp al paciente')).toBeInTheDocument();
    
    // Should have a toggle switch
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
  });

  it('does not show notification toggle for delete action', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="delete"
      />
    );

    expect(screen.queryByText('Notificar al paciente')).not.toBeInTheDocument();
  });

  it('handles reason input changes', async () => {
    const user = userEvent.setup();
    render(<AppointmentConfirmationModal {...defaultProps} />);

    const reasonInput = screen.getByPlaceholderText(/Ej: Reagendado por el paciente/);
    await user.type(reasonInput, 'Emergencia médica');

    expect(reasonInput).toHaveValue('Emergencia médica');
  });

  it('handles observations input changes', async () => {
    const user = userEvent.setup();
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="complete"
      />
    );

    const observationsInput = screen.getByPlaceholderText(/Ej: Tratamiento completado satisfactoriamente/);
    await user.type(observationsInput, 'Tratamiento exitoso');

    expect(observationsInput).toHaveValue('Tratamiento exitoso');
  });

  it('handles notification toggle changes', async () => {
    const user = userEvent.setup();
    render(<AppointmentConfirmationModal {...defaultProps} />);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('calls onConfirm with correct data when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = jest.fn();
    
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        onConfirm={mockOnConfirm}
      />
    );

    // Add reason
    const reasonInput = screen.getByPlaceholderText(/Ej: Reagendado por el paciente/);
    await user.type(reasonInput, 'Test reason');

    // Click confirm
    const confirmButton = screen.getByText('Cancelar Turno');
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith({
      reason: 'Test reason',
      sendNotification: true,
    });
  });

  it('calls onConfirm with observations for complete action', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = jest.fn();
    
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        action="complete"
        onConfirm={mockOnConfirm}
      />
    );

    // Add observations
    const observationsInput = screen.getByPlaceholderText(/Ej: Tratamiento completado satisfactoriamente/);
    await user.type(observationsInput, 'Test observations');

    // Click confirm
    const confirmButton = screen.getByText('Completar Turno');
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith({
      observations: 'Test observations',
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        loading={true}
      />
    );

    const confirmButton = screen.getByText('Cancelar Turno');
    expect(confirmButton).toBeDisabled();

    const cancelButton = screen.getByText('Cancelar');
    expect(cancelButton).toBeDisabled();
  });

  it('shows warning for past appointments', () => {
    // Mock past date
    const pastAppointment = {
      ...mockAppointment,
      startTime: '2023-12-20T09:00:00',
    };

    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        appointment={pastAppointment}
      />
    );

    expect(screen.getByText('Turno vencido')).toBeInTheDocument();
    expect(screen.getByText(/Este turno corresponde a una fecha pasada/)).toBeInTheDocument();
  });

  it('shows today badge for today appointments', () => {
    // Mock today's date
    const todayAppointment = {
      ...mockAppointment,
      startTime: new Date().toISOString(),
    };

    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        appointment={todayAppointment}
      />
    );

    expect(screen.getByText('Hoy')).toBeInTheDocument();
  });

  it('resets form when modal closes and reopens', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AppointmentConfirmationModal {...defaultProps} />);

    // Add reason
    const reasonInput = screen.getByPlaceholderText(/Ej: Reagendado por el paciente/);
    await user.type(reasonInput, 'Test reason');

    // Close modal
    rerender(<AppointmentConfirmationModal {...defaultProps} isOpen={false} />);

    // Reopen modal
    rerender(<AppointmentConfirmationModal {...defaultProps} isOpen={true} />);

    // Reason should be cleared
    const newReasonInput = screen.getByPlaceholderText(/Ej: Reagendado por el paciente/);
    expect(newReasonInput).toHaveValue('');
  });

  it('does not call onConfirm when appointment is null', () => {
    const mockOnConfirm = jest.fn();
    
    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        appointment={null}
        onConfirm={mockOnConfirm}
      />
    );

    // Modal should not render when appointment is null
    expect(screen.queryByText('Cancelar Turno')).not.toBeInTheDocument();
  });

  it('shows correct status badge colors', () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: 'CONFIRMED' as const,
    };

    render(
      <AppointmentConfirmationModal 
        {...defaultProps} 
        appointment={confirmedAppointment}
      />
    );

    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });
});