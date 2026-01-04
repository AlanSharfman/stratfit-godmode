// src/components/HealthStateKPI.tsx
// STRATFIT — Health Score as a KPI Card (KPI strip style)

import { useLevers } from '@/state/scenarioStore';
import { calculateScenarioHealth, type LeverValues } from '@/logic/calculateScenarioHealth';
import { useMemo } from 'react';

export default function HealthStateKPI() {
  // Canonical lever values
  const levers = useLevers();
  const leverValues: LeverValues = useMemo(() => {
    const normalize = (v: number) => Math.max(0, Math.min(100, v));
    return {
      revenueGrowth: normalize(levers.revenueGrowth ?? 50),
      pricingAdjustment: normalize(levers.pricingAdjustment ?? 50),
      marketingSpend: normalize(levers.marketingSpend ?? 50),
      operatingExpenses: normalize(levers.operatingExpenses ?? 50),
      headcount: normalize(levers.headcount ?? 50),
      cashSensitivity: normalize(levers.cashSensitivity ?? 50),
      churnSensitivity: normalize(levers.churnSensitivity ?? 50),
      fundingInjection: normalize(levers.fundingInjection ?? 50),
    };
  }, [levers]);

  const metrics = useMemo(() => calculateScenarioHealth(leverValues), [leverValues]);
  const { health, state } = metrics;

  // State config for color and label
  const stateConfig = {
    strong: { label: 'Strong', color: '#22c55e' },
    stable: { label: 'Stable', color: '#00E5FF' },
    fragile: { label: 'Fragile', color: '#f59e0b' },
    critical: { label: 'Critical', color: '#ef4444' }
  };
  const config = stateConfig[state];

  return (
    <div className="kpi-instrument health-kpi-instrument" style={{ '--kpi-accent': config.color } as React.CSSProperties}>
      <div className="instrument-border">
        <div className="instrument-well">
          <div className="instrument-label-row">
            <span className="instrument-label health-label">SCENARIO HEALTH</span>
          </div>
          <div className="instrument-value-row health-value-row">
            <span className="value-display health-value">{health}</span>
          </div>
          <div className="health-status-row">
            <span className="health-status" style={{ color: config.color }}>{config.label}</span>
          </div>
          {/* Optional: tiny indicator bar (like runway) */}
          <div className="health-indicator-bar">
            <div className="health-indicator-fill" style={{ background: config.color, width: `${health}%` }} />
          </div>
        </div>
      </div>
      <div className="instrument-glow health-glow" />
      <style>{`
        .health-kpi-instrument {
          flex: 1.5 1 0%;
          min-width: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
          cursor: default;
        }
        .instrument-border {
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(160deg,rgba(255,255,255,0.13) 0%,rgba(255,255,255,0.04) 25%,rgba(0,0,0,0.10) 50%,rgba(255,255,255,0.04) 75%,rgba(255,255,255,0.10) 100%);
          transition: background 250ms ease;
        }
        .instrument-well {
          background: linear-gradient(172deg,rgba(18,24,34,0.98) 0%,rgba(12,16,24,1) 40%,rgba(8,10,16,1) 100%);
          border-radius: 14px;
          padding: 14px 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 140px;
          align-items: flex-start;
        }
        .instrument-label-row {
          display: flex;
          align-items: center;
          min-height: 12px;
        }
        .instrument-label.health-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: rgba(140, 160, 180, 0.7);
        }
        .health-value-row {
          margin-top: 2px;
        }
        .health-value {
          font-size: 54px;
          font-weight: 900;
          color: var(--kpi-accent);
          letter-spacing: -1.5px;
          line-height: 1.05;
          text-shadow: 0 1px 3px rgba(0,0,0,0.18);
        }
        .health-status-row {
          margin-top: 2px;
        }
        .health-status {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: var(--kpi-accent);
          text-shadow: 0 0 4px var(--kpi-accent, #00E5FF22);
        }
        .health-indicator-bar {
          width: 100%;
          height: 5px;
          background: rgba(120,140,160,0.13);
          border-radius: 3px;
          margin-top: 8px;
          overflow: hidden;
        }
        .health-indicator-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .health-glow {
          position: absolute;
          inset: 4px;
          border-radius: 14px;
          background: radial-gradient(ellipse at center, var(--kpi-accent, #00E5FF) 0%, transparent 70%);
          opacity: 0.10;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}
