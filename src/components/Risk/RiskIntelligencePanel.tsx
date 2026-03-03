// src/components/Risk/RiskIntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: Risk Intelligence Panel
//
// Premium glass panel combining quantitative risk metrics with
// qualitative intelligence. Mounts in Position right rail.
//
// DATA SOURCE (STRICT):
//   useRiskIntelligence() → RiskIntelligenceOutput
//
// Sub-components (inlined):
//   RiskScoreArc      — SVG arc gauge (0-100)
//   RiskRadarMini     — 6-axis spider chart
//   RiskTrendSpark    — 36-month sparkline
//   ThreatCards       — ranked threat list
//   SystemStateBadges — financial / operational / execution state
//
// No simulation runs. No stores. Pure derived render.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import { useRiskIntelligence } from "@/hooks/useRiskIntelligence";
import {
  getRiskBandColor,
  type RiskBand,
  type ThreatAxis,
  type RiskTrajectoryPoint,
  type RiskIntelligenceOutput,
} from "@/engine/riskIntelligenceEngine";
import type { SystemStateLevel } from "@/utils/scenarioIntelligenceMapping";
import RiskTransmissionStrip from "./RiskTransmissionStrip";
import RiskDeltaBadge from "./RiskDeltaBadge";
import styles from "./RiskIntelligencePanel.module.css";

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── Risk Score Arc (SVG gauge) ──────────────────────────────────────────
const RiskScoreArc: React.FC<{ score: number; color: string }> = memo(({ score, color }) => {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = Math.PI * radius; // Half-circle
  const normalizedScore = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      {/* Background arc */}
      <path
        d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Score arc */}
      <path
        d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      {/* Score text */}
      <text x={center} y={center - 4} textAnchor="middle" fill={color}
        style={{ fontSize: 18, fontWeight: 300, fontFamily: "'JetBrains Mono', monospace" }}>
        {normalizedScore}
      </text>
    </svg>
  );
});
RiskScoreArc.displayName = "RiskScoreArc";

