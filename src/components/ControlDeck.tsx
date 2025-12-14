// src/components/ControlDeck.tsx
// STRATFIT — Control Deck with Horizontal Layout Option
// Compact horizontal strip for bottom placement

import React, { useMemo, useState, useCallback, memo } from "react";
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
// CONSTANTS
// ============================================================================

const BOX_COLORS: Record<string, { accent: string; glow: string }> = {
  performance: { accent: "#22d3ee", glow: "rgba(34, 211, 238, 0.2)" },
  financial: { accent: "#a78bfa", glow: "rgba(167, 139, 250, 0.2)" },
  risk: { accent: "#fb7185", glow: "rgba(251, 113, 133, 0.2)" },
};

const LEVER_TO_KPI: Record<LeverId, number[]> = {
  revenueGrowth: [0, 1],
  pricingAdjustment: [0, 1, 6],
  marketingSpend: [0, 5],
  headcount: [3, 4],
  operatingExpenses: [3, 4, 2],
  churnSensitivity: [6, 0],
  fundingInjection: [2, 4],
};

const BOX_TO_KPIS: Record<string, number[]> = {
  performance: [0, 1, 5],
  financial: [2, 3, 4],
  risk: [6, 4],
};

// ============================================================================
// COMPACT SLIDER (for horizontal layout)
// ============================================================================

interface CompactSliderProps {
  slider: ControlSliderConfig;
  isHighlighted: boolean;
  accentColor: string;
  onStart: () => void;
  onEnd: () => void;
  onChange: (v: number) => void;
}

