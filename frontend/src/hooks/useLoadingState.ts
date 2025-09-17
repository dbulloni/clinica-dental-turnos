import { useState, useCallback } from 'react';

interface UseLoadingStateReturn {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (initialState = false): UseLoadingStateReturn => {
  const [isLoading, setIsLoading] = useState(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    setLoading,
    withLoading,
  };
};

export default useLoadingState;