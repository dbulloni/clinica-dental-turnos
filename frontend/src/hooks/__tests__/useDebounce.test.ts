import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

// Mock timers
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by less than delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Value should still be the old one
    expect(result.current).toBe('initial');

    // Fast-forward time to complete the delay
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change value multiple times rapidly
    rerender({ value: 'first', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    rerender({ value: 'second', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    rerender({ value: 'final', delay: 500 });

    // Value should still be initial because timer keeps resetting
    expect(result.current).toBe('initial');

    // Complete the final delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should have the final value
    expect(result.current).toBe('final');
  });

  it('works with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('works with objects', () => {
    const initialObj = { name: 'John', age: 30 };
    const updatedObj = { name: 'Jane', age: 25 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 300 },
      }
    );

    expect(result.current).toBe(initialObj);

    rerender({ value: updatedObj, delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(updatedObj);
  });

  it('handles delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Advance by original delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should still be initial because delay was changed
    expect(result.current).toBe('initial');

    // Advance by new delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });
});