const CompactSlider = memo(function CompactSlider({
  slider,
  isHighlighted,
  accentColor,
  onStart,
  onEnd,
  onChange,
}: CompactSliderProps) {
  return (
    <div
      className={`compact-slider ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className="compact-header">
        <span className="compact-label">{slider.label}</span>
        <span className="compact-value">
          {slider.format ? slider.format(slider.value) : String(slider.value)}
        </span>
      </div>
      <Slider
        value={slider.value}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        highlight={isHighlighted}
        onStart={onStart}
        onEnd={onEnd}
        onChange={onChange}
      />

      <style>{`
        .compact-slider {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 100px;
          flex: 1;
        }

        .compact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .compact-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.15s;
        }

        .compact-slider.highlighted .compact-label {
          color: var(--accent);
        }

        .compact-value {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          font-variant-numeric: tabular-nums;
          transition: color 0.15s;
        }

        .compact-slider.highlighted .compact-value {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
});

// ============================================================================
// HORIZONTAL BOX (for horizontal layout)
// ============================================================================

interface HorizontalBoxProps {
  box: ControlBoxConfig;
  colors: { accent: string; glow: string };
  isHighlighted: boolean;
  hoveredKpiIndex: number | null;
  onSliderStart: (id: LeverId, value: number) => void;
  onSliderEnd: () => void;
  onSliderChange: (id: LeverId, value: number) => void;
}

const HorizontalBox = memo(function HorizontalBox({
  box,
  colors,
  isHighlighted,
  hoveredKpiIndex,
  onSliderStart,
  onSliderEnd,
  onSliderChange,
}: HorizontalBoxProps) {
  const isSliderHighlighted = useCallback(
    (sliderId: LeverId) => {
      if (hoveredKpiIndex === null) return false;
      const relatedKpis = LEVER_TO_KPI[sliderId] || [];
      return relatedKpis.includes(hoveredKpiIndex);
    },
    [hoveredKpiIndex]
  );

  return (
    <div
      className={`h-box ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--box-accent": colors.accent, "--box-glow": colors.glow } as React.CSSProperties}
    >
      <div className="h-box-border" />
      <div className="h-box-content">
        <div className="h-box-header">
          <div className={`h-box-dot ${isHighlighted ? "active" : ""}`} />
          <span className={`h-box-title ${isHighlighted ? "active" : ""}`}>{box.title}</span>
        </div>
        <div className="h-box-sliders">
          {box.sliders.map((s) => (
            <CompactSlider
              key={s.id}
              slider={s}
              isHighlighted={isSliderHighlighted(s.id)}
              accentColor={colors.accent}
              onStart={() => onSliderStart(s.id, s.value)}
              onEnd={onSliderEnd}
              onChange={(v) => onSliderChange(s.id, v)}
            />
          ))}
        </div>
      </div>

      <style>{`
        .h-box {
          position: relative;
          border-radius: 10px;
          flex: 1;
          min-width: 200px;
        }

        .h-box-border {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.15s ease;
        }

        .h-box.highlighted .h-box-border {
          border-color: var(--box-accent);
          box-shadow: 0 0 16px var(--box-glow);
        }

        .h-box-content {
          position: relative;
          z-index: 1;
          padding: 10px 12px;
          background: rgba(10, 12, 18, 0.9);
          border-radius: 10px;
          backdrop-filter: blur(12px);
        }

        .h-box-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .h-box-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.15s;
        }

        .h-box-dot.active {
          background: var(--box-accent);
          box-shadow: 0 0 6px var(--box-accent);
        }

        .h-box-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.15s;
        }

        .h-box-title.active {
          color: var(--box-accent);
        }

        .h-box-sliders {
          display: flex;
          gap: 16px;
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
  layout?: "vertical" | "horizontal";
}) {
  const { boxes, onChange, layout = "vertical" } = props;

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const setActiveLever = useScenarioStore((s) => s.setActiveLever);

  const [dragging, setDragging] = useState<LeverId | null>(null);

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

  const isBoxHighlighted = useCallback(
    (boxId: string) => {
      if (hoveredKpiIndex === null) return false;
      const relatedKpis = BOX_TO_KPIS[boxId] || [];
      return relatedKpis.includes(hoveredKpiIndex);
    },
    [hoveredKpiIndex]
  );

  const handleSliderStart = useCallback(
    (id: LeverId, value: number) => {
      setDragging(id);
      const intensity = computeIntensity01(id, value);
      setActiveLever(id, intensity);
    },
    [computeIntensity01, setActiveLever]
  );

  const handleSliderEnd = useCallback(() => {
    setDragging(null);
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

  // HORIZONTAL LAYOUT
  if (layout === "horizontal") {
    return (
      <div className="control-deck-horizontal">
        {boxes.map((box) => {
          const highlighted = isBoxHighlighted(box.id);
          const colors = BOX_COLORS[box.id] || BOX_COLORS.performance;

          return (
            <HorizontalBox
              key={box.id}
              box={box}
              colors={colors}
              isHighlighted={highlighted}
              hoveredKpiIndex={hoveredKpiIndex}
              onSliderStart={handleSliderStart}
              onSliderEnd={handleSliderEnd}
              onSliderChange={handleSliderChange}
            />
          );
        })}

        <style>{`
          .control-deck-horizontal {
            display: flex;
            gap: 12px;
            width: 100%;
          }

          @media (max-width: 900px) {
            .control-deck-horizontal {
              flex-wrap: wrap;
              gap: 8px;
            }
          }
        `}</style>
      </div>
    );
  }

  // VERTICAL LAYOUT (default)
  return (
    <div className="control-deck-vertical">
      {boxes.map((box) => {
        const highlighted = isBoxHighlighted(box.id);
        const colors = BOX_COLORS[box.id] || BOX_COLORS.performance;

        return (
          <div
            key={box.id}
            className={`v-box ${highlighted ? "highlighted" : ""}`}
            style={{ "--box-accent": colors.accent, "--box-glow": colors.glow } as React.CSSProperties}
          >
            <div className="v-box-border" />
            <div className="v-box-content">
              <div className="v-box-header">
                <div className={`v-box-dot ${highlighted ? "active" : ""}`} />
                <span className={`v-box-title ${highlighted ? "active" : ""}`}>{box.title}</span>
              </div>
              <div className="v-box-sliders">
                {box.sliders.map((s) => {
                  const sliderHighlighted =
                    hoveredKpiIndex !== null && (LEVER_TO_KPI[s.id] || []).includes(hoveredKpiIndex);

                  return (
                    <CompactSlider
                      key={s.id}
                      slider={s}
                      isHighlighted={sliderHighlighted}
                      accentColor={colors.accent}
                      onStart={() => handleSliderStart(s.id, s.value)}
                      onEnd={handleSliderEnd}
                      onChange={(v) => handleSliderChange(s.id, v)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        .control-deck-vertical {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .v-box {
          position: relative;
          border-radius: 12px;
        }

        .v-box-border {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.15s ease;
        }

        .v-box.highlighted .v-box-border {
          border-color: var(--box-accent);
          box-shadow: 0 0 20px var(--box-glow);
        }

        .v-box-content {
          position: relative;
          z-index: 1;
          padding: 14px;
          background: rgba(10, 12, 18, 0.9);
          border-radius: 12px;
          backdrop-filter: blur(12px);
        }

        .v-box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .v-box-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.15s;
        }

        .v-box-dot.active {
          background: var(--box-accent);
          box-shadow: 0 0 8px var(--box-accent);
        }

        .v-box-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.15s;
        }

        .v-box-title.active {
          color: var(--box-accent);
        }

        .v-box-sliders {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
