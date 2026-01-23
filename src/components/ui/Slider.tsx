// src/components/ui/Slider.tsx
// STRATFIT — Professional GOD-MODE Slider
// Bloomberg terminal aesthetic: reduced glow, numeric anchoring, visual detents

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
  
  const percentage = ((value - min) / (max - min)) * 100;
  const isHighlighted = highlight || highlightColor !== null;
  const activeColor = highlightColor || "#22d3ee";

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const updateVisuals = useCallback((pct: number) => {
    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
  }, []);

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

    if (trackRef.current && pointerIdRef.current !== null) {
      try {
        trackRef.current.releasePointerCapture(pointerIdRef.current);
      } catch { /* ignore */ }
    }
    pointerIdRef.current = null;
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
    trackRef.current?.setPointerCapture(e.pointerId);
  }, [calculateValue, min, max, onChange, onStart, updateVisuals]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const newValue = calculateValue(e.clientX);
    const newPct = ((newValue - min) / (max - min)) * 100;
    
    updateVisuals(newPct);
    
    if (newValue !== valueRef.current) {
      valueRef.current = newValue;
      onChange(newValue);
    }
  }, [calculateValue, min, max, onChange, updateVisuals]);

  return (
    <div 
      className={`pro-slider ${isHighlighted ? "pro-hl" : ""}`}
      style={{ "--pro-color": activeColor } as React.CSSProperties}
    >
      {/* Track with detent markers */}
      <div 
        ref={trackRef}
        className="pro-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Track groove */}
        <div className="pro-groove" />
        
        {/* Detent tick marks - 5 bands */}
        <div className="pro-detents">
          <div className="pro-tick" style={{ left: '0%' }} />
          <div className="pro-tick" style={{ left: '25%' }} />
          <div className="pro-tick pro-tick-center" style={{ left: '50%' }} />
          <div className="pro-tick" style={{ left: '75%' }} />
          <div className="pro-tick" style={{ left: '100%' }} />
        </div>
        
        {/* Fill bar */}
        <div ref={fillRef} className="pro-fill" />
        
        {/* Thumb */}
        <div ref={thumbRef} className="pro-thumb">
          <div className="pro-thumb-core" />
        </div>
      </div>
      
      {/* Numeric anchoring labels */}
      <div className="pro-labels">
        <span className="pro-label">Low</span>
        <span className="pro-label pro-label-center">Neutral</span>
        <span className="pro-label">High</span>
      </div>

      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           PROFESSIONAL SLIDER — Container
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-slider {
          width: 100%;
          padding: 4px 0 2px;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .pro-track {
          position: relative;
          width: 100%;
          height: 20px; /* REDUCED another 15% (was 24px) */
          display: flex;
          align-items: center;
          cursor: pointer;
          touch-action: none;
        }

        /* ═══════════════════════════════════════════════════════════════
           TRACK GROOVE — Machined channel (same glass look, less glow)
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-groove {
          position: absolute;
          width: 100%;
          height: 6px; /* REDUCED another 15% (was 7px) */
          border-radius: 3px;
          
          /* Glass/machined groove */
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.92) 0%,
            rgba(8, 12, 20, 0.95) 40%,
            rgba(15, 20, 30, 0.9) 100%
          );
          
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.8),
            inset 0 1px 1px rgba(0, 0, 0, 0.6),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.03);
        }

        /* ═══════════════════════════════════════════════════════════════
           DETENT TICK MARKS — Visual calibration bands
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-detents {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .pro-tick {
          position: absolute;
          top: 50%;
          width: 1px;
          height: 14px;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.12);
        }

        .pro-tick-center {
          height: 18px;
          width: 2px;
          background: rgba(255, 255, 255, 0.18);
        }

        /* ═══════════════════════════════════════════════════════════════
           FILL BAR — Cyan glass (reduced bloom ~35%)
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-fill {
          position: absolute;
          height: 6px; /* REDUCED another 15% (was 7px) */
          border-radius: 3px;
          will-change: width;
          transform: translateZ(0);
          
          /* Cyan glass gradient */
          background: linear-gradient(180deg,
            rgba(70, 220, 250, 1) 0%,
            rgba(34, 211, 238, 1) 45%,
            rgba(22, 190, 220, 1) 100%
          );
          
          /* Reduced glow - ~35% less bloom */
          box-shadow:
            0 0 5px rgba(34, 211, 238, 0.6),
            0 0 10px rgba(34, 211, 238, 0.35),
            0 0 18px rgba(34, 211, 238, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 80, 100, 0.3);
        }

        .pro-hl .pro-fill {
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--pro-color) 100%, white 15%) 0%,
            var(--pro-color) 45%,
            color-mix(in srgb, var(--pro-color) 88%, black) 100%
          );
          
          box-shadow:
            0 0 5px color-mix(in srgb, var(--pro-color) 65%, transparent),
            0 0 10px color-mix(in srgb, var(--pro-color) 38%, transparent),
            0 0 18px color-mix(in srgb, var(--pro-color) 18%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.25);
        }

        /* ═══════════════════════════════════════════════════════════════
           THUMB — Glass orb (reduced glow)
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-thumb {
          position: absolute;
          width: 10px; /* REDUCED another 15% (was 12px) */
          height: 10px; /* REDUCED another 15% (was 12px) */
          transform: translateX(-50%) translateZ(0);
          will-change: left, transform;
          z-index: 10;
          transition: transform 80ms ease;
        }

        .pro-thumb-core {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          
          /* Glass orb gradient */
          background: 
            radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.95) 0%, transparent 42%),
            radial-gradient(circle at 50% 50%,
              rgba(130, 240, 255, 1) 0%,
              rgba(34, 211, 238, 1) 42%,
              rgba(22, 185, 215, 1) 100%
            );
          
          /* Chrome border */
          border: 1.5px solid rgba(255, 255, 255, 0.65);
          
          /* Glow reduced 25% */
          box-shadow:
            0 0 8px rgba(34, 211, 238, 0.5),
            0 0 16px rgba(34, 211, 238, 0.25),
            0 2px 4px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.5),
            inset 0 -1px 2px rgba(0, 80, 100, 0.4);
        }

        .pro-hl .pro-thumb-core {
          background: 
            radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.95) 0%, transparent 42%),
            radial-gradient(circle at 50% 50%,
              color-mix(in srgb, var(--pro-color) 55%, white) 0%,
              var(--pro-color) 42%,
              color-mix(in srgb, var(--pro-color) 82%, black) 100%
            );
          
          box-shadow:
            0 0 12px color-mix(in srgb, var(--pro-color) 55%, transparent),
            0 0 24px color-mix(in srgb, var(--pro-color) 28%, transparent),
            0 3px 6px rgba(0, 0, 0, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.5),
            inset 0 -1px 3px rgba(0, 0, 0, 0.35);
        }

        /* ═══════════════════════════════════════════════════════════════
           HOVER STATE — Subtle engagement
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-track:hover .pro-thumb {
          transform: translateX(-50%) scale(1.1);
        }

        .pro-track:hover .pro-thumb-core {
          box-shadow:
            0 0 14px rgba(34, 211, 238, 0.6),
            0 0 28px rgba(34, 211, 238, 0.3),
            0 3px 7px rgba(0, 0, 0, 0.45),
            inset 0 1px 2px rgba(255, 255, 255, 0.55),
            inset 0 -1px 3px rgba(0, 80, 100, 0.45);
        }

        .pro-track:hover .pro-fill {
          box-shadow:
            0 0 6px rgba(34, 211, 238, 0.7),
            0 0 12px rgba(34, 211, 238, 0.4),
            0 0 22px rgba(34, 211, 238, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 0 rgba(0, 80, 100, 0.35);
        }

        /* ═══════════════════════════════════════════════════════════════
           ACTIVE / DRAGGING STATE
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-track:active .pro-thumb {
          transform: translateX(-50%) scale(1.15);
        }

        .pro-track:active .pro-thumb-core {
          box-shadow:
            0 0 16px rgba(34, 211, 238, 0.7),
            0 0 32px rgba(34, 211, 238, 0.38),
            0 0 48px rgba(34, 211, 238, 0.15),
            0 4px 8px rgba(0, 0, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.6),
            inset 0 -1px 3px rgba(0, 80, 100, 0.5);
        }

        .pro-track:active .pro-fill {
          box-shadow:
            0 0 8px rgba(34, 211, 238, 0.8),
            0 0 16px rgba(34, 211, 238, 0.5),
            0 0 28px rgba(34, 211, 238, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(0, 80, 100, 0.4);
        }

        /* Highlight detents on active */
        .pro-track:active .pro-tick {
          background: rgba(34, 211, 238, 0.25);
        }

        .pro-track:active .pro-tick-center {
          background: rgba(34, 211, 238, 0.4);
        }

        /* ═══════════════════════════════════════════════════════════════
           NUMERIC ANCHORING LABELS
           ═══════════════════════════════════════════════════════════════ */
        
        .pro-labels {
          display: flex;
          justify-content: space-between;
          padding: 3px 2px 0;
        }

        .pro-label {
          font-size: 9px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .pro-label-center {
          color: rgba(255, 255, 255, 0.45);
        }

        /* Highlight labels on hover/active */
        .pro-slider:hover .pro-label {
          color: rgba(255, 255, 255, 0.45);
        }

        .pro-slider:hover .pro-label-center {
          color: rgba(34, 211, 238, 0.6);
        }
      `}</style>
    </div>
  );
});

export default Slider;
