// src/components/ControlDeck.tsx
// STRATFIT — Premium Slider Panels with THICK DISTINCT BORDERS

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
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

// Lever to KPI mapping
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

// Box accent colors
const BOX_COLORS: Record<string, string> = {
  performance: "#22d3ee", // Cyan
  financial: "#a78bfa",   // Purple
  risk: "#fb7185",        // Pink
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ControlDeck(props: {
  boxes: ControlBoxConfig[];
  onChange: (id: LeverId | "__end__", value: number) => void;
}) {
  const { boxes, onChange } = props;

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
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

  const [dragging, setDragging] = useState<LeverId | null>(null);

  const computeIntensity01 = (id: LeverId, v: number) => {
    const r = rangeMap.get(id);
    if (!r) return 0;
    const span = Math.max(1e-6, r.max - r.min);
    const dist = Math.abs(v - r.def);
    return Math.max(0, Math.min(1, dist / span));
  };

  const isBoxHighlighted = (boxId: string) => {
    if (hoveredKpiIndex === null) return false;
    const relatedKpis = BOX_TO_KPIS[boxId] || [];
    return relatedKpis.includes(hoveredKpiIndex);
  };

  const isSliderHighlighted = (sliderId: LeverId) => {
    if (hoveredKpiIndex === null) return false;
    const relatedKpis = LEVER_TO_KPI[sliderId] || [];
    return relatedKpis.includes(hoveredKpiIndex);
  };

  return (
    <div className="control-deck">
      {boxes.map((box) => {
        const highlighted = isBoxHighlighted(box.id);
        const boxColor = BOX_COLORS[box.id] || "#22d3ee";
        
        return (
          <motion.div
            key={box.id}
            className={`control-box ${highlighted ? 'highlighted' : ''}`}
            animate={{
              scale: highlighted ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
            style={{
              "--box-color": boxColor,
              "--box-glow": highlighted ? boxColor : "transparent",
            } as React.CSSProperties}
          >
            {/* THICK gradient border */}
            <div className={`control-box-border ${highlighted ? 'active' : ''}`} />
            
            {/* Content */}
            <div className="control-box-inner">
              {/* Title with icon indicator */}
              <div className="control-box-header">
                <motion.div 
                  className="control-box-indicator"
                  animate={{
                    backgroundColor: highlighted ? boxColor : "rgba(255,255,255,0.3)",
                    boxShadow: highlighted ? `0 0 12px ${boxColor}` : "none",
                  }}
                />
                <span className={`control-box-title ${highlighted ? 'highlighted' : ''}`}>
                  {box.title}
                </span>
              </div>

              <div className="control-sliders">
                {box.sliders.map((s) => {
                  const isActive = activeLeverId === s.id && dragging === s.id;
                  const sliderHighlighted = isSliderHighlighted(s.id);

                  return (
                    <motion.div 
                      key={s.id} 
                      className={`control-slider ${sliderHighlighted ? 'highlighted' : ''}`}
                      animate={{
                        backgroundColor: sliderHighlighted 
                          ? `${boxColor}15`
                          : 'transparent',
                        borderColor: sliderHighlighted 
                          ? `${boxColor}40`
                          : 'transparent',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="slider-header">
                        <span className={`slider-label ${sliderHighlighted ? 'highlighted' : ''}`}>
                          {s.label}
                        </span>
                        <span 
                          className={`slider-value ${sliderHighlighted ? 'highlighted' : ''}`}
                          style={{ color: sliderHighlighted ? boxColor : undefined }}
                        >
                          {s.format ? s.format(s.value) : String(s.value)}
                        </span>
                      </div>

                      <Slider
                        value={s.value}
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        highlight={isActive || sliderHighlighted}
                        onStart={() => {
                          setDragging(s.id);
                          const intensity = computeIntensity01(s.id, s.value);
                          setActiveLever(s.id, intensity);
                        }}
                        onEnd={() => {
                          setDragging(null);
                          setActiveLever(null, 0);
                          onChange("__end__", 0);
                        }}
                        onChange={(v) => {
                          const intensity = computeIntensity01(s.id, v);
                          setActiveLever(s.id, intensity);
                          onChange(s.id, v);
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}

      <style>{`
        .control-deck {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .control-box {
          position: relative;
          border-radius: 16px;
          padding: 3px;
          transition: all 0.3s ease;
        }

        /* THICK DISTINCT BORDER */
        .control-box-border {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            rgba(255,255,255,0.15) 0%,
            rgba(255,255,255,0.05) 30%,
            rgba(255,255,255,0.02) 50%,
            rgba(255,255,255,0.05) 70%,
            rgba(255,255,255,0.15) 100%
          );
          z-index: 0;
          transition: all 0.3s ease;
        }

        .control-box-border.active {
          background: linear-gradient(
            145deg,
            var(--box-color) 0%,
            transparent 30%,
            transparent 70%,
            var(--box-color) 100%
          );
          box-shadow: 
            0 0 20px var(--box-glow),
            0 0 40px var(--box-glow),
            inset 0 0 2px var(--box-color);
        }

        .control-box.highlighted {
          box-shadow: 
            0 0 30px var(--box-glow),
            0 8px 32px rgba(0,0,0,0.4);
        }

        .control-box-inner {
          position: relative;
          z-index: 1;
          padding: 16px;
          background: linear-gradient(
            160deg,
            rgba(15, 20, 30, 0.95) 0%,
            rgba(10, 14, 22, 0.98) 100%
          );
          border-radius: 14px;
          backdrop-filter: blur(12px);
        }

        .control-box-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .control-box-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transition: all 0.3s ease;
        }

        .control-box-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          transition: all 0.3s ease;
        }

        .control-box-title.highlighted {
          color: var(--box-color);
          text-shadow: 0 0 12px var(--box-glow);
        }

        .control-sliders {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-slider {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: all 0.25s ease;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }

        .slider-label.highlighted {
          color: #fff;
          text-shadow: 0 0 8px rgba(255,255,255,0.3);
        }

        .slider-value {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          font-variant-numeric: tabular-nums;
          transition: all 0.2s ease;
        }

        .slider-value.highlighted {
          color: var(--box-color);
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
