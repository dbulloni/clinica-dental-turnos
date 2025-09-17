import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Hook for debouncing values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Hook for memoizing expensive calculations
export const useMemoizedCalculation = <T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(calculation, dependencies);
};

// Hook for optimized event handlers
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  return useCallback(callback, dependencies);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Hook for virtual scrolling
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight,
  };
};

// Hook for optimized search
export const useOptimizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceDelay = 300
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;

    const lowercaseSearchTerm = debouncedSearchTerm.toLowerCase();

    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseSearchTerm);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowercaseSearchTerm);
        }
        return false;
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);

  return {
    filteredItems,
    isSearching: searchTerm !== debouncedSearchTerm,
  };
};

// Hook for optimized sorting
export const useOptimizedSorting = <T>(
  items: T[],
  sortKey: keyof T | null,
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
  const sortedItems = useMemo(() => {
    if (!sortKey) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [items, sortKey, sortDirection]);

  return sortedItems;
};

// Hook for optimized pagination
export const useOptimizedPagination = <T>(
  items: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return {
      items: paginatedItems,
      currentPage,
      totalPages,
      totalItems: items.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length),
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
  }, [paginatedData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginatedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginatedData.hasPreviousPage]);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    ...paginatedData,
    goToPage,
    nextPage,
    previousPage,
  };
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
  });

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - Renders: ${renderCount.current}, Time: ${renderTime}ms`);
    }

    return () => {
      startTime.current = Date.now();
    };
  });

  return {
    renderCount: renderCount.current,
  };
};

// Hook for optimized data fetching with caching
export const useOptimizedDataFetching = <T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList,
  cacheKey?: string,
  cacheTime = 5 * 60 * 1000 // 5 minutes
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async () => {
    const key = cacheKey || JSON.stringify(dependencies);
    const cached = cache.current.get(key);

    // Check if cached data is still valid
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      
      // Cache the result
      cache.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, cacheTime, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(() => {
    // Clear cache for this key
    const key = cacheKey || JSON.stringify(dependencies);
    cache.current.delete(key);
    fetchData();
  }, [fetchData, cacheKey, ...dependencies]);

  return { data, loading, error, refetch };
};

// Hook for managing component state with optimizations
export const useOptimizedState = <T>(
  initialState: T,
  options: {
    debounceDelay?: number;
    throttleDelay?: number;
    enableHistory?: boolean;
    maxHistorySize?: number;
  } = {}
) => {
  const {
    debounceDelay,
    throttleDelay,
    enableHistory = false,
    maxHistorySize = 10,
  } = options;

  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const historyIndex = useRef(0);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      if (enableHistory) {
        setHistory(prevHistory => {
          const newHistory = [...prevHistory.slice(0, historyIndex.current + 1), nextState];
          if (newHistory.length > maxHistorySize) {
            return newHistory.slice(-maxHistorySize);
          }
          historyIndex.current = newHistory.length - 1;
          return newHistory;
        });
      }
      
      return nextState;
    });
  }, [enableHistory, maxHistorySize]);

  const debouncedUpdateState = useDebounce(updateState, debounceDelay || 0);
  const throttledUpdateState = useThrottle(updateState, throttleDelay || 0);

  const finalUpdateState = debounceDelay 
    ? debouncedUpdateState 
    : throttleDelay 
    ? throttledUpdateState 
    : updateState;

  const undo = useCallback(() => {
    if (enableHistory && historyIndex.current > 0) {
      historyIndex.current -= 1;
      setState(history[historyIndex.current]);
    }
  }, [enableHistory, history]);

  const redo = useCallback(() => {
    if (enableHistory && historyIndex.current < history.length - 1) {
      historyIndex.current += 1;
      setState(history[historyIndex.current]);
    }
  }, [enableHistory, history]);

  return {
    state,
    setState: finalUpdateState,
    history: enableHistory ? history : [],
    canUndo: enableHistory && historyIndex.current > 0,
    canRedo: enableHistory && historyIndex.current < history.length - 1,
    undo,
    redo,
  };
};