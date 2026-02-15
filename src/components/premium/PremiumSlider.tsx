// src/components/premium/PremiumSlider.tsx
// STRATFIT — God-Mode Neon Slider with sci-fi aesthetics

import React, { useCallback, useRef, useEffect, memo } from "react";
import styles from "./PremiumSlider.module.css";

interface PremiumSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  highlight?: boolean;
  highlightColor?: string | null;
}

const PremiumSlider = memo(function PremiumSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onStart,
  onEnd,
  highlight,
  highlightColor,
}: PremiumSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const valueRef = useRef(value);
  const pointerIdRef = useRef<number | null>(null);
  const captureElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const percentage = ((value - min) / (max - min)) * 100;
  const isHighlighted = highlight || highlightColor !== null;
  const activeColor = highlightColor || "#22d3ee";

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Direct DOM update for instant visual feedback
  const updateVisuals = useCallback((pct: number) => {
    if (fillRef.current) {
      fillRef.current.style.width = `${pct}%`;
    }
    if (thumbRef.current) {
      thumbRef.current.style.left = `${pct}%`;
    }
    if (glowRef.current) {
      glowRef.current.style.width = `${pct}%`;
    }
  }, []);

  // Sync visuals with value prop
  useEffect(() => {
    updateVisuals(percentage);
  }, [percentage, updateVisuals]);

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min + pct * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value]);

  const endDrag = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    // Cancel any pending RAF throttle
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    onEnd?.();

    // Micro polish: thumb pulse on release
    const el = thumbRef.current;
    if (el) {
      el.classList.remove(styles.thumbRelease);
      void el.offsetWidth;
      el.classList.add(styles.thumbRelease);
      window.setTimeout(() => el.classList.remove(styles.thumbRelease), 300);
    }

    if (captureElRef.current && pointerIdRef.current !== null) {
      try {
        captureElRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        // ignore
      }
    }
    pointerIdRef.current = null;
    captureElRef.current = null;
  }, [onEnd]);

  useEffect(() => {
    const end = () => endDrag();
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [endDrag]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    onStart?.();
    
    const newValue = calculateValue(e.clientX);
    const newPct = ((newValue - min) / (max - min)) * 100;
    updateVisuals(newPct);

    if (newValue !== valueRef.current) {
      valueRef.current = newValue;
      onChange(newValue);
    }
    
    pointerIdRef.current = e.pointerId;
    captureElRef.current = trackRef.current;
    trackRef.current?.setPointerCapture(e.pointerId);
  }, [calculateValue, min, max, onChange, onStart, updateVisuals]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const newValue = calculateValue(e.clientX);
    const newPct = ((newValue - min) / (max - min)) * 100;
    
    // Instant visual update (DOM-only, no React render)
    updateVisuals(newPct);
    
    if (newValue !== valueRef.current) {
      valueRef.current = newValue;
      // RAF-throttle: only fire onChange once per frame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        onChange(newValue);
        rafRef.current = null;
      });
    }
  }, [calculateValue, min, max, onChange, updateVisuals]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    endDrag();
  }, [endDrag]);

  return (
    <div 
      className={`${styles.container} ${isHighlighted ? styles.highlighted : ""}`}
      style={{ "--slider-color": activeColor } as React.CSSProperties}
    >
      <div 
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track background with grooves */}
        <div className={styles.trackBg} />
        
        {/* Glow layer under fill */}
        <div ref={glowRef} className={styles.glow} />
        
        {/* Fill bar */}
        <div ref={fillRef} className={styles.fill} />
        
        {/* Thumb */}
        <div ref={thumbRef} className={styles.thumb}>
          <div className={styles.thumbInner} />
          <div className={styles.thumbRing} />
        </div>
      </div>
    </div>
  );
});

export default PremiumSlider;

