import { renderHook, act } from '@testing-library/react';
import { useInactivityTimer } from '../useInactivityTimer';

// Mock the auth context
const mockAuthContext = {
  user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'ADMIN' as const, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  refreshToken: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock timers
jest.useFakeTimers();

describe('useInactivityTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockAuthContext.isAuthenticated = true;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('calls logout after timeout when enabled and authenticated', () => {
    const timeout = 1000;
    
    renderHook(() =>
      useInactivityTimer({
        timeout,
        enabled: true,
      })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('calls custom onTimeout callback instead of logout', () => {
    const onTimeout = jest.fn();
    const timeout = 1000;
    
    renderHook(() =>
      useInactivityTimer({
        timeout,
        onTimeout,
        enabled: true,
      })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(onTimeout).toHaveBeenCalled();
    expect(mockAuthContext.logout).not.toHaveBeenCalled();
  });

  it('does not call logout when disabled', () => {
    const timeout = 1000;
    
    renderHook(() =>
      useInactivityTimer({
        timeout,
        enabled: false,
      })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(mockAuthContext.logout).not.toHaveBeenCalled();
  });

  it('does not call logout when not authenticated', () => {
    mockAuthContext.isAuthenticated = false;
    const timeout = 1000;
    
    renderHook(() =>
      useInactivityTimer({
        timeout,
        enabled: true,
      })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(mockAuthContext.logout).not.toHaveBeenCalled();
  });

  it('resets timer on activity', () => {
    const timeout = 1000;
    
    const { result } = renderHook(() =>
      useInactivityTimer({
        timeout,
        enabled: true,
      })
    );

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Reset timer
    act(() => {
      result.current.resetTimer();
    });

    // Advance time again (should not trigger logout yet)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockAuthContext.logout).not.toHaveBeenCalled();

    // Now advance the full timeout
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('pauses and resumes timer correctly', () => {
    const timeout = 1000;
    
    const { result } = renderHook(() =>
      useInactivityTimer({
        timeout,
        enabled: true,
      })
    );

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Pause timer
    act(() => {
      result.current.pauseTimer();
    });

    // Advance time (should not trigger logout)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockAuthContext.logout).not.toHaveBeenCalled();

    // Resume timer
    act(() => {
      result.current.resumeTimer();
    });

    // Now advance time to trigger logout
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });
});