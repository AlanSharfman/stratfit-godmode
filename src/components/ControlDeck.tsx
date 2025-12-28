// src/components/ControlDeck.tsx
// STRATFIT — Control Deck matching reference design

import React, { useMemo, useCallback, memo, useRef } from "react";
import Slider from "./ui/Slider";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

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
// KPI INDEX TO COLOR MAPPING (matches KPIConsole order)
// 0: CASH, 1: BURN RATE, 2: RUNWAY, 3: ARR, 4: GROSS MARGIN, 5: RISK SCORE, 6: VALUATION
// ============================================================================

// MUST MATCH KPIConsole.tsx accentColor values exactly!
const KPI_COLORS: Record<number, string> = {
  0: "#00ffcc", // CASH - teal
  1: "#ff6b6b", // BURN RATE - red/coral (matches KPIConsole)
  2: "#00d4ff", // RUNWAY - cyan
  3: "#00ff88", // ARR - green
  4: "#00ff88", // GROSS MARGIN - green
  5: "#00ccff", // RISK SCORE - cyan (matches KPIConsole)
  6: "#00ddff", // VALUATION - cyan
};

// ============================================================================
// LEVER TO KPI MAPPING - Which sliders affect which KPIs (CORRECTED)
// Based on calculateMetrics() in App.tsx
// ============================================================================

const LEVER_TO_KPI: Record<LeverId, number[]> = {
  // GROWTH sliders
  revenueGrowth: [3, 4, 6],         // Demand Strength → ARR, GROSS MARGIN, VALUATION
  pricingAdjustment: [0, 3, 4, 6],  // Pricing Power → CASH, ARR, GROSS MARGIN, VALUATION
  marketingSpend: [3, 6],           // Expansion Velocity → ARR, VALUATION
  
  // EFFICIENCY sliders
  operatingExpenses: [0, 1, 2, 4],  // Cost Discipline → CASH, BURN RATE, RUNWAY, GROSS MARGIN
  headcount: [1, 2],                // Hiring Intensity → BURN RATE, RUNWAY
  cashSensitivity: [0, 1],          // Operating Drag → CASH, BURN RATE
  
  // RISK sliders
  churnSensitivity: [5, 6],         // Market Volatility → RISK SCORE, VALUATION
  fundingInjection: [2, 5],         // Execution Risk → RUNWAY, RISK SCORE
};

// ============================================================================
// SLIDER ROW
// ============================================================================

interface SliderRowProps {
  slider: ControlSliderConfig;
  highlightColor: string | null;
  onStart: () => void;
  onEnd: () => void;
  onChange: (v: number) => void;
}

