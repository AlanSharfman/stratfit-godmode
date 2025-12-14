// src/components/ControlDeck.tsx
// STRATFIT — Premium Sliders with BIGGER FONTS and REAL BORDERS

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

// Box colors
const BOX_COLORS: Record<string, { accent: string; glow: string }> = {
  performance: { accent: "#22d3ee", glow: "rgba(34, 211, 238, 0.3)" },
  financial: { accent: "#a78bfa", glow: "rgba(167, 139, 250, 0.3)" },
  risk: { accent: "#fb7185", glow: "rgba(251, 113, 133, 0.3)" },
};

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
        const colors = BOX_COLORS[box.id] || BOX_COLORS.performance;
        
        return (
          <div
            key={box.id}
            className={`control-box ${highlighted ? 'highlighted' : ''}`}
            style={{
              "--box-accent": colors.accent,
              "--box-glow": colors.glow,
            } as React.CSSProperties}
          >
            {/* Premium border */}
            <div className={`control-box-border ${highlighted ? 'active' : ''}`} />
            
            {/* Content */}
            <div className="control-box-inner">
              {/* Title */}
              <div className="control-box-header">
                <div className={`control-box-indicator ${highlighted ? 'active' : ''}`} />
                <span className={`control-box-title ${highlighted ? 'active' : ''}`}>
                  {box.title}
                </span>
              </div>

              <div className="control-sliders">
                {box.sliders.map((s) => {
                  const isActive = activeLeverId === s.id && dragging === s.id;
                  const sliderHighlighted = isSliderHighlighted(s.id);

                  return (
                    <div 
                      key={s.id} 
                      className={`control-slider ${sliderHighlighted ? 'highlighted' : ''}`}
                    >
                      <div className="slider-header">
                        <span className={`slider-label ${sliderHighlighted ? 'highlighted' : ''}`}>
                          {s.label}
                        </span>
                        <span className={`slider-value ${sliderHighlighted ? 'highlighted' : ''}`}>
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        .control-deck {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .control-box {
          position: relative;
          border-radius: 16px;
          padding: 2px;
        }

        /* PREMIUM BORDER */
        .control-box-border {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 40%,
            rgba(255, 255, 255, 0.05) 60%,
            rgba(255, 255, 255, 0.15) 100%
          );
          transition: all 0.3s ease;
        }

        .control-box-border.active {
          background: linear-gradient(
            160deg,
            var(--box-accent) 0%,
            transparent 30%,
            transparent 70%,
            var(--box-accent) 100%
          );
          box-shadow: 
            0 0 25px var(--box-glow),
            inset 0 0 1px var(--box-accent);
        }

        .control-box-inner {
          position: relative;
          z-index: 1;
          padding: 18px 20px;
          background: rgba(11, 14, 20, 0.9);
          border-radius: 14px;
          backdrop-filter: blur(16px);
        }

        .control-box-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .control-box-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          transition: all 0.3s ease;
        }

        .control-box-indicator.active {
          background: var(--box-accent);
          box-shadow: 0 0 10px var(--box-accent);
        }

        .control-box-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }

        .control-box-title.active {
          color: var(--box-accent);
        }

        .control-sliders {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .control-slider {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          transition: all 0.2s ease;
        }

        .control-slider.highlighted {
          background: rgba(255, 255, 255, 0.03);
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* BIGGER FONTS */
        .slider-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          transition: all 0.2s ease;
        }

        .slider-label.highlighted {
          color: #fff;
        }

        .slider-value {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          font-variant-numeric: tabular-nums;
          transition: all 0.2s ease;
        }

        .slider-value.highlighted {
          color: var(--box-accent);
        }
      `}</style>
    </div>
  );
}

export const ControlDeckStyles = ``;
