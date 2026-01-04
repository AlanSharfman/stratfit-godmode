// src/components/KPIConsole.tsx
import "./kpiConsole.css";
// STRATFIT — Executive Command Console
// World-class KPI instrument panel with terrain + lever linkage

import React, { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import BurnTrendBars from "./BurnTrendBars";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// KPI CONFIGURATION — CANONICAL SET (LOCKED)
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;

  import React from 'react';
  import './KPIConsole.css';

  interface KPIModuleProps {
    label: string;
    value: string;
    unit?: string;
    status?: 'neutral' | 'positive' | 'risk';
  }

  const KPIModule: React.FC<KPIModuleProps> = ({ label, value, unit, status = 'neutral' }) => {
    // Special rendering for the Risk card
    if (status === 'risk') {
      return (
        <div className={`stratfit-module ${status}`}>
          <div className="module-shell">
            <div className="status-light-pipe" />
            <div className="inner-well">
              <div className="module-content">
                <header className="module-header">
                  <span className="label-text">STRATEGIC RISK</span>
                </header>
                <div className="health-gauge-container">
                  <div className="main-display">
                    <span className="value-text">{value}</span>
                    <span className="unit-text">{unit}</span>
                  </div>
                  {/* Precision Hardware Gauge */}
                  <div className="hardware-gauge">
                    <div className="gauge-track"></div>
                    <div className="gauge-fill" style={{ width: `${value}`.replace(/[^\d.]/g, '') + '%' }}></div>
                  </div>
                </div>
                <span className="scenario-label">SCENARIO: OPTIMISTIC</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Default rendering for all other cards
    return (
      <div className={`stratfit-module ${status}`}>
        <div className="module-shell">
          <div className="status-light-pipe" />
          <div className="inner-well">
            <div className="module-content">
              <header className="module-header">
                <span className="label-text">{label}</span>
              </header>
              <main className="module-display">
                <span className="value-text">{value}</span>
                {unit && <span className="unit-text">{unit}</span>}
              </main>
              <div className="glass-etching">
                <svg viewBox="0 0 100 20" className="sparkline-svg">
                  <path d="M0 15 L20 18 L40 12 L60 14 L80 5 L100 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export const KPIConsole: React.FC = () => {
    const kpis: KPIModuleProps[] = [
      { label: "CASH POSITION", value: "$0.0", unit: "M" },
      { label: "BURN RATE", value: "$54", unit: "K/mo" },
      { label: "RUNWAY", value: "22", unit: "mo", status: 'positive' },
      { label: "ARR", value: "$5.5", unit: "M" },
      { label: "GROSS MARGIN", value: "50", unit: "%" },
      { label: "RISK SCORE", value: "19", unit: "/100", status: 'risk' },
      { label: "ENT. VALUE", value: "$5.0", unit: "M" },
    ];

    return (
      <div className="stratfit-chassis">
        {kpis.map((kpi, i) => (
          <KPIModule key={i} {...kpi} />
        ))}
      </div>
    );
  };
            {cfg.unit && <span className="value-unit">{cfg.unit}</span>}
          </div>
          
          {/* Visual widget */}
          <div className="instrument-visual">
            <InstrumentWidget 
              type={cfg.widgetType} 
              value={data?.value ?? 0} 
              state={state}
              burnAmount={burnAmount}
              cashAmount={cashAmount}
            />
          </div>
        </div>
      </div>
      
      {/* Neon glow layer */}
      <div className="instrument-glow" />
      
      {/* Focus indicator ring */}
      {state === "active" && <div className="focus-ring" />}
    </div>
  );
});

// ============================================================================
// MAIN CONSOLE COMPONENT
// ============================================================================

export default function KPIConsole() {
  // Subscribe only to specific values needed, not the entire engineResults object
  const { activeScenarioId, scenario, hoveredKpiIndex, setHoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      scenario: s.scenario,
      hoveredKpiIndex: s.hoveredKpiIndex,
      setHoveredKpiIndex: s.setHoveredKpiIndex,
    }))
  );
  
  // Subscribe to KPI values for active scenario only (avoids rerender on other scenario updates)
  const kpiValues = useScenarioStore((s) => s.engineResults[s.activeScenarioId]?.kpis || {});
  
  const scenarioColor = SCENARIO_COLORS[scenario].primary;
  const [localHoverIndex, setLocalHoverIndex] = useState<number | null>(null);

  // Stable callback for clearing local hover
  const handleMouseLeave = useCallback(() => setLocalHoverIndex(null), []);

  const isAnyActive = hoveredKpiIndex !== null;

  return (
    <div className="kpi-command-console">
      {/* Command Console Container */}
      <div className="console-container">
        {/* Ambient backdrop layer */}
        <div className="console-backdrop" />
        
        {/* KPI Instrument Grid */}
        <div className="instrument-grid">
          {KPI_CONFIG.map((cfg, index) => {
            const data = kpiValues[cfg.kpiKey as keyof typeof kpiValues];
            const isActive = hoveredKpiIndex === index;
            const isHovered = localHoverIndex === index && !isActive;
            const isDimmed = isAnyActive && !isActive;
            const state: "idle" | "hover" | "active" = isActive ? "active" : isHovered ? "hover" : "idle";

            return (
              <KPIInstrumentCard
                key={cfg.id}
                cfg={cfg}
                data={data}
                state={state}
                isDimmed={isDimmed}
                accentColor={isActive ? scenarioColor : cfg.accentColor}
                onClick={() => setHoveredKpiIndex(hoveredKpiIndex === index ? null : index)}
                onMouseEnter={() => setLocalHoverIndex(index)}
                onMouseLeave={handleMouseLeave}
                burnAmount={cfg.id === "burn" ? (kpiValues.burnQuality?.value ?? 0) * 1000 : undefined}
                cashAmount={cfg.id === "burn" ? (kpiValues.cashPosition?.value ?? 0) * 100000 : undefined}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        /* ============================================
           COMMAND CONSOLE — TOP LEVEL
           ============================================ */
        .kpi-command-console {
          width: 100%;
          padding: 0;
          position: relative;
        }

        /* Container with premium glass morphism */
        .console-container {
          position: relative;
          margin: 0 auto;
          max-width: 1400px;
          padding: 16px 24px 18px;
          background: linear-gradient(
            168deg,
            rgba(12, 16, 24, 0.96) 0%,
            rgba(8, 12, 18, 0.98) 50%,
            rgba(6, 8, 12, 1) 100%
          );
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            inset 0 -1px 0 rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 2px 8px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
        }

        /* Ambient backdrop with subtle radial gradient */
        .console-backdrop {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: radial-gradient(
            ellipse 75% 55% at 50% 42%,
            rgba(34, 211, 238, 0.06),
            transparent 70%
          );
          pointer-events: none;
        }

        /* ============================================
           INSTRUMENT GRID
           ============================================ */
        .instrument-grid {
          display: flex;
          gap: 16px;
          align-items: stretch;
          position: relative;
          z-index: 2;
        }

        /* ============================================
           KPI INSTRUMENT — INDIVIDUAL CARD
           ============================================ */
        .kpi-instrument {
          position: relative;
          flex: 1;
          min-width: 0;
          cursor: pointer;
          transition: 
            transform 250ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 200ms ease,
            filter 200ms ease;
        }

        /* Hover state: subtle lift */
        .kpi-instrument.hover {
          transform: translateY(-3px);
        }

        /* Active state: enlarge + lift */
        .kpi-instrument.active {
          transform: translateY(-6px) scale(1.04);
          z-index: 10;
        }

        /* Dimmed state: fade others when one is active */
        .kpi-instrument.dimmed {
          opacity: 0.45;
          filter: grayscale(0.3);
          transform: scale(0.98);
        }

        /* ============================================
           INSTRUMENT BORDER — METALLIC FRAME
           ============================================ */
        .instrument-border {
          position: relative;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(0, 0, 0, 0.15) 50%,
            rgba(255, 255, 255, 0.05) 75%,
            rgba(255, 255, 255, 0.15) 100%
          );
          transition: background 250ms ease;
        }

        .kpi-instrument.active .instrument-border {
          background: linear-gradient(
            160deg,
            var(--kpi-accent) 0%,
            rgba(255, 255, 255, 0.12) 25%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(255, 255, 255, 0.12) 75%,
            var(--kpi-accent) 100%
          );
        }

        /* ============================================
           INSTRUMENT WELL — RECESSED SURFACE
           ============================================ */
        .instrument-well {
          position: relative;
          background: linear-gradient(
            172deg,
            rgba(18, 24, 34, 0.98) 0%,
            rgba(12, 16, 24, 1) 40%,
            rgba(8, 10, 16, 1) 100%
          );
          border-radius: 14px;
          padding: 14px 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 
            inset 0 2px 8px rgba(0, 0, 0, 0.5),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03);
          min-height: 140px;
        }

        /* ============================================
           INSTRUMENT CONTENT
           ============================================ */
        .instrument-label-row {
          display: flex;
          align-items: center;
          min-height: 12px;
        }

        .instrument-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: rgba(170, 195, 215, 0.9);
          transition: color 200ms ease;
        }

        .kpi-instrument.active .instrument-label {
          color: rgba(200, 220, 240, 1);
        }

        .instrument-value-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 2px;
        }

        .value-display {
          font-size: 26px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.98);
          letter-spacing: -0.8px;
          line-height: 1;
          text-shadow:
            0 0 12px rgba(255, 255, 255, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.6);
          transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .kpi-instrument.active .value-display {
          color: var(--kpi-accent);
          text-shadow: 
            0 0 20px var(--kpi-accent),
            0 2px 4px rgba(0, 0, 0, 0.6);
        }

        .value-unit {
          font-size: 11px;
          font-weight: 700;
          color: rgba(120, 140, 160, 0.65);
          margin-left: 2px;
        }

        .instrument-visual {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          margin-top: 4px;
        }

        .instrument-svg {
          width: 100%;
          height: auto;
          max-height: 60px;
        }

        /* ============================================
           NEON GLOW LAYER
           ============================================ */
        .instrument-glow {
          position: absolute;
          inset: -6px;
          border-radius: 22px;
          background: radial-gradient(
            ellipse at center,
            var(--kpi-accent),
            transparent 65%
          );
          opacity: 0;
          transition: opacity 250ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          z-index: -1;
        }

        .kpi-instrument.hover .instrument-glow {
          opacity: 0.15;
        }

        .kpi-instrument.active .instrument-glow {
          opacity: 0.35;
        }

        /* ============================================
           FOCUS RING — ACTIVE INDICATOR
           ============================================ */
        .focus-ring {
          position: absolute;
          inset: -3px;
          border-radius: 19px;
          border: 2px solid var(--kpi-accent);
          opacity: 0;
          animation: focusRingPulse 2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes focusRingPulse {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.01);
          }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1400px) {
          .instrument-grid {
            gap: 14px;
          }
          .value-display {
            font-size: 24px;
          }
        }

        @media (max-width: 1200px) {
          .instrument-grid {
            gap: 12px;
          }
          .console-container {
            padding: 14px 20px 16px;
          }
          .value-display {
            font-size: 22px;
          }
          .instrument-label {
            font-size: 8px;
            letter-spacing: 1.8px;
          }
        }
      `}</style>
    </div>
  );
}