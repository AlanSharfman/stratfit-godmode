// src/components/ControlDeck.tsx
// STRATFIT — God-Mode Control Deck (REFERENCE PANEL RESTORE)
// Visual target: section cards + clean slider rows + LOW/NEUTRAL/HIGH + right % readout
// IMPORTANT: Lever pipeline preserved (no engine/sim changes).

import React, { useMemo, useCallback, memo, useRef } from "react";
import Slider from "./ui/Slider";
import SliderInfoTooltip from "./ui/SliderInfoTooltip";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";
import type { LeverId } from "@/logic/mountainPeakModel";
import { emitCausal } from "@/ui/causalEvents";

// ============================================================================
// TYPES
// ============================================================================
export interface ControlSliderConfig {
  id: LeverId;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  defaultValue?: number;
  tooltip?: {
    description: string;
    impact: string;
  };
}

export interface ControlBoxConfig {
  id: string;
  title: string;
  sliders: ControlSliderConfig[];
}

// ============================================================================
// KPI MAPPING (kept)
// ============================================================================
const KPI_COLORS: Record<number, string> = {
  0: "#00ffcc",
  1: "#ff6b6b",
  2: "#00d4ff",
  3: "#00ff88",
  4: "#00ff88",
  5: "#00ccff",
  6: "#00ddff",
};

const LEVER_TO_KPI: Record<LeverId, number[]> = {
  revenueGrowth: [3, 4, 6],
  pricingAdjustment: [0, 3, 4, 6],
  marketingSpend: [3, 6],
  operatingExpenses: [0, 1, 2, 4],
  headcount: [1, 2],
  cashSensitivity: [0, 1],
  churnSensitivity: [5, 6],
  fundingInjection: [2, 5],
};

// ============================================================================
// HELPERS
// ============================================================================
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function norm01(v: number, min: number, max: number) {
  const span = Math.max(1e-9, max - min);
  return clamp((v - min) / span, 0, 1);
}

function asPct(v: number, min: number, max: number) {
  return Math.round(norm01(v, min, max) * 100);
}

