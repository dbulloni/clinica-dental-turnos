import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import NotificationCenter from '../NotificationCenter';

// Mock the child components
vi.mock('../NotificationMonitor', () => ({
  default: () => <div data-testid="notification-monitor">Notification Monitor</div>
}));

vi.mock('../MessageTemplates', () => ({
  default: () => <div data-testid="message-templates">Message Templates</div>
}));

vi.mock('../NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">Notification Settings</div>
}));

// Mock the hook
vi.mock('../../hooks/useNotifications', () => ({
  useNotificationStats: () => ({
    stats: {
      today: 25,
      delivered: 20,
      failed: 3,
      pending: 2,
      systemStatus: 'healthy',
      recentAlerts: []
    },
    loading: false
  })
}));

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification center with header and stats', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByText('Centro de Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Gestión completa del sistema de notificaciones WhatsApp y Email')).toBeInTheDocument();
    
    // Check stats cards
    expect(screen.getByText('25')).toBeInTheDocument(); // Today
    expect(screen.getByText('20')).toBeInTheDocument(); // Delivered
    expect(screen.getByText('3')).toBeInTheDocument(); // Failed
    expect(screen.getByText('2')).toBeInTheDocument(); // Pending
  });

  it('displays navigation tabs', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByText('Monitor')).toBeInTheDocument();
    expect(screen.getByText('Plantillas')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('shows monitor view by default', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByTestId('notification-monitor')).toBeInTheDocument();
  });

  it('navigates between different views', async () => {
    render(<NotificationCenter />);
    
    // Click on Templates tab
    fireEvent.click(screen.getByText('Plantillas'));
    await waitFor(() => {
      expect(screen.getByTestId('message-templates')).toBeInTheDocument();
    });

    // Click on Settings tab
    fireEvent.click(screen.getByText('Configuración'));
    await waitFor(() => {
      expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    });

    // Click back to Monitor tab
    fireEvent.click(screen.getByText('Monitor'));
    await waitFor(() => {
      expect(screen.getByTestId('notification-monitor')).toBeInTheDocument();
    });
  });

  it('highlights active tab', () => {
    render(<NotificationCenter />);
    
    // Monitor should be active by default
    const monitorTab = screen.getByRole('button', { name: /monitor/i });
    expect(monitorTab).toHaveClass('border-blue-500', 'text-blue-600');
    
    // Click on Templates
    const templatesTab = screen.getByRole('button', { name: /plantillas/i });
    fireEvent.click(templatesTab);
    
    expect(templatesTab).toHaveClass('border-blue-500', 'text-blue-600');
  });

  it('does not show system status alert when system is healthy', () => {
    render(<NotificationCenter />);
    
    expect(screen.queryByText('Estado del Sistema de Notificaciones')).not.toBeInTheDocument();
  });
});