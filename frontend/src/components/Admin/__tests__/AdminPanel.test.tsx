import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AdminPanel from '../AdminPanel';

// Mock the child components
vi.mock('../Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard Component</div>
}));

vi.mock('../ProfessionalManagement', () => ({
  default: () => <div data-testid="professional-management">Professional Management Component</div>
}));

vi.mock('../TreatmentTypeManagement', () => ({
  default: () => <div data-testid="treatment-management">Treatment Management Component</div>
}));

vi.mock('../ReportsAndAnalytics', () => ({
  default: () => <div data-testid="reports">Reports Component</div>
}));

vi.mock('../SystemConfiguration', () => ({
  default: () => <div data-testid="system-config">System Configuration Component</div>
}));

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin panel with sidebar and dashboard by default', () => {
    render(<AdminPanel />);
    
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('displays all menu items in sidebar', () => {
    render(<AdminPanel />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profesionales')).toBeInTheDocument();
    expect(screen.getByText('Tratamientos')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('navigates to different sections when menu items are clicked', async () => {
    render(<AdminPanel />);
    
    // Click on Professionals
    fireEvent.click(screen.getByText('Profesionales'));
    await waitFor(() => {
      expect(screen.getByTestId('professional-management')).toBeInTheDocument();
    });

    // Click on Treatments
    fireEvent.click(screen.getByText('Tratamientos'));
    await waitFor(() => {
      expect(screen.getByTestId('treatment-management')).toBeInTheDocument();
    });

    // Click on Reports
    fireEvent.click(screen.getByText('Reportes'));
    await waitFor(() => {
      expect(screen.getByTestId('reports')).toBeInTheDocument();
    });

    // Click on Configuration
    fireEvent.click(screen.getByText('Configuración'));
    await waitFor(() => {
      expect(screen.getByTestId('system-config')).toBeInTheDocument();
    });
  });

  it('highlights active menu item', () => {
    render(<AdminPanel />);
    
    // Dashboard should be active by default
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('bg-blue-50', 'text-blue-700');
    
    // Click on Professionals
    const professionalsButton = screen.getByRole('button', { name: /profesionales/i });
    fireEvent.click(professionalsButton);
    
    expect(professionalsButton).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('shows back to dashboard button when not on dashboard', async () => {
    render(<AdminPanel />);
    
    // Initially should not show back button
    expect(screen.queryByText('Volver al Dashboard')).not.toBeInTheDocument();
    
    // Navigate to professionals
    fireEvent.click(screen.getByText('Profesionales'));
    
    await waitFor(() => {
      expect(screen.getByText('Volver al Dashboard')).toBeInTheDocument();
    });
    
    // Click back to dashboard
    fireEvent.click(screen.getByText('Volver al Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Volver al Dashboard')).not.toBeInTheDocument();
    });
  });

  it('displays correct header information for each section', async () => {
    render(<AdminPanel />);
    
    // Dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Resumen general y estadísticas')).toBeInTheDocument();
    
    // Navigate to professionals
    fireEvent.click(screen.getByText('Profesionales'));
    await waitFor(() => {
      expect(screen.getByText('Profesionales')).toBeInTheDocument();
      expect(screen.getByText('Gestión de médicos y especialistas')).toBeInTheDocument();
    });
    
    // Navigate to treatments
    fireEvent.click(screen.getByText('Tratamientos'));
    await waitFor(() => {
      expect(screen.getByText('Tratamientos')).toBeInTheDocument();
      expect(screen.getByText('Tipos de tratamientos y servicios')).toBeInTheDocument();
    });
  });

  it('shows placeholder for users section', async () => {
    render(<AdminPanel />);
    
    fireEvent.click(screen.getByText('Usuarios'));
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Esta funcionalidad estará disponible próximamente.')).toBeInTheDocument();
    });
  });

  it('displays system status in sidebar', () => {
    render(<AdminPanel />);
    
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Última actualización: Hoy')).toBeInTheDocument();
  });

  // Mobile responsiveness tests
  it('handles mobile menu toggle', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<AdminPanel />);
    
    // Should have mobile menu button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
    
    // Click to open mobile menu
    fireEvent.click(menuButton);
    
    // Should show close button
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('closes mobile menu when clicking overlay', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<AdminPanel />);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Click overlay (this would be the backdrop)
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // Menu should be closed (close button should not be visible)
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('closes mobile menu when selecting a menu item', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<AdminPanel />);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Click on a menu item
    fireEvent.click(screen.getByText('Profesionales'));
    
    await waitFor(() => {
      // Should navigate to professionals
      expect(screen.getByTestId('professional-management')).toBeInTheDocument();
      // Mobile menu should be closed
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });
});