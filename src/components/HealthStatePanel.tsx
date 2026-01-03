// src/components/HealthStatePanel.tsx
// STRATFIT — Scenario Health Tab View (Board-Grade State Assessment)

import { useMemo } from 'react';
import { useScenario, useLevers } from '@/state/scenarioStore';
import { calculateScenarioHealth, type LeverValues } from '@/logic/calculateScenarioHealth';

export default function HealthStatePanel() {
  const scenario = useScenario();
  
  // Derive lever values from dataPoints (normalized 0-100)
  // dataPoints represent scenario outputs; we map them to lever approximations
  // ✅ SOURCE OF TRUTH: the real lever values (0–100)
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
  
  const { health, state, trend, breakdown } = metrics;
  
  // State styling
  const stateConfig = {
    strong: { label: 'Strong', color: '#22c55e' },
    stable: { label: 'Stable', color: '#00E5FF' },
    fragile: { label: 'Fragile', color: '#f59e0b' },
    critical: { label: 'Critical', color: '#ef4444' }
  };

  const config = stateConfig[state];

  // Executive summary (board-level language)
  const getSummary = () => {
    if (state === 'strong' && trend === 'strengthening') {
      return 'Momentum exceeds execution drag; risk remains bounded.';
    }
    if (state === 'stable') {
      return 'Trajectory sustainable at current burn and growth rates.';
    }
    if (state === 'fragile') {
      return 'Execution load increasing faster than momentum.';
    }
    return 'Structural headwinds require immediate intervention.';
  };

  // Sensitivity analysis (rank by impact severity)
  const getSensitivities = () => {
    const factors = [
      { label: 'Demand Strength', value: breakdown.growth, polarity: 'good' as const },
      { label: 'Burn Rate', value: breakdown.efficiency, polarity: 'good' as const },
      { label: 'Market Risk', value: breakdown.risk, polarity: 'bad' as const },
    ];

    const ranked = factors
      .map(f => ({
        label: f.label,
        score: f.polarity === 'bad' ? f.value : (100 - f.value), // higher score = worse pressure
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    return ranked;
  };

  // Flip conditions (when state changes)
  const getFlipCondition = () => {
    if (state === 'strong') {
      return 'State flips if runway < 12 months or demand weakens by ~15%.';
    }
    if (state === 'stable') {
      return 'State flips if burn increases >20% or churn exceeds 8%.';
    }
    if (state === 'fragile') {
      return 'State improves if funding secured or burn reduced by 25%.';
    }
    return 'Requires immediate capital injection or structural pivot.';
  };

  const sensitivities = getSensitivities();
  const trendIcon = trend === 'strengthening' ? '↑' : trend === 'weakening' ? '↓' : '→';

  return (
    <div className="health-state-panel">
      {/* Header */}
      <div className="health-header">
        <span className="health-eyebrow">SCENARIO HEALTH</span>
        <span className="health-scenario">— {scenario.toUpperCase()} CASE</span>
      </div>

      {/* Health Score + State */}
      <div className="health-score-row">
        <div className="health-score" style={{ color: config.color }}>
          {health}
        </div>
        <div className="health-state-info">
          <span className="state-label" style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="state-trend">
            {trendIcon} {trend}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <p className="health-summary">
        {getSummary()}
      </p>

      {/* Sensitivity */}
      <div className="health-sensitivity">
        <span className="sensitivity-label">Most sensitive to:</span>
        <div className="sensitivity-chips">
          <span className="chip primary">{sensitivities[0].label}</span>
          {sensitivities[1] && (
            <>
              <span className="divider">•</span>
              <span className="chip secondary">{sensitivities[1].label}</span>
            </>
          )}
        </div>
      </div>

      {/* Flip Condition */}
      <p className="health-flip">
        {getFlipCondition()}
      </p>

      <style>{`
        .health-state-panel {
          width: 100%;
          max-width: 900px;
          margin: 40px auto;
          padding: 32px 40px;
          background: rgba(10, 15, 25, 0.6);
          border: 1px solid rgba(0, 229, 255, 0.12);
          border-radius: 12px;
          backdrop-filter: blur(12px);
        }

        .health-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 229, 255, 0.08);
        }

        .health-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        .health-scenario {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          color: rgba(0, 229, 255, 0.5);
        }

        .health-score-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 20px;
        }

        .health-score {
          font-size: 72px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -2px;
          font-variant-numeric: tabular-nums;
        }

        .health-state-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .state-label {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .state-trend {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.3px;
          text-transform: capitalize;
        }

        .health-summary {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 24px 0;
        }

        .health-sensitivity {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sensitivity-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .sensitivity-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chip {
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .chip.primary {
          background: rgba(0, 229, 255, 0.12);
          border: 1px solid rgba(0, 229, 255, 0.25);
          color: #00E5FF;
        }

        .chip.secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
        }

        .divider {
          color: rgba(255, 255, 255, 0.3);
          font-size: 10px;
        }

        .health-flip {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.6);
          padding-top: 20px;
          margin: 0;
          border-top: 1px solid rgba(0, 229, 255, 0.06);
        }
      `}</style>
    </div>
  );
}