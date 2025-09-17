import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      // Determine current breakpoint
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  const isBreakpoint = (breakpoint: Breakpoint) => {
    return currentBreakpoint === breakpoint;
  };

  const isBreakpointUp = (breakpoint: Breakpoint) => {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  };

  const isBreakpointDown = (breakpoint: Breakpoint) => {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  };

  const isMobile = isBreakpointDown('sm');
  const isTablet = isBreakpoint('md') || isBreakpoint('lg');
  const isDesktop = isBreakpointUp('lg');
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    windowSize,
    currentBreakpoint,
    breakpoints,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
  };
};

// Hook for media queries
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Hook for orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook for container queries (experimental)
export const useContainerQuery = (containerRef: React.RefObject<HTMLElement>) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return containerSize;
};

// Responsive component wrapper
export const Responsive: React.FC<{
  children: React.ReactNode;
  breakpoint?: Breakpoint;
  up?: boolean;
  down?: boolean;
  only?: boolean;
}> = ({ children, breakpoint, up = false, down = false, only = false }) => {
  const { isBreakpoint, isBreakpointUp, isBreakpointDown } = useResponsive();

  if (!breakpoint) return <>{children}</>;

  let shouldRender = false;

  if (only) {
    shouldRender = isBreakpoint(breakpoint);
  } else if (up) {
    shouldRender = isBreakpointUp(breakpoint);
  } else if (down) {
    shouldRender = isBreakpointDown(breakpoint);
  } else {
    shouldRender = isBreakpoint(breakpoint);
  }

  return shouldRender ? <>{children}</> : null;
};

// Responsive grid hook
export const useResponsiveGrid = () => {
  const { currentBreakpoint } = useResponsive();

  const getGridCols = (config: Partial<Record<Breakpoint, number>>) => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    
    for (const bp of breakpointOrder) {
      if (config[bp] !== undefined) {
        const breakpointOrder2: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = breakpointOrder2.indexOf(currentBreakpoint);
        const configIndex = breakpointOrder2.indexOf(bp);
        
        if (currentIndex >= configIndex) {
          return config[bp];
        }
      }
    }
    
    return config.xs || 1;
  };

  return { getGridCols };
};

// Responsive text hook
export const useResponsiveText = () => {
  const { currentBreakpoint } = useResponsive();

  const getTextSize = (config: Partial<Record<Breakpoint, string>>) => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    
    for (const bp of breakpointOrder) {
      if (config[bp] !== undefined) {
        const breakpointOrder2: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = breakpointOrder2.indexOf(currentBreakpoint);
        const configIndex = breakpointOrder2.indexOf(bp);
        
        if (currentIndex >= configIndex) {
          return config[bp];
        }
      }
    }
    
    return config.xs || 'text-base';
  };

  return { getTextSize };
};