// ── Risk Radar Mini (6-axis spider) ─────────────────────────────────────
const RiskRadarMini: React.FC<{ axes: ThreatAxis[] }> = memo(({ axes }) => {
  const size = 160;
  const center = size / 2;
  const maxRadius = 58;
  const levels = 4;
  const count = axes.length;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (score: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (score / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPath = axes
    .map((a, i) => {
      const p = getPoint(a.score, i);
      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  const trendSymbol = (t: ThreatAxis["trend"]) =>
    t === "worsening" ? "↗" : t === "improving" ? "↘" : "→";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {Array.from({ length: levels }, (_, i) => {
        const r = ((i + 1) / levels) * maxRadius;
        return <circle key={i} cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
      })}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = getPoint(100, i);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
      })}
      {/* Fill polygon */}
      <path d={polygonPath} fill="rgba(0,224,255,0.08)" stroke="rgba(0,224,255,0.5)" strokeWidth={1.2} />
      {/* Dots + labels */}
      {axes.map((a, i) => {
        const p = getPoint(a.score, i);
        const lp = getPoint(130, i); // label position (outside)
        const color = a.score > 60 ? "#ef4444" : a.score > 40 ? "#fbbf24" : "#22d3ee";
        return (
          <g key={a.category}>
            <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)"
              style={{ fontSize: 7.5, letterSpacing: "0.04em" }}
            >
              {a.label} {trendSymbol(a.trend)}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
RiskRadarMini.displayName = "RiskRadarMini";

// ── Risk Trend Sparkline (36-month) ─────────────────────────────────────
const RiskTrendSpark: React.FC<{ trajectory: RiskTrajectoryPoint[]; peakMonth: number }> = memo(({ trajectory, peakMonth }) => {
  const w = 200;
  const h = 60;
  const pad = { l: 4, r: 4, t: 4, b: 14 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const maxScore = Math.max(...trajectory.map((p) => p.score), 1);
  const xScale = (month: number) => pad.l + (month / 36) * cw;
  const yScale = (score: number) => pad.t + ch - (score / maxScore) * ch;

  const linePath = trajectory
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.month).toFixed(1)} ${yScale(p.score).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${xScale(36)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  // Danger zone (score > 60)
  const dangerZones: Array<{ start: number; end: number }> = [];
  let inDanger = false;
  let dStart = 0;
  for (const p of trajectory) {
    if (p.score > 60 && !inDanger) {
      inDanger = true;
      dStart = p.month;
    } else if (p.score <= 60 && inDanger) {
      inDanger = false;
      dangerZones.push({ start: dStart, end: p.month });
    }
  }
  if (inDanger) dangerZones.push({ start: dStart, end: 36 });

  const peakPoint = trajectory.find((p) => p.month === peakMonth);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="riskSparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,224,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,224,255,0)" />
        </linearGradient>
      </defs>
      {/* Danger zones */}
      {dangerZones.map((z, i) => (
        <rect key={i} x={xScale(z.start)} y={pad.t} width={xScale(z.end) - xScale(z.start)} height={ch} fill="rgba(239,68,68,0.06)" />
      ))}
      {/* 60% threshold line */}
      <line x1={pad.l} y1={yScale(60)} x2={w - pad.r} y2={yScale(60)} stroke="rgba(239,68,68,0.2)" strokeWidth={0.5} strokeDasharray="3,3" />
      {/* Area fill */}
      <path d={areaPath} fill="url(#riskSparkGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="rgba(0,224,255,0.65)" strokeWidth={1.2} />
      {/* Peak dot */}
      {peakPoint && (
        <circle cx={xScale(peakPoint.month)} cy={yScale(peakPoint.score)} r={2.5} fill="#ef4444" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
      )}
      {/* Month labels */}
      <text x={pad.l} y={h - 2} fill="rgba(255,255,255,0.25)" style={{ fontSize: 7 }}>0</text>
      <text x={xScale(18)} y={h - 2} fill="rgba(255,255,255,0.25)" style={{ fontSize: 7 }} textAnchor="middle">18</text>
      <text x={w - pad.r} y={h - 2} fill="rgba(255,255,255,0.25)" style={{ fontSize: 7 }} textAnchor="end">36mo</text>
    </svg>
  );
});
RiskTrendSpark.displayName = "RiskTrendSpark";

// ── System State Badge Color ────────────────────────────────────────────
function stateColor(level: SystemStateLevel): string {
  switch (level) {
    case "STABLE":   return "#34d399";
    case "MODERATE": return "#fbbf24";
    case "ELEVATED": return "#f97316";
    case "HIGH":     return "#ef4444";
  }
}

function severityColor(level: SystemStateLevel): string {
  return stateColor(level);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════════════════

const RiskIntelligencePanel: React.FC = memo(() => {
  const { intelligence, ready } = useRiskIntelligence();

  if (!ready || !intelligence) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Risk Intelligence</div>
          <div className={styles.emptyText}>
            Run a simulation to generate risk intelligence.
          </div>
        </div>
      </div>
    );
  }

  const {
    overallScore,
    band,
    bandColor,
    survivalProbability,
    threatAxes,
    trajectory,
    peakRisk,
    peakMonth,
    topThreats,
    systemState,
    observations,
    attention,
    assumptionFlags,
    strategicQuestions,
  } = intelligence;

  return (
    <div className={styles.root}>
      {/* ═══ SCORE HEADER ═══ */}
      <div className={styles.scoreHeader}>
        <div className={styles.scoreArcWrap}>
          <RiskScoreArc score={overallScore} color={bandColor} />
        </div>
        <div className={styles.scoreInfo}>
          <div className={styles.scoreTitle}>RISK INTELLIGENCE</div>
          <div className={styles.scoreRow}>
            <span className={styles.scoreValue} style={{ color: bandColor }}>
              {overallScore}
            </span>
            <span
              className={styles.scoreBand}
              style={{
                color: bandColor,
                background: `${bandColor}15`,
                border: `1px solid ${bandColor}30`,
              }}
            >
              {band}
            </span>
          </div>
          <div className={styles.survivalPill}>
            Survival: {(survivalProbability * 100).toFixed(0)}%
            <RiskDeltaBadge compact />
          </div>
        </div>
      </div>

      {/* ═══ SYSTEM STATE STRIP ═══ */}
      <div className={styles.stateStrip}>
        {(["financial", "operational", "execution"] as const).map((key) => {
          const level = systemState[key];
          const color = stateColor(level);
          return (
            <div key={key} className={styles.stateCell}>
              <span className={styles.stateLabel}>{key}</span>
              <span
                className={styles.stateBadge}
                style={{
                  color,
                  background: `${color}12`,
                  border: `1px solid ${color}25`,
                }}
              >
                {level}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══ RADAR + TRAJECTORY ═══ */}
      <div className={styles.vizRow}>
        <div className={styles.vizCell}>
          <div className={styles.vizTitle}>THREAT RADAR</div>
          <RiskRadarMini axes={threatAxes} />
        </div>
        <div className={styles.vizCell}>
          <div className={styles.vizTitle}>
            RISK TRAJECTORY · PEAK {peakRisk} @ M{peakMonth}
          </div>
          <RiskTrendSpark trajectory={trajectory} peakMonth={peakMonth} />
        </div>
      </div>

      {/* ═══ RISK TRANSMISSION ═══ */}
      <RiskTransmissionStrip />

      {/* ═══ TOP THREATS ═══ */}
      {topThreats.length > 0 && (
        <div className={styles.threatsSection}>
          <div className={styles.sectionTitle}>TOP THREATS</div>
          {topThreats.map((t) => {
            const sColor = severityColor(t.severity);
            return (
              <div key={t.rank} className={styles.threatCard}>
                <div className={styles.threatRank}>#{t.rank}</div>
                <div className={styles.threatBody}>
                  <div className={styles.threatTitle}>{t.title}</div>
                  <div className={styles.threatDriver}>{t.driver}</div>
                </div>
                <span
                  className={styles.threatSeverity}
                  style={{
                    color: sColor,
                    background: `${sColor}12`,
                    border: `1px solid ${sColor}25`,
                  }}
                >
                  {t.severity}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ OBSERVATIONS ═══ */}
      {observations.length > 0 && (
        <div className={styles.obsSection}>
          <div className={styles.sectionTitle}>OBSERVATIONS</div>
          {observations.map((o, i) => (
            <div key={i} className={styles.obsBullet}>{o}</div>
          ))}
        </div>
      )}

      {/* ═══ ATTENTION ═══ */}
      {attention.length > 0 && (
        <div className={styles.attSection}>
          <div className={styles.sectionTitle}>ATTENTION</div>
          {attention.map((a, i) => (
            <div key={i} className={styles.attItem}>{a}</div>
          ))}
        </div>
      )}

      {/* ═══ ASSUMPTION FLAGS ═══ */}
      {assumptionFlags.length > 0 && (
        <div className={styles.flagsSection}>
          <div className={styles.sectionTitle}>ASSUMPTION FLAGS</div>
          {assumptionFlags.map((f, i) => (
            <div key={i} className={styles.flagItem}>{f}</div>
          ))}
        </div>
      )}

      {/* ═══ STRATEGIC QUESTIONS ═══ */}
      {strategicQuestions.length > 0 && (
        <div className={styles.qSection}>
          <div className={styles.sectionTitle}>STRATEGIC QUESTIONS</div>
          {strategicQuestions.map((q, i) => (
            <div key={i} className={styles.qCard}>
              <div className={styles.qQuestion}>{q.question}</div>
              <div className={styles.qAnswer}>{q.answer}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

RiskIntelligencePanel.displayName = "RiskIntelligencePanel";

export default RiskIntelligencePanel;
