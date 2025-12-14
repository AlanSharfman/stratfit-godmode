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
  
  const percentage = ((value - min) / (max - min)) * 100;
  const isHighlighted = highlight || highlightColor !== null;
  const activeColor = highlightColor || "#22d3ee";

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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    onStart?.();
    
    const newValue = calculateValue(e.clientX);
    const newPct = ((newValue - min) / (max - min)) * 100;
    updateVisuals(newPct);
    onChange(newValue);
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [calculateValue, min, max, onChange, onStart, updateVisuals]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const newValue = calculateValue(e.clientX);
    const newPct = ((newValue - min) / (max - min)) * 100;
    
    // Instant visual update
    updateVisuals(newPct);
    
    // Immediate state update
    onChange(newValue);
  }, [calculateValue, min, max, onChange, updateVisuals]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    onEnd?.();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [onEnd]);

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
          height: 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
          touch-action: none;
        }

        .slider-track::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }

        .slider-fill {
          position: absolute;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          will-change: width;
          transition: none !important;
        }

        .slider-container.highlighted .slider-fill {
          background: var(--slider-color);
          box-shadow: 0 0 8px color-mix(in srgb, var(--slider-color) 50%, transparent);
        }

        .slider-thumb {
          position: absolute;
          width: 14px;
          height: 14px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          will-change: left;
          transition: none !important;
        }

        .slider-track:active .slider-thumb {
          transform: translateX(-50%) scale(1.15);
          background: #fff;
        }

        .slider-container.highlighted .slider-thumb {
          background: var(--slider-color);
          box-shadow: 
            0 0 12px color-mix(in srgb, var(--slider-color) 70%, transparent),
            0 1px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
});

export default Slider;
