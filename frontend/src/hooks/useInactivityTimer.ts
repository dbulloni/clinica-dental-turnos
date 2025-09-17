import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseInactivityTimerOptions {
  timeout?: number; // in milliseconds
  onTimeout?: () => void;
  events?: string[];
  enabled?: boolean;
}

export const useInactivityTimer = ({
  timeout = 30 * 60 * 1000, // 30 minutes default
  onTimeout,
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  enabled = true,
}: UseInactivityTimerOptions = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const resetTimer = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      } else {
        logout();
      }
    }, timeout);
  }, [enabled, isAuthenticated, timeout, onTimeout, logout]);

  const handleActivity = useCallback(() => {
    if (!enabled || !isAuthenticated) return;
    
    isActiveRef.current = true;
    resetTimer();
  }, [enabled, isAuthenticated, resetTimer]);

  const pauseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  const resumeTimer = useCallback(() => {
    if (enabled && isAuthenticated) {
      isActiveRef.current = true;
      resetTimer();
    }
  }, [enabled, isAuthenticated, resetTimer]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      // Clean up if disabled or not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Start timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseTimer();
      } else {
        resumeTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isAuthenticated, events, handleActivity, resetTimer, pauseTimer, resumeTimer]);

  return {
    resetTimer,
    pauseTimer,
    resumeTimer,
    isActive: isActiveRef.current,
  };
};

export default useInactivityTimer;