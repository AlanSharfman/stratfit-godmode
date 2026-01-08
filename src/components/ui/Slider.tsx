// src/components/ui/Slider.tsx
// STRATFIT — Ultra-responsive Slider
// Zero delay, direct DOM updates for smoothest possible response

import React, { useCallback, useRef, useEffect, memo } from "react";

interface SliderProps {
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

const Slider = memo(function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onStart,
  onEnd,
  highlight,
  highlightColor,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const valueRef = useRef(value);
  const pointerIdRef = useRef<number | null>(null);
  const captureElRef = useRef<HTMLElement | null>(null);
  
  const percentage = ((value - min) / (max - min)) * 100;
  const isHighlighted = highlight || highlightColor !== null;
  const activeColor = highlightColor || "#22d3ee"; // Default cyan

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
    onEnd?.();

    // Micro polish: thumb micro-glow on release (UI-only; no state/store changes)
    const el = thumbRef.current;
    if (el) {
      el.classList.remove("sf-thumb-release");
      // Force reflow so animation can retrigger even on rapid releases
      void el.offsetWidth;
      el.classList.add("sf-thumb-release");
      window.setTimeout(() => el.classList.remove("sf-thumb-release"), 220);
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

    // Avoid redundant state churn on pointerdown
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
    
    // Instant visual update
    updateVisuals(newPct);
    
    // Immediate state update (only when value actually changes)
    if (newValue !== valueRef.current) {
      valueRef.current = newValue;
      onChange(newValue);
    }
  }, [calculateValue, min, max, onChange, updateVisuals]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    endDrag();
  }, [endDrag]);

  return (
    <div 
      className={`slider-container ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--slider-color": activeColor } as React.CSSProperties}
    >
      <div 
        ref={trackRef}
        className="slider-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={fillRef} className="slider-fill" />
        <div ref={thumbRef} className="slider-thumb" />
      </div>

      <style>{`
        .slider-container {
          width: 100%;
          padding: 6px 0;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: 24px;
          display: flex;
          align-items: center;
          cursor: pointer;
          touch-action: none;
        }

        .slider-track::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 6px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border: 1px solid rgba(34, 211, 238, 0.15);
          border-radius: 3px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .slider-fill {
          position: absolute;
          height: 6px;
          background: linear-gradient(90deg, rgba(34, 211, 238, 0.7), rgba(34, 211, 238, 0.9));
          border-radius: 3px;
          will-change: width;
          transition: none !important;
          transform: translateZ(0); /* 🔥 GPU acceleration */
          backface-visibility: hidden; /* 🔥 Prevent paint flicker */
          box-shadow: 
            0 0 12px rgba(34, 211, 238, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .slider-container.highlighted .slider-fill {
          background: linear-gradient(90deg, 
            color-mix(in srgb, var(--slider-color) 80%, transparent),
            var(--slider-color)
          );
          box-shadow: 
            0 0 16px color-mix(in srgb, var(--slider-color) 60%, transparent),
            0 0 6px color-mix(in srgb, var(--slider-color) 80%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .slider-thumb {
          position: absolute;
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(34, 211, 238, 1));
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: translateX(-50%) translateZ(0); /* 🔥 GPU layer */
          backface-visibility: hidden; /* 🔥 Prevent paint flicker */
          box-shadow: 
            0 0 16px rgba(34, 211, 238, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          will-change: left, transform;
          /* CRITICAL: do NOT transition "left" or the thumb will lag behind the pointer. */
          transition:
            box-shadow 80ms cubic-bezier(0.22, 1, 0.36, 1),
            background 80ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 80ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .slider-track:active .slider-thumb {
          transform: translateX(-50%) translateZ(0) scale(1.15); /* 🔥 Slightly reduced scale for speed */
          box-shadow: 
            0 0 24px rgba(34, 211, 238, 0.8),
            0 2px 12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .slider-container.highlighted .slider-thumb {
          background: linear-gradient(135deg, 
            color-mix(in srgb, var(--slider-color) 90%, white),
            var(--slider-color)
          );
          border-color: color-mix(in srgb, var(--slider-color) 50%, white);
          box-shadow: 
            0 0 20px color-mix(in srgb, var(--slider-color) 70%, transparent),
            0 0 8px var(--slider-color),
            0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .slider-thumb.sf-thumb-release {
          animation: sfThumbRelease 180ms ease-out;
        }

        @keyframes sfThumbRelease {
          0% { transform: translateX(-50%) translateZ(0) scale(1); }
          55% { transform: translateX(-50%) translateZ(0) scale(1.06); box-shadow: 0 0 20px rgba(34, 211, 238, 0.6), 0 2px 10px rgba(0, 0, 0, 0.45); }
          100% { transform: translateX(-50%) translateZ(0) scale(1); }
        }
      `}</style>
    </div>
  );
});

export default Slider;
