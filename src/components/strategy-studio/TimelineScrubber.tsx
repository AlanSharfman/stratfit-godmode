// src/components/strategy-studio/TimelineScrubber.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Scrub Bar
// Dynamic month range (12–60) · Adaptive tick spacing · Cyan indicator dot
// Dragging updates displayed simulation slice
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useMemo, memo } from "react";
import styles from "./StrategyStudio.module.css";

interface TimelineScrubberProps {
  /** Total months in range */
  maxMonths?: number;
  /** Currently selected month */
  currentMonth: number;
  /** Called when user scrubs to a new month */
  onChange: (month: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = memo(({
  maxMonths = 36,
  currentMonth,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const monthToPercent = (m: number) => (m / maxMonths) * 100;

  const resolveMonth = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return currentMonth;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(pct * maxMonths);
    },
    [maxMonths, currentMonth]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = trackRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      onChange(resolveMonth(e.clientX));

      const onMove = (ev: PointerEvent) => onChange(resolveMonth(ev.clientX));
      const onUp = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
    },
    [onChange, resolveMonth]
  );

  // Adaptive tick interval: 6mo for ≤36, 12mo for 60
  const tickInterval = maxMonths > 36 ? 12 : 6;

  // Build tick marks
  const ticks: number[] = useMemo(() => {
    const t: number[] = [];
    for (let m = 0; m <= maxMonths; m += tickInterval) {
      t.push(m);
    }
    return t;
  }, [maxMonths, tickInterval]);

  return (
    <div className={styles.timelineBar}>
      <span className={styles.timelineLabel}>Timeline</span>

      <div
        ref={trackRef}
        className={styles.timelineTrack}
        onPointerDown={handlePointerDown}
      >
        {/* Rail */}
        <div className={styles.timelineRail} />

        {/* Active fill */}
        <div
          className={styles.timelineFill}
          style={{ width: `${monthToPercent(currentMonth)}%` }}
        />

        {/* Tick marks + labels */}
        {ticks.map((m) => (
          <React.Fragment key={m}>
            <div
              className={styles.timelineTick}
              style={{ left: `${monthToPercent(m)}%` }}
            />
            <span
              className={styles.timelineTickLabel}
              style={{ left: `${monthToPercent(m)}%` }}
            >
              {m}
            </span>
          </React.Fragment>
        ))}

        {/* Cyan indicator dot */}
        <div
          className={styles.timelineDot}
          style={{ left: `${monthToPercent(currentMonth)}%` }}
        />
      </div>

      <span className={styles.timelineMonth}>{currentMonth}mo</span>
    </div>
  );
});

TimelineScrubber.displayName = "TimelineScrubber";

