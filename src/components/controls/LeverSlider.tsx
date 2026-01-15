import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type LeverSliderProps = {
  id: string;
  label: string;
  value: number;              // canonical value from store
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;

  // called frequently, but THROTTLED by parent
  onChangeThrottled: (next: number) => void;

  // called once on release
  onCommit: (finalValue: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const LeverSlider = memo(function LeverSlider({
  id,
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChangeThrottled,
  onCommit,
}: LeverSliderProps) {
  // Local immediate UI state (thumb moves instantly with zero app re-render dependency)
  const [local, setLocal] = useState<number>(value);
  const isDraggingRef = useRef(false);

  // Keep local in sync when store changes externally (scenario switch/reset/etc.)
  useEffect(() => {
    if (!isDraggingRef.current) setLocal(value);
  }, [value]);

  const fmt = useMemo(() => format ?? ((n: number) => `${Math.round(n * 100)}%`), [format]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = clamp(Number(e.target.value), min, max);
      isDraggingRef.current = true;
      setLocal(next);                // immediate UI
      onChangeThrottled(next);       // throttled store write (parent)
    },
    [min, max, onChangeThrottled]
  );

  const commit = useCallback(() => {
    isDraggingRef.current = false;
    onCommit(local);                // final store write
  }, [local, onCommit]);

  const handlePointerUp = useCallback(() => commit(), [commit]);
  const handlePointerCancel = useCallback(() => commit(), [commit]);
  const handleBlur = useCallback(() => {
    // If user tabs away mid-drag, commit.
    if (isDraggingRef.current) commit();
  }, [commit]);

  return (
    <div className="leverRow" data-lever={id}>
      <div className="leverTop">
        <div className="leverLabel">{label}</div>
        <div className="leverValue">{fmt(local)}</div>
      </div>

      <input
        className="slider-track"
        type="range"
        value={local}
        min={min}
        max={max}
        step={step}
        onChange={handleInput}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onBlur={handleBlur}
      />
    </div>
  );
});


