// src/components/ControlDeck.tsx
// STRATFIT — GOD-MODE Control Deck matching reference exactly
// Features: Corner bumpers, individual slider wells, metallic frames

import React, { useMemo, useCallback, memo, useRef } from "react";
import Slider from "./ui/Slider";
import SliderInfoTooltip from "./ui/SliderInfoTooltip";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
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
// KPI MAPPING
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
// CORNER BUMPER COMPONENT
// ============================================================================

const CornerBumper = memo(function CornerBumper({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const posStyles: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8 },
    tr: { top: 8, right: 8 },
    bl: { bottom: 8, left: 8 },
    br: { bottom: 8, right: 8 },
  };
  
  return (
    <div className="corner-bumper" style={posStyles[position]}>
      <div className="bumper-outer" />
      <div className="bumper-inner" />
    </div>
  );
});

// ============================================================================
// INDIVIDUAL SLIDER WELL (each slider gets its own recessed slot)
// ============================================================================

interface SliderWellProps {
  slider: ControlSliderConfig;
  highlightColor: string | null;
  onStart: () => void;
  onEnd: () => void;
  onChange: (v: number) => void;
}

const SliderWell = memo(function SliderWell({
  slider,
  highlightColor,
  onStart,
  onEnd,
  onChange,
}: SliderWellProps) {
  const [tooltipRect, setTooltipRect] = React.useState<DOMRect | null>(null);

  return (
    <div className="slider-well">
      <div className="slider-well-inner">
        <div className="slider-header">
          <span className="slider-label">
            {slider.label}
            {slider.tooltip && (
              <span
                className="info-dot"
                onMouseEnter={(e) => setTooltipRect(e.currentTarget.getBoundingClientRect())}
                onMouseLeave={() => setTooltipRect(null)}
              >
                <span className="info-glyph">i</span>
              </span>
            )}
          </span>
          <span className="slider-value">
            {slider.format ? slider.format(slider.value) : `${slider.value}%`}
          </span>
        </div>
        
        {slider.tooltip && (
          <SliderInfoTooltip anchorRect={tooltipRect}>
            <div className="tt-title">{slider.label}</div>
            <div className="tt-desc">{slider.tooltip.description}</div>
            <div className="tt-impact">{slider.tooltip.impact}</div>
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
      </div>
    </div>
  );
});

// ============================================================================
// BEVELED SECTION FRAME
// ============================================================================

interface SectionFrameProps {
  title: string;
  children: React.ReactNode;
}

const SectionFrame = memo(function SectionFrame({ title, children }: SectionFrameProps) {
  return (
    <div className="section-frame">
      {/* Corner bumpers */}
      <CornerBumper position="tl" />
      <CornerBumper position="tr" />
      <CornerBumper position="bl" />
      <CornerBumper position="br" />
      
      {/* Header */}
      <div className="section-header">
        <span className="section-title">{title}</span>
        <div className="section-toggle">
          <div className="toggle-led" />
        </div>
      </div>
      
      {/* Slider wells container */}
      <div className="section-content">
        {children}
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
    (id: LeverId, value: number) => {
      lastLeverIdRef.current = id;
      const intensity = computeIntensity01(id, value);
      if (leverReleaseTimeoutRef.current !== null) {
        window.clearTimeout(leverReleaseTimeoutRef.current);
        leverReleaseTimeoutRef.current = null;
      }
      setActiveLever(id, intensity);
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
    <div className="control-deck-godmode">
      <div className="deck-scroll">
        {boxes.map((box) => (
          <SectionFrame key={box.id} title={box.title}>
            {box.sliders.map((s) => (
              <SliderWell
                key={s.id}
                slider={s}
                highlightColor={getHighlightColor(s.id)}
                onStart={() => handleSliderStart(s.id, s.value)}
                onEnd={handleSliderEnd}
                onChange={(v) => handleSliderChange(s.id, v)}
              />
            ))}
          </SectionFrame>
        ))}
      </div>

      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           CONTROL DECK CONTAINER
           ═══════════════════════════════════════════════════════════════ */
        
        .control-deck-godmode {
          width: 100%;
          min-width: 280px;
          max-width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .deck-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .deck-scroll::-webkit-scrollbar { width: 5px; }
        .deck-scroll::-webkit-scrollbar-track { background: transparent; }
        .deck-scroll::-webkit-scrollbar-thumb { 
          background: rgba(34,211,238,0.2); 
          border-radius: 3px; 
        }

        /* ═══════════════════════════════════════════════════════════════
           SECTION FRAME — Metallic beveled container
           ═══════════════════════════════════════════════════════════════ */
        
        .section-frame {
          position: relative;
          border-radius: 12px;
          padding: 4px;
          
          /* Charcoal outer shell */
          background: #1a1d21;
          
          border: 1px solid rgba(60, 65, 72, 0.5);
          
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }

        /* ═══════════════════════════════════════════════════════════════
           CORNER BUMPERS — Like hardware screws
           ═══════════════════════════════════════════════════════════════ */
        
        .corner-bumper {
          position: absolute;
          width: 10px;
          height: 10px;
          z-index: 5;
        }

        .bumper-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(145deg,
            rgba(80, 100, 130, 0.8) 0%,
            rgba(50, 65, 85, 0.9) 50%,
            rgba(35, 45, 60, 0.95) 100%
          );
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .bumper-inner {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border-radius: 50%;
          background: linear-gradient(145deg,
            rgba(30, 40, 55, 0.9) 0%,
            rgba(20, 28, 40, 1) 100%
          );
          box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        /* ═══════════════════════════════════════════════════════════════
           SECTION HEADER
           ═══════════════════════════════════════════════════════════════ */
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px 8px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .section-toggle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(15, 22, 32, 0.9);
          border: 1px solid rgba(60, 80, 100, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.4);
        }

        .toggle-led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow:
            0 0 4px #22d3ee,
            0 0 8px rgba(34, 211, 238, 0.5);
        }

        /* ═══════════════════════════════════════════════════════════════
           SECTION CONTENT — Container for slider wells
           ═══════════════════════════════════════════════════════════════ */
        
        .section-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 4px 4px 8px;
        }

        /* ═══════════════════════════════════════════════════════════════
           SLIDER WELL — Individual recessed slot for each slider
           ═══════════════════════════════════════════════════════════════ */
        
        .slider-well {
          border-radius: 10px;
          padding: 3px;
          
          /* Outer rim of well */
          background: linear-gradient(180deg,
            rgba(25, 32, 42, 0.9) 0%,
            rgba(35, 45, 58, 0.7) 50%,
            rgba(30, 38, 50, 0.8) 100%
          );
          
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 1px 0 rgba(0, 0, 0, 0.2);
        }

        .slider-well-inner {
          border-radius: 8px;
          padding: 12px 14px 10px;
          
          /* Deep recessed interior */
          background: linear-gradient(180deg,
            rgba(8, 12, 18, 0.98) 0%,
            rgba(12, 16, 24, 0.96) 50%,
            rgba(10, 14, 20, 0.97) 100%
          );
          
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.6),
            inset 0 1px 2px rgba(0, 0, 0, 0.4);
        }

        /* ═══════════════════════════════════════════════════════════════
           SLIDER HEADER & LABELS
           ═══════════════════════════════════════════════════════════════ */
        
        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .slider-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          /* God Mode: Underscore style for labels */
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
        }

        .slider-value {
          font-size: 13px;
          font-weight: 700;
          color: #22d3ee;
          font-variant-numeric: tabular-nums;
          /* God Mode: Monospace bright cyan with glow */
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
          text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
        }

        /* Info dot */
        .info-dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          cursor: pointer;
          background: rgba(20, 28, 40, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 150ms ease;
        }

        .info-dot:hover {
          border-color: rgba(34, 211, 238, 0.5);
          background: rgba(34, 211, 238, 0.1);
        }

        .info-glyph {
          font-size: 10px;
          font-weight: 700;
          font-style: italic;
          font-family: Georgia, serif;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1;
        }

        /* Tooltips */
        .tt-title {
          font-size: 10px;
          font-weight: 700;
          color: rgba(34, 211, 238, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 5px;
        }

        .tt-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .tt-impact {
          font-size: 10px;
          color: rgba(148, 163, 184, 0.6);
          font-style: italic;
          padding-top: 5px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
