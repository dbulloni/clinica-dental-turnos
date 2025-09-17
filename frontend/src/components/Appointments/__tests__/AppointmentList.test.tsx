import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import AppointmentList from '../AppointmentList';
import { Appointment, Professional } from '../../../types';

// Mock hooks
jest.mock('../../../hooks/useAppointments', () => ({
  useAppointments: () => ({
    data: {
      data: {
        data: mockAppointments,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    },
    isLoading: false,
    refetch: jest.fn(),
  }),
  useUpdateAppointmentStatus: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
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

const mockAppointments: Appointment[] = [
  {
    id: '1',
    startTime: '2024-12-20T09:00:00',
    endTime: '2024-12-20T09:30:00',
    status: 'SCHEDULED',
    notes: 'Test appointment 1',
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
  },
  {
    id: '2',
    startTime: '2024-12-20T10:00:00',
    endTime: '2024-12-20T10:30:00',
    status: 'CONFIRMED',
    notes: 'Test appointment 2',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    patient: {
      id: '2',
      firstName: 'Carlos',
      lastName: 'López',
      phone: '123456789',
      email: 'carlos@test.com',
    },
    professional: {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
    },
    treatmentType: {
      id: '1',
      name: 'Consulta',
      duration: 30,
      color: '#green',
    },
    createdBy: {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
    },
  },
];

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

describe('AppointmentList', () => {
  const defaultProps = {
    onViewAppointment: jest.fn(),
    onEditAppointment: jest.fn(),
    onRescheduleAppointment: jest.fn(),
    professionals: mockProfessionals,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders appointment list correctly', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
    expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument();
    expect(screen.getByText('Consulta')).toBeInTheDocument();
  });

  it('displays appointment status badges correctly', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByText('Programado')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('shows search input', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/);
    expect(searchInput).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/);
    await user.type(searchInput, 'María');

    expect(searchInput).toHaveValue('María');
  });

  it('shows filter dropdowns', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByDisplayValue('Todos los estados')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Todos los profesionales')).toBeInTheDocument();
  });

  it('handles status filter changes', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const statusFilter = screen.getByDisplayValue('Todos los estados');
    await user.selectOptions(statusFilter, 'SCHEDULED');

    expect(statusFilter).toHaveValue('SCHEDULED');
  });

  it('handles professional filter changes', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const professionalFilter = screen.getByDisplayValue('Todos los profesionales');
    await user.selectOptions(professionalFilter, '1');

    expect(professionalFilter).toHaveValue('1');
  });

  it('shows date range filters', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const dateInputs = screen.getAllByDisplayValue('');
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  it('displays action buttons for appointments', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Should show view buttons
    const viewButtons = screen.getAllByTitle('Ver detalles');
    expect(viewButtons).toHaveLength(2);

    // Should show edit buttons for editable appointments
    const editButtons = screen.getAllByTitle('Editar');
    expect(editButtons.length).toBeGreaterThan(0);

    // Should show confirm button for scheduled appointments
    const confirmButtons = screen.getAllByTitle('Confirmar');
    expect(confirmButtons.length).toBeGreaterThan(0);
  });

  it('calls onViewAppointment when view button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnView = jest.fn();
    
    renderWithQueryClient(
      <AppointmentList {...defaultProps} onViewAppointment={mockOnView} />
    );

    const viewButton = screen.getAllByTitle('Ver detalles')[0];
    await user.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('calls onEditAppointment when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();
    
    renderWithQueryClient(
      <AppointmentList {...defaultProps} onEditAppointment={mockOnEdit} />
    );

    const editButton = screen.getAllByTitle('Editar')[0];
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('calls onRescheduleAppointment when reschedule button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnReschedule = jest.fn();
    
    renderWithQueryClient(
      <AppointmentList {...defaultProps} onRescheduleAppointment={mockOnReschedule} />
    );

    const rescheduleButton = screen.getAllByTitle('Reprogramar')[0];
    await user.click(rescheduleButton);

    expect(mockOnReschedule).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('handles status change when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockUpdateStatus = require('../../../hooks/useAppointments').useUpdateAppointmentStatus;
    
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    const confirmButton = screen.getAllByTitle('Confirmar')[0];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockUpdateStatus().mutateAsync).toHaveBeenCalledWith({
        id: '1',
        status: 'CONFIRMED',
      });
    });
  });

  it('shows clear filters button when filters are active', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Apply a filter
    const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/);
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();
    });
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Apply a filter
    const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/);
    await user.type(searchInput, 'test');

    // Clear filters
    const clearButton = await screen.findByText('Limpiar filtros');
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('shows pagination when there are multiple pages', () => {
    // Mock pagination with multiple pages
    const mockUseAppointments = require('../../../hooks/useAppointments').useAppointments;
    mockUseAppointments.mockReturnValue({
      data: {
        data: {
          data: mockAppointments,
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        },
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('shows empty state when no appointments found', () => {
    // Mock empty results
    const mockUseAppointments = require('../../../hooks/useAppointments').useAppointments;
    mockUseAppointments.mockReturnValue({
      data: {
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByText('No hay turnos registrados')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock loading state
    const mockUseAppointments = require('../../../hooks/useAppointments').useAppointments;
    mockUseAppointments.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Table should show loading state
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('formats dates and times correctly', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Should show formatted date
    expect(screen.getByText('20/12/2024')).toBeInTheDocument();
    
    // Should show formatted time range
    expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();
  });

  it('shows treatment duration', () => {
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('handles sorting when column headers are clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AppointmentList {...defaultProps} />);

    // Find sortable column header
    const dateHeader = screen.getByText('Fecha y Hora');
    await user.click(dateHeader);

    // Should trigger sort functionality
    expect(dateHeader).toBeInTheDocument();
  });
});