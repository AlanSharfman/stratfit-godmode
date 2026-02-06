// src/components/Risk/RiskTab.tsx
// STRATFIT — Risk Intelligence (God Mode)
// Exposure Decomposition: Risk Pressure Dial + Heat Map + Sensitivity Table

import { useEffect, useMemo } from 'react';
import { useRiskStore, type RiskLevel, type RiskFactor } from '../../state/riskStore';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';
import { useEngineStore } from '../../state/engineStore';
import './RiskStyles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LEVELS: { level: RiskLevel; color: string; label: string; threshold: number }[] = [
  { level: 'MINIMAL', color: '#22d3ee', label: 'MINIMAL', threshold: 15 },
  { level: 'LOW', color: '#10b981', label: 'LOW', threshold: 30 },
  { level: 'MODERATE', color: '#fbbf24', label: 'MODERATE', threshold: 45 },
  { level: 'ELEVATED', color: '#f97316', label: 'ELEVATED', threshold: 60 },
  { level: 'HIGH', color: '#ef4444', label: 'HIGH', threshold: 80 },
  { level: 'CRITICAL', color: '#dc2626', label: 'CRITICAL', threshold: 100 },
];

function levelColor(level: RiskLevel): string {
  return LEVELS.find(l => l.level === level)?.color ?? '#64748b';
}

function trendArrow(trend: 'improving' | 'stable' | 'worsening'): string {
  return trend === 'improving' ? '↘' : trend === 'worsening' ? '↗' : '→';
}

function trendColor(trend: 'improving' | 'stable' | 'worsening'): string {
  return trend === 'improving' ? '#10b981' : trend === 'worsening' ? '#ef4444' : '#64748b';
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK PRESSURE DIAL
// ═══════════════════════════════════════════════════════════════════════════════

function RiskPressureDial({ score, level }: { score: number; level: RiskLevel }) {
  const color = levelColor(level);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="sf-risk-dial">
      <div className="sf-risk-dial-header">
        <span className="sf-risk-dial-title">RISK PRESSURE</span>
        <div className="sf-risk-dial-badge" style={{ borderColor: color, color }}>
          <span className="sf-risk-dial-dot" style={{ background: color }} />
          {level}
        </div>
      </div>
      <div className="sf-risk-dial-track">
        <div
          className="sf-risk-dial-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #22d3ee 0%, #10b981 25%, #fbbf24 50%, #f97316 70%, #ef4444 90%, #dc2626 100%)`,
          }}
        />
        <div className="sf-risk-dial-marker" style={{ left: `${pct}%`, background: color }} />
      </div>
      <div className="sf-risk-dial-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      <div className="sf-risk-dial-score">
        <span className="sf-risk-dial-score-num" style={{ color }}>{score}</span>
        <span className="sf-risk-dial-score-unit">/100</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPOSURE HEAT MAP
// ═══════════════════════════════════════════════════════════════════════════════

