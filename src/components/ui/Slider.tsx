// src/components/ui/Slider.tsx
// STRATFIT — Ultra-responsive Slider (jitter-hardened)
// - Instant DOM visuals (no delay)
// - rAF-batched onChange (prevents parent/layout thrash)
// - Cached track rect during drag (avoids layout reads every move)
// - No thumb transition while dragging

import React, { useCallback, useEffect, useMemo, useRef, memo } from "react";

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

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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
  const draggingClassOn = useRef(false);

  const rectRef = useRef<DOMRect | null>(null);

  const rafId = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);
  const lastEmittedValue = useRef<number>(value);

  const isHighlighted = highlight || highlightColor !== null;
  const activeColor = highlightColor || "#22d3ee";

  const percentage = useMemo(() => {
    const span = Math.max(1e-9, max - min);
    return ((value - min) / span) * 100;
  }, [value, min, max]);

  const setDraggingVisual = useCallback((dragging: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    // avoid toggling class redundantly during pointermove
    if (draggingClassOn.current === dragging) return;
    draggingClassOn.current = dragging;
    track.classList.toggle("dragging", dragging);
  }, []);

  const updateVisuals = useCallback((pct: number) => {
    const p = Math.max(0, Math.min(100, pct));
    if (fillRef.current) fillRef.current.style.width = `${p}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${p}%`;
  }, []);

  // Keep visuals in sync when value changes externally (e.g. programmatic updates)
  useEffect(() => {
    // While dragging, visuals are driven directly by pointer.
    // Avoid fighting pointer updates with prop sync.
    if (isDragging.current) return;
    updateVisuals(percentage);
    lastEmittedValue.current = value;
  }, [percentage, updateVisuals, value]);

  const snap = useCallback(
    (raw: number) => {
      const s = Math.max(1e-9, step);
      const snapped = Math.round(raw / s) * s;
      // normalize floating point noise
      const cleaned = Number(snapped.toFixed(10));
      return Math.max(min, Math.min(max, cleaned));
    },
    [min, max, step]
  );

  const calculateFromClientX = useCallback(
    (clientX: number) => {
      const rect = rectRef.current ?? trackRef.current?.getBoundingClientRect();
      if (!rect) return value;

      const x = clientX - rect.left;
      const pct01 = clamp01(x / Math.max(1e-9, rect.width));
      const raw = min + pct01 * (max - min);
      return snap(raw);
    },
    [min, max, snap, value]
  );

  const flushRaf = useCallback(() => {
    rafId.current = null;
    if (pendingValue.current === null) return;

    const v = pendingValue.current;
    pendingValue.current = null;

    // Only emit when changed (prevents redundant parent updates)
    if (v !== lastEmittedValue.current) {
      lastEmittedValue.current = v;
      onChange(v);
    }
  }, [onChange]);

  const scheduleOnChange = useCallback(
    (v: number) => {
      pendingValue.current = v;
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(flushRaf);
    },
    [flushRaf]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();

      isDragging.current = true;
      setDraggingVisual(true);
      onStart?.();

      // Cache rect for the duration of the drag (no layout reads each move)
      rectRef.current = trackRef.current?.getBoundingClientRect() ?? null;

      // Capture pointer on the TRACK (not e.target), so moves stay consistent
      trackRef.current?.setPointerCapture(e.pointerId);

      const v = calculateFromClientX(e.clientX);
      const span = Math.max(1e-9, max - min);
      const pct = ((v - min) / span) * 100;

      updateVisuals(pct);
      scheduleOnChange(v);
    },
    [calculateFromClientX, max, min, onStart, scheduleOnChange, setDraggingVisual, updateVisuals]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;

      const v = calculateFromClientX(e.clientX);
      const span = Math.max(1e-9, max - min);
      const pct = ((v - min) / span) * 100;

      updateVisuals(pct);
      scheduleOnChange(v);
    },
    [calculateFromClientX, max, min, scheduleOnChange, updateVisuals]
  );

  const endDrag = useCallback(
    (pointerId?: number) => {
      if (!isDragging.current) return;

      isDragging.current = false;
      setDraggingVisual(false);

      rectRef.current = null;

      if (pointerId !== undefined) {
        try {
          trackRef.current?.releasePointerCapture(pointerId);
        } catch {
          // ignore if capture already released
        }
      }

      // Flush any pending value immediately at end of drag
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      flushRaf();

      onEnd?.();
    },
    [flushRaf, onEnd, setDraggingVisual]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

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
        onPointerCancel={handlePointerCancel}
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
          transform: translateX(-50%);
          box-shadow:
            0 0 16px rgba(34, 211, 238, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          will-change: left;
          transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* IMPORTANT: no left-transition while dragging (removes "jitter feel") */
        .slider-track.dragging .slider-thumb {
          transition: none !important;
        }

        .slider-track:active .slider-thumb {
          transform: translateX(-50%) scale(1.2);
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
      `}</style>
    </div>
  );
});

export default Slider;
