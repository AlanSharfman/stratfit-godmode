// src/components/ControlDeck.tsx
// STRATFIT — GOD-MODE Control Deck matching reference exactly
// Features: Corner bumpers, individual slider wells, metallic frames

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
  boxId: string;
  onStart: (boxId: string) => void;
  onEnd: () => void;
  onChange: (v: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
}

const SliderWell = memo(function SliderWell({
  slider,
  highlightColor,
  boxId,
  onStart,
  onEnd,
  onChange,
  onFocus,
  onBlur,
  isFocused,
}: SliderWellProps) {
  const [tooltipRect, setTooltipRect] = React.useState<DOMRect | null>(null);
  const [inputValue, setInputValue] = React.useState(String(slider.value));
  
  // Sync input when slider value changes externally
  React.useEffect(() => {
    setInputValue(String(slider.value));
  }, [slider.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numVal = parseFloat(inputValue);
    if (!isNaN(numVal)) {
      const clamped = Math.max(slider.min, Math.min(slider.max, numVal));
      onChange(clamped);
      setInputValue(String(clamped));
    } else {
      setInputValue(String(slider.value));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div 
      className={`slider-well ${isFocused ? 'slider-well-focused' : ''}`}
      /* REMOVED: onPointerEnter/Leave from whole slider — Oracle only triggers on "i" icon */
    >
      <div className="slider-well-inner">
        <div className="slider-header">
          <span className={`slider-label ${isFocused ? 'slider-label-focused' : ''}`}>
            {slider.label}
            {slider.tooltip && (
              <span
                className="info-dot"
                onMouseEnter={(e) => {
                  setTooltipRect(e.currentTarget.getBoundingClientRect());
                  onFocus();  // ORACLE TRIGGER: Only on "i" icon hover
                }}
                onMouseLeave={() => {
                  setTooltipRect(null);
                  onBlur();   // ORACLE DISMISS: Only on "i" icon leave
                }}
              >
                <span className="info-glyph">i</span>
              </span>
            )}
          </span>
        </div>
        
        {slider.tooltip && (
          <SliderInfoTooltip anchorRect={tooltipRect}>
            <div className="tt-title">{slider.label}</div>
            <div className="tt-desc">{slider.tooltip.description}</div>
            <div className="tt-impact">{slider.tooltip.impact}</div>
          </SliderInfoTooltip>
        )}
        
        {/* Slider + Digital Readout Row */}
        <div className="slider-track-row">
          <div className="slider-track-container">
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
          {/* Tactical Precision: Editable Digital Readout */}
          <div className="precision-readout">
            <input
              type="text"
              className="precision-input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onFocus={() => onStart(boxId)}
            />
            <span className="precision-unit">%</span>
          </div>
        </div>
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
    (id: LeverId, value: number, boxId: string) => {
      lastLeverIdRef.current = id;
      const intensity = computeIntensity01(id, value);
      if (leverReleaseTimeoutRef.current !== null) {
        window.clearTimeout(leverReleaseTimeoutRef.current);
        leverReleaseTimeoutRef.current = null;
      }
      setActiveLever(id, intensity);
      
      // HOLOGRAPHIC ACTIVATION: Project specific KPI card
      // - growth → MOMENTUM card
      // - efficiency → RESILIENCE card  
      // - risk → QUALITY card
      const group = boxId as 'growth' | 'efficiency' | 'risk';
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
    
    // HOLOGRAPHIC ACTIVATION: Start 10-second projection timer
    // Panel stays lit for 10 seconds after release
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
    <div className="control-deck-godmode">
      <div className="deck-scroll">
        {boxes.map((box) => (
          <SectionFrame key={box.id} title={box.title}>
            {box.sliders.map((s) => (
              <SliderWell
                key={s.id}
                slider={s}
                highlightColor={getHighlightColor(s.id)}
                boxId={box.id}
                onStart={(boxId) => handleSliderStart(s.id, s.value, boxId)}
                onEnd={handleSliderEnd}
                onChange={(v) => handleSliderChange(s.id, v)}
                onFocus={() => setFocusedLever(s.id as any)}
                onBlur={() => setFocusedLever(null)}
                isFocused={focusedLever === s.id}
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
          border-radius: 10px;
          padding: 3px;
          
          /* Deep titanium shell — "Bezel Strip" design */
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%);
          
          /* Single 1px border — no corner bolts */
          border: 1px solid rgba(255, 255, 255, 0.05);
          
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        
        /* Remove corner bumpers for cleaner bezel strip look */
        .section-frame .corner-bumper {
          display: none;
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
          padding: 8px 16px 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .section-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(34, 211, 238, 0.9);
          text-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .section-toggle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(2, 6, 23, 0.9);
          border: 1px solid rgba(34, 211, 238, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-led {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow:
            0 0 6px #22d3ee,
            0 0 12px rgba(34, 211, 238, 0.6);
          animation: led-pulse 2s ease-in-out infinite;
        }
        
        @keyframes led-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; box-shadow: 0 0 10px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.8); }
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
        
        /* ═══════════════════════════════════════════════════════════════
           ENERGY CHANNEL — Sleek track-focused slider design
           ═══════════════════════════════════════════════════════════════ */
        
        .slider-well {
          border-radius: 6px;
          padding: 2px;
          
          /* Minimal outer rim */
          background: transparent;
          border-left: 2px solid rgba(34, 211, 238, 0.1);
          transition: border-color 200ms ease;
        }
        
        .slider-well:hover {
          border-left-color: rgba(34, 211, 238, 0.4);
        }

        .slider-well-inner {
          border-radius: 4px;
          padding: 10px 12px 8px;
          
          /* Deep titanium interior */
          background: linear-gradient(180deg,
            rgba(2, 6, 23, 0.95) 0%,
            rgba(8, 12, 24, 0.92) 100%
          );
          
          position: relative;
          overflow: hidden;
        }
        
        /* Energy channel glow track */
        .slider-well-inner::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, 
            transparent 0%, 
            rgba(34, 211, 238, 0.3) 50%, 
            transparent 100%
          );
          opacity: 0;
          transition: opacity 200ms ease;
        }
        
        .slider-well:hover .slider-well-inner::before {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════
           ORACLE PROTOCOL — Focus State (Hover Intelligence)
           ═══════════════════════════════════════════════════════════════ */
        
        .slider-well-focused {
          background: linear-gradient(180deg,
            rgba(34, 211, 238, 0.15) 0%,
            rgba(34, 211, 238, 0.08) 50%,
            rgba(34, 211, 238, 0.12) 100%
          );
          box-shadow:
            0 0 15px rgba(34, 211, 238, 0.2),
            0 0 30px rgba(34, 211, 238, 0.1),
            inset 0 1px 0 rgba(34, 211, 238, 0.3);
          animation: oracle-pulse 2s ease-in-out infinite;
        }
        
        .slider-well-focused .slider-well-inner {
          border: 1px solid rgba(34, 211, 238, 0.3);
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.6),
            inset 0 0 20px rgba(34, 211, 238, 0.05);
        }
        
        .slider-label-focused {
          color: #ffffff !important;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }
        
        .slider-value-focused {
          color: #67e8f9 !important;
          text-shadow: 0 0 12px rgba(34, 211, 238, 0.8);
        }
        
        @keyframes oracle-pulse {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.2), 0 0 30px rgba(34, 211, 238, 0.1);
          }
          50% { 
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.35), 0 0 40px rgba(34, 211, 238, 0.2);
          }
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

        /* Info dot — THE ORACLE TRIGGER (hover for AI explanation) */
        .info-dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: help;  /* Help cursor indicates info */
          background: rgba(34, 211, 238, 0.08);
          border: 1px solid rgba(34, 211, 238, 0.3);
          transition: all 200ms ease;
          margin-left: 6px;
          position: relative;
        }

        .info-dot::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1px solid rgba(34, 211, 238, 0.15);
          animation: info-pulse 2s ease-in-out infinite;
        }

        @keyframes info-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }

        .info-dot:hover {
          border-color: rgba(34, 211, 238, 0.8);
          background: rgba(34, 211, 238, 0.2);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
          transform: scale(1.1);
        }

        .info-dot:hover::after {
          animation: none;
          opacity: 0;
        }

        .info-glyph {
          font-size: 10px;
          font-weight: 700;
          font-style: italic;
          font-family: Georgia, serif;
          color: rgba(34, 211, 238, 0.7);
          line-height: 1;
        }

        .info-dot:hover .info-glyph {
          color: #22d3ee;
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

        /* ═══════════════════════════════════════════════════════════════
           SLIDER TRACK ROW — Slider + Precision Input
           ═══════════════════════════════════════════════════════════════ */
        
        .slider-track-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slider-track-container {
          flex: 1;
          min-width: 0;
        }

        /* ═══════════════════════════════════════════════════════════════
           PRECISION INPUT — Tactical Digital Readout (Raw Data Style)
           ═══════════════════════════════════════════════════════════════ */
        
        .precision-input {
          width: 64px;
          flex-shrink: 0;
          padding: 4px 0;
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(0, 217, 255, 0.5);
          border-radius: 0;
          color: #ffffff;
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          text-align: right;
          outline: none;
          transition: all 150ms ease;
          text-shadow: 0 0 12px rgba(0, 217, 255, 0.4);
        }

        .precision-input:hover {
          border-bottom-color: rgba(0, 217, 255, 0.7);
          color: #00D9FF;
        }

        .precision-input:focus {
          border-bottom-color: #00D9FF;
          color: #00D9FF;
          text-shadow: 0 0 16px rgba(0, 217, 255, 0.6);
        }

        .precision-input::selection {
          background: rgba(0, 217, 255, 0.3);
        }

        /* Precision readout wrapper */
        .precision-readout {
          display: flex;
          align-items: baseline;
          gap: 2px;
          flex-shrink: 0;
        }

        .precision-unit {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.35);
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
