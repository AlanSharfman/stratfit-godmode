// src/components/ui/Slider.tsx
// STRATFIT — Optimized Premium Slider
// Immediate response, memoized, no lag

import React, { useRef, useCallback, memo } from "react";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  highlight?: boolean;
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
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const rafRef = useRef<number | null>(null);
  const lastValueRef = useRef(value);

  // Optimized change handler with RAF throttling
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      
      // Skip if value hasn't changed
      if (newValue === lastValueRef.current) return;
      lastValueRef.current = newValue;

      // Cancel pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use RAF for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        onChange(newValue);
        rafRef.current = null;
      });
    },
    [onChange]
  );

  const handleMouseDown = useCallback(() => {
    onStart?.();
  }, [onStart]);

  const handleMouseUp = useCallback(() => {
    onEnd?.();
  }, [onEnd]);

  return (
    <div className="slider-container">
      <div className={`slider-wrapper ${highlight ? "highlight" : ""}`}>
        {/* Track background */}
        <div className="slider-track">
          {/* Filled portion */}
          <div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Native input */}
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onChange={handleChange}
          className="slider-input"
        />

        {/* Custom thumb */}
        <div
          className="slider-thumb"
          style={{ left: `${percentage}%` }}
        />
      </div>

      <style>{`
        .slider-container {
          width: 100%;
          padding: 6px 0;
        }

        .slider-wrapper {
          position: relative;
          width: 100%;
          height: 18px;
          display: flex;
          align-items: center;
          transition: filter 0.15s ease;
        }

        .slider-wrapper.highlight {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
        }

        .slider-track {
          position: absolute;
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .slider-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.9) 100%);
          border-radius: 2px;
          transition: width 0.05s ease-out;
        }

        .slider-thumb {
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 
            0 0 0 2px rgba(255, 255, 255, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.4),
            0 0 10px rgba(255, 255, 255, 0.2);
          pointer-events: none;
          z-index: 2;
          transition: left 0.05s ease-out;
        }

        .slider-input {
          position: absolute;
          width: 100%;
          height: 18px;
          opacity: 0;
          cursor: pointer;
          z-index: 3;
          margin: 0;
        }

        .slider-input:active + .slider-thumb {
          transform: translateX(-50%) scale(1.1);
          box-shadow: 
            0 0 0 3px rgba(255, 255, 255, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 0 14px rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
});

export default Slider;
