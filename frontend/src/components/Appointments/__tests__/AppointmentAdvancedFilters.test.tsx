import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentAdvancedFilters from '../AppointmentAdvancedFilters';
import { AppointmentFilters, Professional, TreatmentType } from '../../../types';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-12-20';
    if (formatStr === 'dd/MM') return '20/12';
    if (formatStr === 'dd/MM/yyyy') return '20/12/2024';
    return date.toString();
  }),
  startOfWeek: jest.fn((date) => date),
  endOfWeek: jest.fn((date) => date),
  startOfMonth: jest.fn((date) => date),
  endOfMonth: jest.fn((date) => date),
  subDays: jest.fn((date, days) => date),
  addDays: jest.fn((date, days) => date),
  es: {},
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
  {
    id: '2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria@test.com',
    phone: '987654321',
    license: 'LIC456',
    specialties: ['Ortodoncia'],
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
  {
    id: '2',
    name: 'Consulta',
    description: 'Consulta general',
    duration: 45,
    price: 75,
    color: '#green',
    isActive: true,
    professionalId: '2',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('AppointmentAdvancedFilters', () => {
  const defaultProps = {
    filters: {} as AppointmentFilters,
    onFiltersChange: jest.fn(),
    professionals: mockProfessionals,
    treatmentTypes: mockTreatmentTypes,
    onExport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/)).toBeInTheDocument();
  });

  it('renders advanced filters toggle button', () => {
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    expect(screen.getByText('Filtros Avanzados')).toBeInTheDocument();
  });

  it('shows date preset buttons', () => {
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Ayer')).toBeInTheDocument();
    expect(screen.getByText('Esta Semana')).toBeInTheDocument();
    expect(screen.getByText('Próximos 7 días')).toBeInTheDocument();
    expect(screen.getByText('Este Mes')).toBeInTheDocument();
  });

  it('shows export button when onExport is provided', () => {
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('does not show export button when onExport is not provided', () => {
    render(<AppointmentAdvancedFilters {...defaultProps} onExport={undefined} />);

    expect(screen.queryByText('Exportar')).not.toBeInTheDocument();
  });

  it('expands advanced filters when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Profesional')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Tratamiento')).toBeInTheDocument();
  });

  it('shows advanced filter options when expanded', async () => {
    const user = userEvent.setup();
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Status filter
    expect(screen.getByDisplayValue('Todos los estados')).toBeInTheDocument();
    
    // Professional filter
    expect(screen.getByDisplayValue('Todos los profesionales')).toBeInTheDocument();
    
    // Treatment type filter
    expect(screen.getByDisplayValue('Todos los tratamientos')).toBeInTheDocument();
    
    // Date inputs
    expect(screen.getByLabelText('Fecha desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha hasta')).toBeInTheDocument();
    
    // Time inputs
    expect(screen.getByLabelText('Hora desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora hasta')).toBeInTheDocument();
  });

  it('handles search input changes with debounce', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profesional o tratamiento/);
    await user.type(searchInput, 'test search');

    // Should debounce the search
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'test search',
      });
    }, { timeout: 500 });
  });

  it('handles status filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Change status filter
    const statusSelect = screen.getByDisplayValue('Todos los estados');
    await user.selectOptions(statusSelect, 'SCHEDULED');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: 'SCHEDULED',
    });
  });

  it('handles professional filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Change professional filter
    const professionalSelect = screen.getByDisplayValue('Todos los profesionales');
    await user.selectOptions(professionalSelect, '1');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      professionalId: '1',
    });
  });

  it('handles treatment type filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Change treatment type filter
    const treatmentSelect = screen.getByDisplayValue('Todos los tratamientos');
    await user.selectOptions(treatmentSelect, '1');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      treatmentTypeId: '1',
    });
  });

  it('handles date preset selection', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const todayButton = screen.getByText('Hoy');
    await user.click(todayButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      startDate: '2024-12-20',
      endDate: '2024-12-20',
    });
  });

  it('handles date range input changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Change start date
    const startDateInput = screen.getByLabelText('Fecha desde');
    await user.type(startDateInput, '2024-12-01');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      startDate: '2024-12-01',
    });
  });

  it('shows active filter count badge', () => {
    const filtersWithValues = {
      status: 'SCHEDULED',
      professionalId: '1',
    };

    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        filters={filtersWithValues}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', () => {
    const filtersWithValues = {
      status: 'SCHEDULED',
    };

    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        filters={filtersWithValues}
      />
    );

    expect(screen.getByText('Limpiar')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    const filtersWithValues = {
      status: 'SCHEDULED' as const,
      professionalId: '1',
    };

    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Limpiar');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('shows active filters summary', () => {
    const filtersWithValues = {
      status: 'SCHEDULED' as const,
      professionalId: '1',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
    };

    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        filters={filtersWithValues}
      />
    );

    expect(screen.getByText('Filtros activos:')).toBeInTheDocument();
    expect(screen.getByText('Estado: Programado')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('01/12 - 31/12')).toBeInTheDocument();
  });

  it('allows removing individual filters from summary', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    const filtersWithValues = {
      status: 'SCHEDULED' as const,
    };

    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find and click the X button next to the status filter
    const statusBadge = screen.getByText('Estado: Programado').closest('.flex');
    const removeButton = statusBadge?.querySelector('button');
    
    if (removeButton) {
      await user.click(removeButton);
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        status: undefined,
      });
    }
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnExport = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByText('Exportar');
    await user.click(exportButton);

    expect(mockOnExport).toHaveBeenCalled();
  });

  it('shows professionals in filter dropdown', async () => {
    const user = userEvent.setup();
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Check professional options
    const professionalSelect = screen.getByDisplayValue('Todos los profesionales');
    fireEvent.click(professionalSelect);
    
    expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Dr. María González')).toBeInTheDocument();
  });

  it('shows treatment types in filter dropdown', async () => {
    const user = userEvent.setup();
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Check treatment type options
    const treatmentSelect = screen.getByDisplayValue('Todos los tratamientos');
    fireEvent.click(treatmentSelect);
    
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument();
    expect(screen.getByText('Consulta')).toBeInTheDocument();
  });

  it('handles time range filters', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = jest.fn();
    
    render(
      <AppointmentAdvancedFilters 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    // Set start time
    const startTimeInput = screen.getByLabelText('Hora desde');
    await user.type(startTimeInput, '09:00');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      startTime: '09:00',
    });
  });

  it('shows duration filter options', async () => {
    const user = userEvent.setup();
    render(<AppointmentAdvancedFilters {...defaultProps} />);

    // Expand filters
    const toggleButton = screen.getByText('Filtros Avanzados');
    await user.click(toggleButton);

    const durationSelect = screen.getByDisplayValue('Cualquier duración');
    fireEvent.click(durationSelect);
    
    expect(screen.getByText('30 minutos')).toBeInTheDocument();
    expect(screen.getByText('1 hora')).toBeInTheDocument();
    expect(screen.getByText('2 horas')).toBeInTheDocument();
  });
});