const SliderRow = memo(function SliderRow({
  slider,
  highlightColor,
  onStart,
  onEnd,
  onChange,
}: SliderRowProps) {
  const isHighlighted = highlightColor !== null;
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div 
      className={`slider-row ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--highlight-color": highlightColor || "#22d3ee" } as React.CSSProperties}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="slider-header">
        <span className="slider-label">
          {slider.label}
          {slider.tooltip && (
            <svg className="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          )}
        </span>
        <span className="slider-value">
          {slider.format ? slider.format(slider.value) : String(slider.value)}
        </span>
      </div>
      
      {slider.tooltip && showTooltip && (
        <div className="lever-tooltip">
          <div className="tooltip-title">{slider.label}</div>
          <div className="tooltip-description">{slider.tooltip.description}</div>
          <div className="tooltip-impact">{slider.tooltip.impact}</div>
        </div>
      )}
      
      <Slider
        value={slider.value}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        highlightColor={highlightColor}
        onStart={onStart}
        onEnd={onEnd}
        onChange={onChange}
      />

      <style>{`
        /* ============================================
           SLIDER ROW — Matched to AI Insights
           Same spacing, font sizes, colors
        ============================================ */
        .slider-row {
          padding: 6px 0;
          position: relative;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .slider-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(226, 232, 240, 0.7);
          transition: color 150ms ease-out;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.02em;
        }

        .info-icon {
          opacity: 0.35;
          transition: opacity 0.15s;
        }

        .slider-row:hover .info-icon {
          opacity: 0.6;
        }

        .lever-tooltip {
          position: absolute;
          top: -8px;
          left: calc(100% + 12px);
          width: 240px;
          background: #14181e;
          border: 1px solid #1e2530;
          border-radius: 6px;
          padding: 12px;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .tooltip-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(34, 211, 238, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        .tooltip-description {
          font-size: 11px;
          color: rgba(226, 232, 240, 0.7);
          line-height: 1.45;
          margin-bottom: 8px;
        }

        .tooltip-impact {
          font-size: 10px;
          color: rgba(148, 163, 184, 0.55);
          font-style: italic;
          padding-top: 6px;
          border-top: 1px solid rgba(148, 163, 184, 0.10);
        }

        .slider-row.highlighted .slider-label {
          color: var(--highlight-color);
        }

        .slider-value {
          font-size: 11px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.7);
          font-variant-numeric: tabular-nums;
          transition: color 150ms ease-out;
        }

        .slider-row.highlighted .slider-value {
          color: var(--highlight-color);
        }
      `}</style>
    </div>
  );
});

// ============================================================================
// CONTROL BOX
// ============================================================================

interface ControlBoxProps {
  box: ControlBoxConfig;
  hoveredKpiIndex: number | null;
  onSliderStart: (id: LeverId, value: number) => void;
  onSliderEnd: () => void;
  onSliderChange: (id: LeverId, value: number) => void;
}

const ControlBox = memo(function ControlBox({
  box,
  hoveredKpiIndex,
  onSliderStart,
  onSliderEnd,
  onSliderChange,
}: ControlBoxProps) {
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

  const boxHighlightColor = useMemo(() => {
    for (const slider of box.sliders) {
      const color = getHighlightColor(slider.id);
      if (color) return color;
    }
    return null;
  }, [box.sliders, getHighlightColor]);

  const isBoxHighlighted = boxHighlightColor !== null;

  return (
    <div 
      className={`control-box ${isBoxHighlighted ? "highlighted" : ""}`}
      style={{ "--box-color": boxHighlightColor || "#22d3ee" } as React.CSSProperties}
    >
      <div className="box-header">
        <span className="box-title">{box.title}</span>
      </div>
      <div className="box-sliders">
        {box.sliders.map((s) => (
          <SliderRow
            key={s.id}
            slider={s}
            highlightColor={getHighlightColor(s.id)}
            onStart={() => onSliderStart(s.id, s.value)}
            onEnd={onSliderEnd}
            onChange={(v) => onSliderChange(s.id, v)}
          />
        ))}
      </div>

      <style>{`
        /* ============================================
           CONTROL BOX — Matched to AI Panel sections
           Same background, border, padding, colors
        ============================================ */
        .control-box {
          padding: 14px;
          background: rgba(30, 37, 48, 0.4);
          border-radius: 6px;
          border: none;
          transition: background 150ms ease-out;
          position: relative;
        }

        .control-box.highlighted {
          background: rgba(30, 37, 48, 0.55);
        }

        .box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.10);
        }

        .box-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(140, 160, 180, 0.7);
          transition: color 150ms ease-out;
        }

        .control-box.highlighted .box-title {
          color: var(--box-color);
        }

        .box-sliders {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
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
  const { boxes, onChange } = props;

  // Consolidated store selectors to prevent rerender cascades
  const { hoveredKpiIndex, setActiveLever } = useScenarioStore(
    useShallow((s) => ({
      hoveredKpiIndex: s.hoveredKpiIndex,
      setActiveLever: s.setActiveLever,
    }))
  );

  // Throttle lever intensity updates (16ms = ~60fps, prevents excessive store updates)
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
      return Math.max(0, Math.min(1, dist / span));
    },
    [rangeMap]
  );

  // Throttled lever update - batches rapid updates to prevent rerender cascades
  const throttledSetActiveLever = useCallback(
    (id: LeverId, intensity: number) => {
      const now = performance.now();
      // If enough time has passed, update immediately
      if (now - lastLeverUpdate.current > 32) {
        lastLeverUpdate.current = now;
        setActiveLever(id, intensity);
        return;
      }
      // Otherwise, schedule update for next frame
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
    (id: LeverId, value: number) => {
      const intensity = computeIntensity01(id, value);
      setActiveLever(id, intensity); // Immediate on start
    },
    [computeIntensity01, setActiveLever]
  );

  const handleSliderEnd = useCallback(() => {
    // Cancel any pending throttled update
    if (leverUpdateFrame.current !== null) {
      cancelAnimationFrame(leverUpdateFrame.current);
      leverUpdateFrame.current = null;
    }
    pendingLeverUpdate.current = null;
    setActiveLever(null, 0);
    onChange("__end__", 0);
  }, [setActiveLever, onChange]);

  const handleSliderChange = useCallback(
    (id: LeverId, v: number) => {
      // Throttle store updates, but always pass value change through
      throttledSetActiveLever(id, computeIntensity01(id, v));
      onChange(id, v);
    },
    [computeIntensity01, throttledSetActiveLever, onChange]
  );

  return (
    <div className="control-deck">
      {boxes.map((box) => (
        <ControlBox
          key={box.id}
          box={box}
          hoveredKpiIndex={hoveredKpiIndex}
          onSliderStart={handleSliderStart}
          onSliderEnd={handleSliderEnd}
          onSliderChange={handleSliderChange}
        />
      ))}

      <style>{`
        /* ============================================
           CONTROL DECK — Matched to AI Panel
           Same container styling for visual familiarity
        ============================================ */
        .control-deck {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #14181e;
          border: 1px solid #1e2530;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
        }

        .control-deck::-webkit-scrollbar {
          width: 3px;
        }

        .control-deck::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
