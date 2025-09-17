import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import PatientForm from '../PatientForm';
import { Patient } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/usePatients', () => ({
  useCreatePatient: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockPatient }),
    isLoading: false,
  }),
  useUpdatePatient: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockPatient }),
    isLoading: false,
  }),
  useCheckPatientDuplicate: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      data: { documentExists: false, phoneExists: false } 
    }),
    isLoading: false,
  }),
}));

const mockPatient: Patient = {
  id: '1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  phone: '+54 11 1234-5678',
  document: '12345678',
  dateOfBirth: '1990-01-01',
  address: 'Calle Falsa 123',
  notes: 'Paciente regular',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('PatientForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no patient is provided', () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Nuevo Paciente')).toBeInTheDocument();
    expect(screen.getByText('Crear Paciente')).toBeInTheDocument();
  });

  it('renders edit form when patient is provided', () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} patient={mockPatient} />
      </TestWrapper>
    );

    expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
    expect(screen.getByText('Actualizar Paciente')).toBeInTheDocument();
  });

  it('populates form fields when editing a patient', () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} patient={mockPatient} />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+54 11 1234-5678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Crear Paciente');
    
    // Try to submit without filling required fields
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    const phoneInput = screen.getByLabelText('Teléfono');
    
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText(/Formato de teléfono inválido/)).toBeInTheDocument();
    });
  });

  it('validates document length', async () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    const documentInput = screen.getByLabelText('Documento');
    
    fireEvent.change(documentInput, { target: { value: '123' } });
    fireEvent.blur(documentInput);

    await waitFor(() => {
      expect(screen.getByText('El documento debe tener al menos 7 caracteres')).toBeInTheDocument();
    });
  });

  it('validates birth date is not in the future', async () => {
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} />
      </TestWrapper>
    );

    const birthDateInput = screen.getByLabelText('Fecha de Nacimiento');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    fireEvent.change(birthDateInput, { 
      target: { value: futureDate.toISOString().split('T')[0] } 
    });
    fireEvent.blur(birthDateInput);

    await waitFor(() => {
      expect(screen.getByText('La fecha de nacimiento no puede ser futura')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    
    render(
      <TestWrapper>
        <PatientForm {...defaultProps} onClose={onClose} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});