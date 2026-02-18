// src/components/ui/Slider.tsx
// STRATFIT — Professional GOD-MODE Slider (track-first)
// Goal: Reference slider track + detents + thumb glow (calm, institutional)
// Default: NO internal Low/Neutral/High labels to avoid double-render in ControlDeck.

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

  /**
   * Optional: render internal Low/Neutral/High labels.
   * Default false because ControlDeck renders the scale row.
   */
  showLabels?: boolean;
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
  showLabels = false,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const valueRef = useRef(value);
  const pointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const span = Math.max(1e-9, max - min);
  const percentage = ((value - min) / span) * 100;

  const isHighlighted = !!highlight || highlightColor !== null;
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

  const calculateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const rawValue = min + pct * (max - min);

      // step quantization (stable)
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, value]
  );

  const endDrag = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    onEnd?.();

    if (trackRef.current && pointerIdRef.current !== null) {
      try {
        trackRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      onStart?.();

      const newValue = calculateValue(e.clientX);
      const newPct = ((newValue - min) / span) * 100;
      updateVisuals(newPct);

      if (newValue !== valueRef.current) {
        valueRef.current = newValue;
        onChange(newValue);
      }

      pointerIdRef.current = e.pointerId;
      trackRef.current?.setPointerCapture(e.pointerId);
    },
    [calculateValue, min, onChange, onStart, span, updateVisuals]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;

      const newValue = calculateValue(e.clientX);
      const newPct = ((newValue - min) / span) * 100;

      updateVisuals(newPct);

      if (newValue !== valueRef.current) {
        valueRef.current = newValue;

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onChange(newValue);
          rafRef.current = null;
        });
      }
    },
    [calculateValue, min, onChange, span, updateVisuals]
  );

  return (
    <div
      className={`sf-slider ${isHighlighted ? "sf-slider--hl" : ""}`}
      style={{ ["--sf-color" as any]: activeColor } as React.CSSProperties}
    >
      <div
        ref={trackRef}
        className="sf-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        {/* Deep groove */}
        <div className="sf-groove" />

        {/* Detents (subtle) */}
        <div className="sf-detents" aria-hidden="true">
          <div className="sf-tick" style={{ left: "0%" }} />
          <div className="sf-tick" style={{ left: "25%" }} />
          <div className="sf-tick sf-tick--center" style={{ left: "50%" }} />
          <div className="sf-tick" style={{ left: "75%" }} />
          <div className="sf-tick" style={{ left: "100%" }} />
        </div>

        {/* Fill */}
        <div ref={fillRef} className="sf-fill" />

        {/* Thumb */}
        <div ref={thumbRef} className="sf-thumb">
          <div className="sf-thumbCore" />
        </div>
      </div>

      {showLabels && (
        <div className="sf-labels">
          <span className="sf-label">Low</span>
          <span className="sf-label sf-label--center">Neutral</span>
          <span className="sf-label">High</span>
        </div>
      )}

      <style>{`
        /* ============================================================
           ROOT
           ============================================================ */
        .sf-slider {
          width: 100%;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
          --sf-color: #22d3ee;
        }

        /* ============================================================
           TRACK
           ============================================================ */
        .sf-track {
          position: relative;
          height: 12px;
          border-radius: 999px;
          cursor: pointer;
        }

        .sf-groove {
          position: absolute;
          inset: 0;
          border-radius: 999px;

          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.55) 0%,
            rgba(2, 6, 23, 0.90) 100%
          );

          border: 1px solid rgba(148, 163, 184, 0.12);
          box-shadow:
            inset 0 2px 6px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* Detents */
        .sf-detents {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .sf-tick {
          position: absolute;
          top: 50%;
          width: 1px;
          height: 10px;
          transform: translate(-0.5px, -50%);
          background: rgba(148, 163, 184, 0.18);
          box-shadow: 0 0 10px rgba(0,0,0,0.25);
        }

        .sf-tick--center {
          height: 12px;
          background: rgba(148, 163, 184, 0.28);
        }

        /* ============================================================
           FILL
           ============================================================ */
        .sf-fill {
          position: absolute;
          left: 0;
          top: 50%;
          height: 6px;
          transform: translateY(-50%);
          border-radius: 999px;
          width: 0%;

          background: linear-gradient(
            90deg,
            rgba(94,234,212,0.35) 0%,
            var(--sf-color) 55%,
            rgba(94,234,212,0.70) 100%
          );

          box-shadow:
            0 0 14px rgba(34, 211, 238, 0.22),
            0 0 26px rgba(34, 211, 238, 0.10);
          transition: filter 120ms ease;
        }

        .sf-slider--hl .sf-fill {
          filter: brightness(1.06);
          box-shadow:
            0 0 16px rgba(34, 211, 238, 0.30),
            0 0 34px rgba(34, 211, 238, 0.14);
        }

        /* ============================================================
           THUMB
           ============================================================ */
        .sf-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 18px;
          height: 18px;
          border-radius: 999px;
          pointer-events: none;
          left: 0%;

          background: radial-gradient(circle at 35% 35%,
            rgba(255,255,255,0.55) 0%,
            rgba(255,255,255,0.18) 35%,
            rgba(0,0,0,0) 70%
          );

          box-shadow:
            0 0 0 2px rgba(2, 6, 23, 0.75),
            0 0 18px rgba(34, 211, 238, 0.20);
        }

        .sf-thumbCore {
          position: absolute;
          inset: 4px;
          border-radius: 999px;

          background: radial-gradient(circle at 30% 30%,
            rgba(255,255,255,0.95) 0%,
            rgba(226,232,240,0.92) 35%,
            rgba(148,163,184,0.80) 100%
          );

          border: 1px solid rgba(148,163,184,0.35);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.35),
            0 0 12px rgba(34, 211, 238, 0.18);
        }

        .sf-slider--hl .sf-thumb {
          box-shadow:
            0 0 0 2px rgba(2, 6, 23, 0.75),
            0 0 24px rgba(34, 211, 238, 0.32);
        }

        /* ============================================================
           OPTIONAL LABELS (disabled in ControlDeck)
           ============================================================ */
        .sf-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          padding: 0 2px;
        }

        .sf-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.20em;
          color: rgba(148, 163, 184, 0.60);
          text-transform: uppercase;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .sf-label--center {
          color: rgba(148, 163, 184, 0.72);
        }
      `}</style>
    </div>
  );
});

export default Slider;
