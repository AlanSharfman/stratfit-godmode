// src/components/strategy-studio/LeverStack.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Lever Stack 2.0 (Structured Domain Groups)
// Growth · Pricing · Cost · Capital · Operations
// Each lever: Label, Baseline→Scenario, Delta Badge, Slider
// Institutional slider: 1px track, solid #00E0FF fill, 10px handle, no glow
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, memo } from "react";
import styles from "./StrategyStudio.module.css";
import type { LeverState } from "@/logic/calculateMetrics";

// ── Domain definitions ──────────────────────────────────────────────────

interface LeverDef {
  key: keyof LeverState;
  label: string;
}

interface DomainDef {
  id: string;
  title: string;
  levers: LeverDef[];
}

const DOMAINS: DomainDef[] = [
  {
    id: "growth",
    title: "Growth",
    levers: [
      { key: "demandStrength", label: "Demand Strength" },
      { key: "expansionVelocity", label: "Expansion Velocity" },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    levers: [
      { key: "pricingPower", label: "Pricing Power" },
    ],
  },
  {
    id: "cost",
    title: "Cost",
    levers: [
      { key: "costDiscipline", label: "Cost Discipline" },
      { key: "operatingDrag", label: "Operating Drag" },
    ],
  },
  {
    id: "capital",
    title: "Capital",
    levers: [
      { key: "marketVolatility", label: "Market Volatility" },
      { key: "executionRisk", label: "Execution Risk" },
      { key: "fundingPressure", label: "Funding Pressure" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    levers: [
      { key: "hiringIntensity", label: "Hiring Intensity" },
    ],
  },
];

// ── Default baseline values ─────────────────────────────────────────────

const BASELINE_DEFAULTS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

// ── Inline Slider (Two-Phase: Preview on Drag, Commit on Release) ───────

interface InlineSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  onDragStart?: () => void;
  onDragEnd?: (finalValue: number) => void;
}

const InlineSlider: React.FC<InlineSliderProps> = memo(({
  value,
  min = 0,
  max = 100,
  onChange,
  onDragStart,
  onDragEnd,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  const resolve = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + pct * (max - min));
    },
    [min, max, value]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = trackRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);

      // Phase 1: Signal drag start
      onDragStart?.();

      const resolved = resolve(e.clientX);
      lastValueRef.current = resolved;
      onChange(resolved);

      const onMove = (ev: PointerEvent) => {
        const v = resolve(ev.clientX);
        lastValueRef.current = v;
        onChange(v);
      };
      const onUp = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        // Phase 2: Signal drag end with final value
        onDragEnd?.(lastValueRef.current);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [onChange, resolve, onDragStart, onDragEnd]
  );

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div ref={trackRef} className={styles.sliderWrap} onPointerDown={handlePointerDown}>
      <div className={styles.sliderTrack} />
      <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
      <div className={styles.sliderHandle} style={{ left: `${pct}%` }} />
    </div>
  );
});

InlineSlider.displayName = "InlineSlider";

// ── Delta Badge ─────────────────────────────────────────────────────────

function DeltaBadge({ baseline, current }: { baseline: number; current: number }) {
  const diff = current - baseline;
  if (diff === 0) return <span className={`${styles.leverDelta} ${styles.leverDeltaZero}`}>—</span>;
  const sign = diff > 0 ? "+" : "";
  const cls = diff > 0 ? styles.leverDeltaPositive : styles.leverDeltaNegative;
  return <span className={`${styles.leverDelta} ${cls}`}>{sign}{diff}</span>;
}

// ── Main Component ──────────────────────────────────────────────────────

interface LeverStackProps {
  levers: LeverState;
  onLeverChange: (key: keyof LeverState, value: number) => void;
  onLeverDragStart?: (key: keyof LeverState) => void;
  onLeverDragEnd?: (key: keyof LeverState, finalValue: number) => void;
  readOnly?: boolean;
}

export const LeverStack: React.FC<LeverStackProps> = memo(({
  levers,
  onLeverChange,
  onLeverDragStart,
  onLeverDragEnd,
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(DOMAINS.map((d) => d.id))
  );

  const toggleDomain = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className={readOnly ? styles.leverReadOnly : undefined}>
      {DOMAINS.map((domain) => {
        const isOpen = expanded.has(domain.id);
        return (
          <div key={domain.id} className={styles.leverDomain}>
            <div
              className={styles.leverDomainHeader}
              onClick={() => toggleDomain(domain.id)}
            >
              <span className={styles.leverDomainTitle}>{domain.title}</span>
              <span className={isOpen ? styles.leverDomainChevronOpen : styles.leverDomainChevron}>
                ▾
              </span>
            </div>

            {isOpen && (
              <div className={styles.leverDomainBody}>
                {domain.levers.map((lever) => {
                  const baseline = BASELINE_DEFAULTS[lever.key];
                  const current = levers[lever.key];
                  return (
                    <div key={lever.key} className={styles.leverRow}>
                      <div className={styles.leverMeta}>
                        <span className={styles.leverLabel}>{lever.label}</span>
                        <div className={styles.leverValues}>
                          <span className={styles.leverBaseline}>{baseline}</span>
                          <span className={styles.leverArrow}>→</span>
                          <span className={styles.leverCurrent}>{current}</span>
                          <DeltaBadge baseline={baseline} current={current} />
                        </div>
                      </div>
                      <InlineSlider
                        value={current}
                        onChange={(v) => onLeverChange(lever.key, v)}
                        onDragStart={() => onLeverDragStart?.(lever.key)}
                        onDragEnd={(v) => onLeverDragEnd?.(lever.key, v)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

LeverStack.displayName = "LeverStack";