function formatBoxTitle(title: string) {
  return String(title || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

// ============================================================================
// SLIDER ROW (REFERENCE LOOK)
// ============================================================================
interface GodSliderRowProps {
  slider: ControlSliderConfig;
  boxId: string;
  highlightColor: string | null;
  isFocused: boolean;
  onStart: (boxId: string) => void;
  onEnd: () => void;
  onChange: (v: number) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const GodSliderRow = memo(function GodSliderRow({
  slider,
  boxId,
  highlightColor,
  isFocused,
  onStart,
  onEnd,
  onChange,
  onFocus,
  onBlur,
}: GodSliderRowProps) {
  const [tooltipRect, setTooltipRect] = React.useState<DOMRect | null>(null);

  const pct = asPct(slider.value, slider.min, slider.max);

  // Subtle accent: KPI-hover color or default cyan
  const accent = highlightColor ?? "rgba(94,234,212,0.85)";
  const accentSoft = highlightColor ? `${highlightColor}33` : "rgba(94,234,212,0.18)";

  return (
    <div className={`god-row ${isFocused ? "god-row--focused" : ""}`} style={{ ["--accent" as any]: accent, ["--accentSoft" as any]: accentSoft }}>
      <div className="god-row__top">
        <div className="god-row__label">
          <span className="god-row__labelText">{slider.label}</span>

          {slider.tooltip && (
            <span
              className="god-row__info"
              onMouseEnter={(e) => {
                setTooltipRect(e.currentTarget.getBoundingClientRect());
                onFocus(); // Oracle trigger on i icon only
              }}
              onMouseLeave={() => {
                setTooltipRect(null);
                onBlur();
              }}
              aria-label="Info"
              role="button"
            >
              i
            </span>
          )}
        </div>

        <div className="god-row__value">
          <span className="god-row__valueNum">{pct}</span>
          <span className="god-row__valueUnit">%</span>
        </div>
      </div>

      {slider.tooltip && (
        <SliderInfoTooltip anchorRect={tooltipRect}>
          <div className="tt-title">{slider.label}</div>
          <div className="tt-desc">{slider.tooltip.description}</div>
          <div className="tt-impact">{slider.tooltip.impact}</div>
        </SliderInfoTooltip>
      )}

      <div className="god-row__track">
        <Slider
          value={slider.value}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          highlightColor={highlightColor}
          onStart={() => onStart(boxId)}
          onEnd={onEnd}
          onChange={onChange}
        />
      </div>

      <div className="god-row__scale">
        <span>LOW</span>
        <span>NEUTRAL</span>
        <span>HIGH</span>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ControlDeck(props: {
  boxes: ControlBoxConfig[];
  onChange: (id: LeverId | "__end__", value: number) => void;
}) {
  const leverReleaseTimeoutRef = useRef<number | null>(null);
  const lastLeverIdRef = useRef<LeverId | null>(null);
  const { boxes, onChange } = props;

  const { hoveredKpiIndex, setActiveLever } = useScenarioStore(
    useShallow((s) => ({
      hoveredKpiIndex: s.hoveredKpiIndex,
      setActiveLever: s.setActiveLever,
    }))
  );

  // ORACLE PROTOCOL: Track focused lever for contextual intelligence
  const { focusedLever, setFocusedLever } = useUIStore(
    useShallow((s) => ({
      focusedLever: s.focusedLever,
      setFocusedLever: s.setFocusedLever,
    }))
  );

  const lastLeverUpdate = useRef<number>(0);
  const pendingLeverUpdate = useRef<{ id: LeverId; intensity: number } | null>(null);
  const leverUpdateFrame = useRef<number | null>(null);

  const rangeMap = useMemo(() => {
    const m = new Map<LeverId, { min: number; max: number; def: number }>();
    boxes.forEach((b) =>
      b.sliders.forEach((s) => {
        const def = Number.isFinite(s.defaultValue) ? (s.defaultValue as number) : s.value;
        m.set(s.id, { min: s.min, max: s.max, def });
      })
    );
    return m;
  }, [boxes]);

  const computeIntensity01 = useCallback(
    (id: LeverId, v: number) => {
      const r = rangeMap.get(id);
      if (!r) return 0;
      const span = Math.max(1e-6, r.max - r.min);
      const dist = Math.abs(v - r.def);
      return clamp(dist / span, 0, 1);
    },
    [rangeMap]
  );

  const throttledSetActiveLever = useCallback(
    (id: LeverId, intensity: number) => {
      const now = performance.now();
      if (now - lastLeverUpdate.current > 8) {
        lastLeverUpdate.current = now;
        setActiveLever(id, intensity);
        return;
      }
      pendingLeverUpdate.current = { id, intensity };
      if (leverUpdateFrame.current === null) {
        leverUpdateFrame.current = requestAnimationFrame(() => {
          if (pendingLeverUpdate.current) {
            setActiveLever(pendingLeverUpdate.current.id, pendingLeverUpdate.current.intensity);
            lastLeverUpdate.current = performance.now();
          }
          pendingLeverUpdate.current = null;
          leverUpdateFrame.current = null;
        });
      }
    },
    [setActiveLever]
  );

  const handleSliderStart = useCallback(
    (id: LeverId, value: number, boxId: string) => {
      lastLeverIdRef.current = id;
      const intensity = computeIntensity01(id, value);

      if (leverReleaseTimeoutRef.current !== null) {
        window.clearTimeout(leverReleaseTimeoutRef.current);
        leverReleaseTimeoutRef.current = null;
      }

      setActiveLever(id, intensity);

      const group = boxId as "growth" | "efficiency" | "risk";
      useUIStore.getState().startSlider(group);
    },
    [computeIntensity01, setActiveLever]
  );

  const handleSliderEnd = useCallback(() => {
    const lastId = lastLeverIdRef.current;
    if (lastId) {
      const leverType: "growth" | "efficiency" | "risk" | "pricing" =
        lastId === "pricingAdjustment"
          ? "pricing"
          : lastId === "operatingExpenses" || lastId === "headcount" || lastId === "cashSensitivity"
          ? "efficiency"
          : lastId === "churnSensitivity" || lastId === "fundingInjection"
          ? "risk"
          : "growth";

      const color =
        leverType === "growth"
          ? "rgba(34,211,238,0.18)"
          : leverType === "efficiency"
          ? "rgba(52,211,153,0.18)"
          : leverType === "pricing"
          ? "rgba(129,140,248,0.18)"
          : "rgba(251,113,133,0.16)";

      emitCausal({
        source: "slider_release",
        bandStyle: "solid",
        color,
        kpiIndices: LEVER_TO_KPI[lastId] ?? [],
      });
    }

    if (leverUpdateFrame.current !== null) {
      cancelAnimationFrame(leverUpdateFrame.current);
      leverUpdateFrame.current = null;
    }
    pendingLeverUpdate.current = null;

    if (leverReleaseTimeoutRef.current !== null) {
      window.clearTimeout(leverReleaseTimeoutRef.current);
    }

    leverReleaseTimeoutRef.current = window.setTimeout(() => {
      setActiveLever(null, 0);
      leverReleaseTimeoutRef.current = null;
    }, 50);

    onChange("__end__", 0);
    useUIStore.getState().endSlider();
  }, [setActiveLever, onChange]);

  const handleSliderChange = useCallback(
    (id: LeverId, v: number) => {
      lastLeverIdRef.current = id;
      throttledSetActiveLever(id, computeIntensity01(id, v));
      onChange(id, v);
    },
    [computeIntensity01, throttledSetActiveLever, onChange]
  );

  const getHighlightColor = useCallback(
    (sliderId: LeverId): string | null => {
      if (hoveredKpiIndex === null) return null;
      const relatedKpis = LEVER_TO_KPI[sliderId] || [];
      if (relatedKpis.includes(hoveredKpiIndex)) {
        return KPI_COLORS[hoveredKpiIndex] || "#22d3ee";
      }
      return null;
    },
    [hoveredKpiIndex]
  );

  return (
    <div className="god-deck">
      <div className="god-deck__scroll">
        {boxes.map((box) => (
          <div key={box.id} className="god-section">
            <div className="god-section__header">
              <span className="god-section__title">{formatBoxTitle(box.title)}</span>
              <span className="god-section__dot" />
            </div>

            <div className="god-section__body">
              {box.sliders.map((s) => (
                <GodSliderRow
                  key={s.id}
                  slider={s}
                  boxId={box.id}
                  highlightColor={getHighlightColor(s.id)}
                  isFocused={focusedLever === s.id}
                  onStart={(boxId) => handleSliderStart(s.id, s.value, boxId)}
                  onEnd={handleSliderEnd}
                  onChange={(v) => handleSliderChange(s.id, v)}
                  onFocus={() => setFocusedLever(s.id as any)}
                  onBlur={() => setFocusedLever(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        /* ============================================================
           OUTER SHELL (matches reference bezel)
           ============================================================ */
        .god-deck {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          padding: 12px;
          background: radial-gradient(120% 120% at 10% 0%, rgba(56,189,248,0.08) 0%, rgba(2,6,23,0.98) 55%, rgba(2,6,23,0.98) 100%);
          border: 1px solid rgba(148,163,184,0.10);
          box-shadow:
            0 18px 60px rgba(0,0,0,0.65),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .god-deck__scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 2px;
        }

        .god-deck__scroll::-webkit-scrollbar { width: 6px; }
        .god-deck__scroll::-webkit-scrollbar-track { background: transparent; }
        .god-deck__scroll::-webkit-scrollbar-thumb {
          background: rgba(94,234,212,0.18);
          border-radius: 999px;
        }

        /* ============================================================
           SECTION CARD
           ============================================================ */
        .god-section {
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(15,23,42,0.80) 0%, rgba(2,6,23,0.92) 100%);
          border: 1px solid rgba(94,234,212,0.10);
          box-shadow:
            0 10px 30px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.05);
          overflow: hidden;
        }

        .god-section__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(148,163,184,0.10);
        }

        .god-section__title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.35em;
          color: rgba(94,234,212,0.85);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .god-section__dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(94,234,212,0.18);
          border: 1px solid rgba(94,234,212,0.55);
          box-shadow: 0 0 14px rgba(94,234,212,0.35);
        }

        .god-section__body {
          padding: 12px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ============================================================
           ROW
           ============================================================ */
        .god-row {
          position: relative;
          border-radius: 12px;
          padding: 12px 12px 10px;
          background: linear-gradient(180deg, rgba(2,6,23,0.80) 0%, rgba(2,6,23,0.55) 100%);
          border: 1px solid rgba(148,163,184,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .god-row::before {
          content: "";
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 2px;
          border-radius: 999px;
          background: var(--accentSoft);
          opacity: 0.9;
        }

        .god-row--focused {
          border-color: rgba(94,234,212,0.25);
          box-shadow:
            0 0 0 1px rgba(94,234,212,0.10),
            0 0 24px rgba(94,234,212,0.10),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .god-row__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 12px;
        }

        .god-row__label {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .god-row__labelText {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(226,232,240,0.80);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .god-row__info {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: rgba(94,234,212,0.85);
          border: 1px solid rgba(94,234,212,0.35);
          background: rgba(94,234,212,0.08);
          cursor: help;
          box-shadow: 0 0 14px rgba(94,234,212,0.10);
          user-select: none;
        }

        .god-row__info:hover {
          border-color: rgba(94,234,212,0.75);
          box-shadow: 0 0 18px rgba(94,234,212,0.25);
          transform: translateY(-0.5px);
        }

        .god-row__value {
          display: flex;
          align-items: baseline;
          gap: 2px;
          min-width: 64px;
          justify-content: flex-end;
        }

        .god-row__valueNum {
          font-size: 22px;
          font-weight: 900;
          color: rgba(226,232,240,0.92);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          text-shadow: 0 0 20px rgba(94,234,212,0.08);
        }

        .god-row__valueUnit {
          font-size: 12px;
          font-weight: 800;
          color: rgba(148,163,184,0.65);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          transform: translateY(-2px);
        }

        .god-row__track {
          padding: 6px 2px 0;
        }

        .god-row__scale {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.20em;
          color: rgba(148,163,184,0.55);
          text-transform: uppercase;
          padding: 0 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        /* Tooltip inner styles (keep your existing classes) */
        .tt-title {
          font-size: 10px;
          font-weight: 800;
          color: rgba(94,234,212,0.90);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .tt-desc {
          font-size: 11px;
          color: rgba(226,232,240,0.78);
          line-height: 1.4;
          margin-bottom: 8px;
        }
        .tt-impact {
          font-size: 10px;
          color: rgba(148,163,184,0.60);
          font-style: italic;
          padding-top: 6px;
          border-top: 1px solid rgba(148,163,184,0.14);
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
