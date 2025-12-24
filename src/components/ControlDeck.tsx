// src/components/ControlDeck.tsx
// STRATFIT — Control Deck matching reference design

import React, { useMemo, useCallback, memo } from "react";
import Slider from "./ui/Slider";
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

  return (
    <div 
      className={`slider-row ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--highlight-color": highlightColor || "#22d3ee" } as React.CSSProperties}
    >
      <div className="slider-header">
        <span className="slider-label">{slider.label}</span>
        <span className="slider-value">
          {slider.format ? slider.format(slider.value) : String(slider.value)}
        </span>
      </div>
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
          padding: 5px 0;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .slider-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.15s;
        }

        .slider-row.highlighted .slider-label {
          color: var(--highlight-color);
          text-shadow: 0 0 10px color-mix(in srgb, var(--highlight-color) 40%, transparent);
        }

        .slider-value {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.35);
          font-variant-numeric: tabular-nums;
          transition: color 0.15s;
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
        .control-box {
          padding: 12px 14px;
          background: #161b22;
          border-radius: 6px;
          border: 1px solid #30363d;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .control-box.highlighted {
          border-color: var(--box-color);
          box-shadow: 
            0 0 18px color-mix(in srgb, var(--box-color) 30%, transparent),
            inset 0 0 25px color-mix(in srgb, var(--box-color) 6%, transparent);
        }

        .box-header {
          margin-bottom: 8px;
        }

        .box-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.15s;
        }

        .control-box.highlighted .box-title {
          color: var(--box-color);
          text-shadow: 0 0 10px color-mix(in srgb, var(--box-color) 40%, transparent);
        }

        .box-sliders {
          display: flex;
          flex-direction: column;
          gap: 0;
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

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setActiveLever = useScenarioStore((s) => s.setActiveLever);

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

  const handleSliderStart = useCallback(
    (id: LeverId, value: number) => {
      const intensity = computeIntensity01(id, value);
      setActiveLever(id, intensity);
    },
    [computeIntensity01, setActiveLever]
  );

  const handleSliderEnd = useCallback(() => {
    setActiveLever(null, 0);
    onChange("__end__", 0);
  }, [setActiveLever, onChange]);

  const handleSliderChange = useCallback(
    (id: LeverId, v: number) => {
      const intensity = computeIntensity01(id, v);
      setActiveLever(id, intensity);
      onChange(id, v);
    },
    [computeIntensity01, setActiveLever, onChange]
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
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
