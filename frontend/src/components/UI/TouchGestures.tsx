import React, { useRef, useCallback, useEffect } from 'react';

interface TouchGestureProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  className?: string;
  threshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

const TouchGestures: React.FC<TouchGestureProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  className = '',
  threshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const lastTapRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number>(0);

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    touchStartRef.current = touchPoint;
    touchEndRef.current = null;

    // Handle multi-touch for pinch gestures
    if (e.touches.length === 2 && onPinch) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, onPinch, getDistance, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch && initialDistanceRef.current > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      onPinch(scale);
    }
  }, [onPinch, getDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    touchEndRef.current = touchPoint;

    const deltaX = touchPoint.x - touchStartRef.current.x;
    const deltaY = touchPoint.y - touchStartRef.current.y;
    const deltaTime = touchPoint.timestamp - touchStartRef.current.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for tap gestures
    if (distance < threshold && deltaTime < 300) {
      // Check for double tap
      if (onDoubleTap && lastTapRef.current) {
        const timeSinceLastTap = touchPoint.timestamp - lastTapRef.current.timestamp;
        if (timeSinceLastTap < doubleTapDelay) {
          onDoubleTap();
          lastTapRef.current = null;
          return;
        }
      }

      // Single tap
      if (onTap) {
        onTap();
      }

      lastTapRef.current = touchPoint;
      return;
    }

    // Check for swipe gestures
    if (distance >= threshold) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset references
    touchStartRef.current = null;
    touchEndRef.current = null;
    initialDistanceRef.current = 0;
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    threshold,
    doubleTapDelay,
  ]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

// Hook for touch gestures
export const useTouchGestures = (options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const touchStartRef = useRef<TouchPoint | null>(null);
    const lastTapRef = useRef<TouchPoint | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialDistanceRef = useRef<number>(0);

    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      onDoubleTap,
      onLongPress,
      onPinch,
      threshold = 50,
      longPressDelay = 500,
      doubleTapDelay = 300,
    } = options;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      if (e.touches.length === 2 && onPinch) {
        initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      }

      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress();
        }, longPressDelay);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (e.touches.length === 2 && onPinch && initialDistanceRef.current > 0) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistanceRef.current;
        onPinch(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const touchEnd: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < threshold && deltaTime < 300) {
        if (onDoubleTap && lastTapRef.current) {
          const timeSinceLastTap = touchEnd.timestamp - lastTapRef.current.timestamp;
          if (timeSinceLastTap < doubleTapDelay) {
            onDoubleTap();
            lastTapRef.current = null;
            return;
          }
        }

        if (onTap) {
          onTap();
        }

        lastTapRef.current = touchEnd;
        return;
      }

      if (distance >= threshold) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (isHorizontal) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
      initialDistanceRef.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [options]);

  return elementRef;
};

// Swipeable card component
export const SwipeableCard: React.FC<{
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}> = ({ children, onSwipeLeft, onSwipeRight, leftAction, rightAction, className = '' }) => {
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [isSwipeActive, setIsSwipeActive] = React.useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background actions */}
      {leftAction && (
        <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-red-500 text-white">
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-green-500 text-white">
          {rightAction}
        </div>
      )}

      {/* Main content */}
      <TouchGestures
        onSwipeLeft={() => {
          if (onSwipeLeft) {
            onSwipeLeft();
          }
        }}
        onSwipeRight={() => {
          if (onSwipeRight) {
            onSwipeRight();
          }
        }}
        className={`transform transition-transform duration-200 bg-white ${
          isSwipeActive ? 'scale-95' : ''
        }`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {children}
      </TouchGestures>
    </div>
  );
};

export default TouchGestures;