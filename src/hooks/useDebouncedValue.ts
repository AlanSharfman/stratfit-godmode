// src/hooks/useDebouncedValue.ts
// High-performance debouncing hook for slider optimization

import { useState, useEffect, useRef } from "react";

/**
 * Debounces a value with RAF (requestAnimationFrame) for smooth 60fps updates
 * and delayed heavy computation.
 * 
 * STABLE VERSION: Uses ref to prevent infinite loops from object reference changes
 * 
 * @param value - The value to debounce
 * @param delay - Delay in ms before updating (default: 150ms)
 * @returns [immediateValue, debouncedValue] - Use immediate for visuals, debounced for calculations
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): [T, T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef<T>(value);
  const delayRef = useRef<number>(delay);

  // Update refs immediately (no re-render)
  valueRef.current = value;
  delayRef.current = delay;

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
        setDebouncedValue(valueRef.current);
      }, delayRef.current);
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // ← EMPTY dependency array! Only runs once on mount

  return [valueRef.current, debouncedValue];
}

/**
 * Throttles updates to match browser refresh rate (60fps max).
 * Perfect for high-frequency events like slider drags.
 * 
 * STABLE VERSION: Uses ref to prevent infinite loops from object reference changes
 */
export function useThrottledValue<T>(value: T): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const valueRef = useRef<T>(value);

  // Update ref immediately (no re-render)
  valueRef.current = value;

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // If enough time has passed (16ms ≈ 60fps), update immediately
    if (timeSinceLastUpdate >= 16) {
      setThrottledValue(valueRef.current);
      lastUpdateRef.current = now;
      return;
    }

    // Otherwise, schedule RAF update
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setThrottledValue(valueRef.current);
      lastUpdateRef.current = Date.now();
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []); // ← EMPTY dependency array! Only runs once on mount

  return throttledValue;
}

