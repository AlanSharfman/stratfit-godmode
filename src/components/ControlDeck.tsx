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
        .slider-row {
          padding: 8px 0;
          position: relative;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .slider-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.03em;
        }

        .info-icon {
          opacity: 0.4;
          transition: opacity 0.15s;
        }

        .slider-row:hover .info-icon {
          opacity: 0.7;
        }

        .lever-tooltip {
          position: absolute;
          top: -8px;
          left: calc(100% + 12px);
          width: 280px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 12px;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.1);
          backdrop-filter: blur(12px);
          pointer-events: none;
        }

        .tooltip-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(34, 211, 238, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .tooltip-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .tooltip-impact {
          font-size: 10px;
          color: rgba(148, 163, 184, 0.7);
          font-style: italic;
          padding-top: 6px;
          border-top: 1px solid rgba(148, 163, 184, 0.15);
        }

        .slider-row.highlighted .slider-label {
          color: var(--highlight-color);
          text-shadow: 0 0 10px color-mix(in srgb, var(--highlight-color) 40%, transparent);
        }

        .slider-value {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          font-variant-numeric: tabular-nums;
          transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }

        .slider-row.highlighted .slider-value {
          color: var(--highlight-color);
          text-shadow: 0 0 15px color-mix(in srgb, var(--highlight-color) 50%, transparent);
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
        .control-box {
          padding: 18px 20px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85));
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 2px solid rgba(34, 211, 238, 0.25);
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 0 1px rgba(34, 211, 238, 0.1);
          transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        .control-box::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(124, 58, 237, 0.1));
          border-radius: 12px;
          opacity: 0;
          transition: opacity 250ms cubic-bezier(0.22, 1, 0.36, 1);
          z-index: -1;
        }

        .control-box.highlighted::before {
          opacity: 1;
        }

        .control-box.highlighted {
          border-color: var(--box-color);
          box-shadow: 
            0 8px 32px color-mix(in srgb, var(--box-color) 30%, transparent),
            0 0 40px color-mix(in srgb, var(--box-color) 20%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 0 30px color-mix(in srgb, var(--box-color) 8%, transparent);
          transform: translateY(-2px);
        }

        .box-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(34, 211, 238, 0.2);
        }

        .box-title {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
          transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .control-box.highlighted .box-title {
          color: var(--box-color);
          text-shadow: 0 0 25px color-mix(in srgb, var(--box-color) 60%, transparent);
        }

        .box-sliders {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
        .control-deck {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