function ExposureHeatMap({ radarData }: { radarData: { category: string; score: number; label: string }[] }) {
  // Map score (0-100) to opacity for heat intensity
  function heatColor(score: number): string {
    if (score >= 60) return 'rgba(239, 68, 68, 0.25)';
    if (score >= 45) return 'rgba(249, 115, 22, 0.2)';
    if (score >= 30) return 'rgba(251, 191, 36, 0.15)';
    return 'rgba(16, 185, 129, 0.1)';
  }

  function textColor(score: number): string {
    if (score >= 60) return '#ef4444';
    if (score >= 45) return '#f97316';
    if (score >= 30) return '#fbbf24';
    return '#10b981';
  }

  return (
    <div className="sf-risk-heatmap">
      <div className="sf-risk-heatmap-title">EXPOSURE HEAT MAP</div>
      <div className="sf-risk-heatmap-grid">
        {radarData.map((d) => (
          <div
            key={d.category}
            className="sf-heatmap-cell"
            style={{ background: heatColor(d.score) }}
          >
            <div className="sf-heatmap-score" style={{ color: textColor(d.score) }}>
              {d.score}
            </div>
            <div className="sf-heatmap-label">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSITIVITY RANKING TABLE
// ═══════════════════════════════════════════════════════════════════════════════

function SensitivityTable({ factors }: { factors: RiskFactor[] }) {
  const sorted = useMemo(() => [...factors].sort((a, b) => b.score - a.score), [factors]);

  return (
    <div className="sf-risk-sensitivity">
      <div className="sf-risk-sensitivity-title">SENSITIVITY RANKING</div>
      <div className="sf-sensitivity-header">
        <div>#</div>
        <div>Factor</div>
        <div>Score</div>
        <div>Level</div>
        <div>Trend</div>
        <div>Type</div>
      </div>
      {sorted.map((f, i) => (
        <div key={f.id} className="sf-sensitivity-row">
          <div className="sf-sensitivity-rank">{i + 1}</div>
          <div className="sf-sensitivity-name">
            {f.label}
            {f.controllable && <span className="sf-sensitivity-ctrl" title="Controllable">●</span>}
          </div>
          <div className="sf-sensitivity-score" style={{ color: levelColor(f.level) }}>
            {f.score}
          </div>
          <div className="sf-sensitivity-level" style={{ color: levelColor(f.level) }}>
            {f.level}
          </div>
          <div className="sf-sensitivity-trend" style={{ color: trendColor(f.trend) }}>
            {trendArrow(f.trend)}
          </div>
          <div className="sf-sensitivity-impact">
            {f.impact === 'both' ? 'Surv + Growth' : f.impact === 'survival' ? 'Survival' : 'Growth'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function RiskTab() {
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  const calculateRisk = useRiskStore((s) => s.calculateRisk);
  const levers = useLeverStore((s) => s.levers);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const engineStatus = useEngineStore((s) => s.status);

  useEffect(() => {
    calculateRisk(
      levers as Record<string, number>,
      simulation
        ? {
            survivalRate: simulation.survivalRate,
            medianRunway: simulation.runwayMedian,
            medianARR: simulation.arrMedian,
            arrRange: { p10: simulation.arrP10, p90: simulation.arrP90 },
          }
        : null
    );
  }, [levers, simulation, calculateRisk]);

  // ── No simulation yet → graceful empty state ─────────────────────────────
  if (!hasSimulated || !simulation) {
    return (
      <div className="sf-risk-root">
        <header className="sf-risk-page-header">
          <span className="sf-risk-page-badge">RISK</span>
          <span className="sf-risk-page-title">EXPOSURE DECOMPOSITION</span>
        </header>
        <div className="sf-risk-empty">
          <div className="sf-risk-empty-icon">◎</div>
          <div className="sf-risk-empty-text">
            Run a simulation to generate risk intelligence.
          </div>
          <div className="sf-risk-empty-sub">
            Navigate to Baseline → Run Simulation → return here.
          </div>
        </div>
      </div>
    );
  }

  if (!riskSnapshot) {
    return (
      <div className="sf-risk-root">
        <header className="sf-risk-page-header">
          <span className="sf-risk-page-badge">RISK</span>
          <span className="sf-risk-page-title">EXPOSURE DECOMPOSITION</span>
        </header>
        <div className="sf-risk-empty">
          <div className="sf-risk-empty-text">Analyzing exposure...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-risk-root">
      {/* ═══ HEADER ═══ */}
      <header className="sf-risk-page-header">
        <div className="sf-risk-page-header-left">
          <span className="sf-risk-page-badge">RISK</span>
          <span className="sf-risk-page-title">EXPOSURE DECOMPOSITION</span>
        </div>
        {riskSnapshot.criticalWarnings.length > 0 && (
          <div className="sf-risk-alerts">
            {riskSnapshot.criticalWarnings.slice(0, 2).map((w, i) => (
              <span key={i} className="sf-risk-alert">⚠ {w}</span>
            ))}
          </div>
        )}
      </header>

      {/* ═══ RISK PRESSURE DIAL ═══ */}
      <RiskPressureDial score={riskSnapshot.overallScore} level={riskSnapshot.overallLevel} />

      {/* ═══ EXPOSURE HEAT MAP ═══ */}
      <ExposureHeatMap radarData={riskSnapshot.radarData} />

      {/* ═══ SENSITIVITY RANKING TABLE ═══ */}
      <SensitivityTable factors={riskSnapshot.factors} />
    </div>
  );
}
