// src/hooks/useDebouncedValue.ts
// High-performance debouncing hook for slider optimization

import { useState, useEffect, useRef } from "react";

/**
 * Debounces a value with RAF (requestAnimationFrame) for smooth 60fps updates
 * and delayed heavy computation.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in ms before updating (default: 150ms)
 * @returns [immediateValue, debouncedValue] - Use immediate for visuals, debounced for calculations
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): [T, T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cancel any pending updates
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule RAF update for smooth immediate feedback
    rafRef.current = requestAnimationFrame(() => {
      // Then schedule debounced update for heavy calculations
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [value, debouncedValue];
}

/**
 * Throttles updates to match browser refresh rate (60fps max).
 * Perfect for high-frequency events like slider drags.
 */
export function useThrottledValue<T>(value: T): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // If enough time has passed (16ms ≈ 60fps), update immediately
    if (timeSinceLastUpdate >= 16) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
      return;
    }

    // Otherwise, schedule RAF update
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setThrottledValue(value);
      lastUpdateRef.current = Date.now();
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value]);

  return throttledValue;
}

