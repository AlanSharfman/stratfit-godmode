// src/components/ControlDeck.tsx
// STRATFIT — Control Deck matching reference design

import React, { useMemo, useCallback, memo, useRef } from "react";
import Slider from "./ui/Slider";
import SliderInfoTooltip from "./ui/SliderInfoTooltip";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";
import { emitCausal } from "@/ui/causalEvents";
import { CommandDeckBezel } from "@/components/command/CommandDeckBezel";
import { SectionDivider, SectionSpacer } from "@/components/command/parts/SectionDivider";

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
  const [tooltipRect, setTooltipRect] = React.useState<DOMRect | null>(null);

  return (
    <div 
      className={`slider-row ${isHighlighted ? "highlighted" : ""}`}
      style={{ "--highlight-color": highlightColor || "#22d3ee" } as React.CSSProperties}
    >
      <div className="slider-header">
        <span className="slider-label">
          {slider.label}
          {slider.tooltip && (
            <span
              className="info-icon"
              onMouseEnter={(e) => setTooltipRect(e.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => setTooltipRect(null)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTooltipRect((prev) => (prev ? null : e.currentTarget.getBoundingClientRect()));
              }}
            >
              <span className="info-icon__glyph">i</span>
            </span>
          )}
        </span>
        <span className="slider-value">
          {slider.format ? slider.format(slider.value) : String(slider.value)}
        </span>
      </div>
      
      {slider.tooltip && (
        <SliderInfoTooltip anchorRect={tooltipRect}>
          <div className="tooltip-title">{slider.label}</div>
          <div className="tooltip-description">{slider.tooltip.description}</div>
          <div className="tooltip-impact">{slider.tooltip.impact}</div>
        </SliderInfoTooltip>
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
          font-size: 16.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          transition: all 80ms cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.03em;
        }

        .info-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          margin-left: 6px;
          border-radius: 50%;
          cursor: pointer;

          /* Visible white circle */
          background: rgba(12,16,22,0.75);
          border: 1.5px solid rgba(255,255,255,0.55);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 2px 6px rgba(0,0,0,0.40);

          transition: 
            transform 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease,
            background 140ms ease;
        }

        .info-icon:hover {
          transform: scale(1.12);
          border-color: rgba(255,255,255,0.75);
          background:
            radial-gradient(circle at 30% 30%, rgba(120,200,255,0.22), rgba(0,0,0,0) 60%),
            rgba(12,18,26,0.75);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 4px 12px rgba(0,0,0,0.45),
            0 0 12px rgba(120,200,255,0.15);
        }

        .info-icon__glyph {
          font-size: 11px;
          font-weight: 800;
          font-style: italic;
          font-family: "Georgia", serif;
          color: rgba(255,255,255,0.90);
          text-shadow: none;
          line-height: 1;
          transform: translateY(-0.5px);
        }

        .info-icon:hover .info-icon__glyph {
          color: #ffffff;
          text-shadow: 0 0 6px rgba(255,255,255,0.35);
        }

        .slider-row:hover .info-icon {
          /* no extra transform — hover state handles it */
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
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          font-variant-numeric: tabular-nums;
          transition: all 80ms cubic-bezier(0.22, 1, 0.36, 1);
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
          background: linear-gradient(135deg, rgba(20, 24, 30, 0.78), rgba(10, 12, 16, 0.70));
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 0 1px rgba(34, 211, 238, 0.1);
          transition: all 80ms cubic-bezier(0.22, 1, 0.36, 1);
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .box-title {
          font-size: 23px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #fff !important;
          opacity: 1 !important;
          text-align: center;
          width: 100%;
          display: block;
          text-shadow: 
            0 0 18px rgba(255, 255, 255, 0.45),
            0 0 5px rgba(255, 255, 255, 0.65),
            0 1px 2px rgba(0,0,0,0.6);
          transition: all 80ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .control-box.highlighted .box-title {
          /* KEEP WHITE — never let highlight color override the title */
          color: #fff !important;
          text-shadow: 
            0 0 20px rgba(255, 255, 255, 0.5),
            0 0 6px rgba(255, 255, 255, 0.7),
            0 1px 2px rgba(0,0,0,0.5);
        }

        .box-sliders {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;

          /* BLACK inner well (per reference) */
          background:
            radial-gradient(120% 140% at 18% 12%, rgba(255,255,255,0.06), rgba(0,0,0,0) 55%),
            linear-gradient(180deg, rgba(3,4,6,0.70), rgba(0,0,0,0.78));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -16px 28px rgba(0,0,0,0.60);
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
  const leverReleaseTimeoutRef = React.useRef<number | null>(null);
  const lastLeverIdRef = React.useRef<LeverId | null>(null);
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

  // Ultra-responsive lever update - minimal throttling for smooth feel
  const throttledSetActiveLever = useCallback(
    (id: LeverId, intensity: number) => {
      const now = performance.now();
      // Reduced throttle from 32ms to 8ms for smoother response
      if (now - lastLeverUpdate.current > 8) {
        lastLeverUpdate.current = now;
        setActiveLever(id, intensity);
        return;
      }
      // Schedule update for next animation frame (instant visual feedback)
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
      lastLeverIdRef.current = id;
      const intensity = computeIntensity01(id, value);
      // Cancel any pending release
      if (leverReleaseTimeoutRef.current !== null) {
        window.clearTimeout(leverReleaseTimeoutRef.current);
        leverReleaseTimeoutRef.current = null;
      }
      setActiveLever(id, intensity);
    },
    [computeIntensity01, setActiveLever]
  );

  const handleSliderEnd = useCallback(() => {
    // CAUSAL HIGHLIGHT — fire ONLY on release
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
          ? "rgba(34,211,238,0.18)" // cyan/ice
          : leverType === "efficiency"
            ? "rgba(52,211,153,0.18)" // emerald
            : leverType === "pricing"
              ? "rgba(129,140,248,0.18)" // indigo
              : "rgba(251,113,133,0.16)"; // muted red (risk)

      emitCausal({
        source: "slider_release",
        bandStyle: "solid",
        color,
        kpiIndices: LEVER_TO_KPI[lastId] ?? [],
      });
    }

    // Cancel any pending throttled update
    if (leverUpdateFrame.current !== null) {
      cancelAnimationFrame(leverUpdateFrame.current);
      leverUpdateFrame.current = null;
    }
    pendingLeverUpdate.current = null;
    // Cancel any pending release
    if (leverReleaseTimeoutRef.current !== null) {
      window.clearTimeout(leverReleaseTimeoutRef.current);
    }
    // Instant release for snappy feel
    leverReleaseTimeoutRef.current = window.setTimeout(() => {
      setActiveLever(null, 0);
      leverReleaseTimeoutRef.current = null;
    }, 50);
    onChange("__end__", 0);
  }, [setActiveLever, onChange]);

  const handleSliderChange = useCallback(
    (id: LeverId, v: number) => {
      lastLeverIdRef.current = id;
      // Throttle store updates, but always pass value change through
      throttledSetActiveLever(id, computeIntensity01(id, v));
      onChange(id, v);
    },
    [computeIntensity01, throttledSetActiveLever, onChange]
  );

  // Build highlight color function for sliders
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
    <CommandDeckBezel>
      {boxes.map((box, boxIndex) => (
        <React.Fragment key={box.id}>
          <SectionDivider title={box.title} />
          
          <div className="section-well">
            <div className="section-sliders">
              {box.sliders.map((s) => (
                <SliderRow
                  key={s.id}
                  slider={s}
                  highlightColor={getHighlightColor(s.id)}
                  onStart={() => handleSliderStart(s.id, s.value)}
                  onEnd={handleSliderEnd}
                  onChange={(v) => handleSliderChange(s.id, v)}
                />
              ))}
            </div>
          </div>
          
          {boxIndex < boxes.length - 1 && <SectionSpacer />}
        </React.Fragment>
      ))}

      <style>{`
        .section-well {
          padding: 10px 10px;
          border-radius: 14px;

          /* super subtle band — not a card */
          background:
            radial-gradient(120% 120% at 18% 12%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%),
            linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.10));

          border: 1px solid rgba(255,255,255,0.06);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 -16px 24px rgba(0,0,0,0.35);
        }

        .section-sliders {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 6px 4px;
        }
      `}</style>
    </CommandDeckBezel>
  );
}

export const ControlDeckStyles = ``;
