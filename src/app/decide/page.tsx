// src/app/decide/page.tsx
// STRATFIT — Decision Page (God Mode)
// Action Layer: Recommendation Tier + Expected Outcome + Capital Guidance
// Decision must be derived from Compare + Risk + Valuation.

import React, { useMemo } from 'react';
import { useScenarioStore, type ScenarioId } from '@/state/scenarioStore';
import { useSimulationStore } from '@/state/simulationStore';
import { useRiskStore } from '@/state/riskStore';
import { useEngineStore } from '@/state/engineStore';
import './decide.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Tier = 'Conservative' | 'Balanced' | 'Aggressive';
type GuidanceAction = {
  label: string;
  status: 'recommended' | 'optional' | 'not-recommended';
  rationale: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt$(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function deriveTier(
  riskScore: number,
  runwayMonths: number,
  growthPct: number,
  ltvCac: number,
): { tier: Tier; confidence: number; rationale: string } {
  // Scoring: high runway + low risk + solid growth = Aggressive possible
  // Low runway + high risk = Conservative
  let score = 0;

  // Runway contribution (0-30)
  if (runwayMonths >= 24) score += 30;
  else if (runwayMonths >= 18) score += 22;
  else if (runwayMonths >= 12) score += 14;
  else score += 5;

  // Risk contribution (0-30, inverted — lower risk = higher score)
  if (riskScore <= 25) score += 30;
  else if (riskScore <= 40) score += 22;
  else if (riskScore <= 55) score += 14;
  else score += 5;

  // Growth contribution (0-20)
  if (growthPct >= 0.4) score += 20;
  else if (growthPct >= 0.2) score += 14;
  else if (growthPct >= 0.1) score += 8;
  else score += 3;

  // LTV/CAC contribution (0-20)
  if (ltvCac >= 5) score += 20;
  else if (ltvCac >= 3) score += 14;
  else if (ltvCac >= 2) score += 8;
  else score += 3;

  const confidence = Math.min(98, Math.max(45, score));

  if (score >= 75) {
    return {
      tier: 'Aggressive',
      confidence,
      rationale: 'Strong fundamentals across all dimensions support aggressive capital deployment.',
    };
  }
  if (score >= 45) {
    return {
      tier: 'Balanced',
      confidence,
      rationale: 'Mixed signals warrant measured growth with risk management.',
    };
  }
  return {
    tier: 'Conservative',
    confidence,
    rationale: 'Defensive posture required — preserve runway and optimize margins before expansion.',
  };
}

function deriveGuidance(
  tier: Tier,
  runwayMonths: number,
  riskScore: number,
  growthPct: number,
  burnRate: number,
  ltvCac: number,
): GuidanceAction[] {
  const actions: GuidanceAction[] = [];

  // Raise now
  if (runwayMonths < 12) {
    actions.push({
      label: 'Raise now',
      status: 'recommended',
      rationale: `Runway at ${runwayMonths}mo demands immediate capital action.`,
    });
  } else if (runwayMonths < 18 && tier !== 'Aggressive') {
    actions.push({
      label: 'Raise now',
      status: 'optional',
      rationale: `${runwayMonths}mo runway is adequate but tight for aggressive growth.`,
    });
  } else {
    actions.push({
      label: 'Raise now',
      status: 'not-recommended',
      rationale: `${runwayMonths}mo runway provides sufficient buffer. No urgency to dilute.`,
    });
  }

  // Delay expansion
  if (riskScore > 55 || runwayMonths < 15) {
    actions.push({
      label: 'Delay expansion',
      status: 'recommended',
      rationale: `Risk score ${riskScore}/100 and ${runwayMonths}mo runway suggest consolidation first.`,
    });
  } else if (tier === 'Conservative') {
    actions.push({
      label: 'Delay expansion',
      status: 'optional',
      rationale: 'Conservative posture favors organic growth over expansion.',
    });
  } else {
    actions.push({
      label: 'Delay expansion',
      status: 'not-recommended',
      rationale: 'Fundamentals support expansion. Timing is favorable.',
    });
  }

  // Preserve runway
  if (runwayMonths >= 24) {
    actions.push({
      label: 'Preserve runway',
      status: tier === 'Aggressive' ? 'optional' : 'recommended',
      rationale: `Strong ${runwayMonths}mo buffer. ${tier === 'Aggressive' ? 'Can redeploy excess into growth.' : 'Maintain for stability.'}`,
    });
  } else {
    actions.push({
      label: 'Preserve runway',
      status: 'recommended',
      rationale: `${runwayMonths}mo runway requires active cash management.`,
    });
  }

  // Optimize margin
  if (ltvCac < 3 || burnRate > 60) {
    actions.push({
      label: 'Optimize margin',
      status: 'recommended',
      rationale: `LTV/CAC ${ltvCac.toFixed(1)}x below healthy threshold. Unit economics need attention.`,
    });
  } else {
    actions.push({
      label: 'Optimize margin',
      status: 'optional',
      rationale: `LTV/CAC ${ltvCac.toFixed(1)}x is healthy. Continue monitoring.`,
    });
  }

  return actions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TierSelector({ tier }: { tier: Tier }) {
  const tiers: Tier[] = ['Conservative', 'Balanced', 'Aggressive'];
  const colors: Record<Tier, string> = {
    Conservative: '#22d3ee',
    Balanced: '#8b5cf6',
    Aggressive: '#f59e0b',
  };

  return (
    <div className="sf-decide-tiers">
      {tiers.map((t) => (
        <div
          key={t}
          className={`sf-decide-tier ${t === tier ? 'sf-decide-tier--active' : ''}`}
          style={
            t === tier
              ? { borderColor: colors[t], color: colors[t], background: `${colors[t]}10` }
              : undefined
          }
        >
          <span className="sf-decide-tier-label">{t.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

function OutcomeRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="sf-decide-outcome-row">
      <span className="sf-decide-outcome-label">{label}</span>
      <span className="sf-decide-outcome-value" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

function GuidanceRow({ action }: { action: GuidanceAction }) {
  const icon =
    action.status === 'recommended'
      ? '✓'
      : action.status === 'optional'
      ? '○'
      : '✗';
  const color =
    action.status === 'recommended'
      ? '#10b981'
      : action.status === 'optional'
      ? '#fbbf24'
      : '#ef4444';

  return (
    <div className="sf-decide-guidance-row">
      <span className="sf-decide-guidance-icon" style={{ color }}>
        {icon}
      </span>
      <div className="sf-decide-guidance-body">
        <span className="sf-decide-guidance-label">{action.label}</span>
        <span className="sf-decide-guidance-rationale">{action.rationale}</span>
      </div>
      <span className="sf-decide-guidance-status" style={{ color }}>
        {action.status === 'recommended'
          ? 'RECOMMENDED'
          : action.status === 'optional'
          ? 'OPTIONAL'
          : 'NOT RECOMMENDED'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function DecidePage() {
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const simulation = useSimulationStore((s) => s.summary);
  const riskSnapshot = useRiskStore((s) => s.riskSnapshot);
  const engineStatus = useEngineStore((s) => s.status);
  const engineConfidence = useEngineStore((s) => s.confidencePct);

  const sid: ScenarioId = activeScenarioId || 'base';
  const kpis = engineResults?.[sid]?.kpis;

  // ── Extract values ──────────────────────────────────────────────────────
  const runwayMonths = kpis?.runway?.value ?? 18;
  const arrCurrent = kpis?.arrCurrent?.value ?? 2_000_000;
  const evMetric = kpis?.enterpriseValue?.value ?? 50;
  const burnRate = kpis?.burnQuality?.value ?? 40;
  const ltvCac = (kpis?.ltvCac as any)?.value ?? 3;
  const riskScore = riskSnapshot?.overallScore ?? ((kpis?.riskScore as any)?.value ?? 45);
  const growthRaw = (kpis?.arrGrowthPct as any)?.value ?? 0.08;
  const growthPct = growthRaw > 1 ? growthRaw / 100 : growthRaw;
  const survivalPct = simulation?.survivalRate
    ? Math.round(simulation.survivalRate * 100)
    : Math.min(100, Math.max(20, 100 - riskScore));

  // ── Derive recommendation ─────────────────────────────────────────────
  const { tier, confidence, rationale } = useMemo(
    () => deriveTier(riskScore, runwayMonths, growthPct, ltvCac),
    [riskScore, runwayMonths, growthPct, ltvCac]
  );

  const guidance = useMemo(
    () => deriveGuidance(tier, runwayMonths, riskScore, growthPct, burnRate, ltvCac),
    [tier, runwayMonths, riskScore, growthPct, burnRate, ltvCac]
  );

  // ── Expected EV (probability-weighted simple) ──────────────────────────
  const expectedEV = useMemo(() => {
    const evDollars = (evMetric / 10) * 1_000_000;
    return evDollars * (survivalPct / 100);
  }, [evMetric, survivalPct]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      background: '#050a12',
      color: 'rgba(255,255,255,0.92)',
      fontFamily: '"Inter", -apple-system, sans-serif',
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            padding: '3px 8px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
          }}>DECISION</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            STRATEGIC RECOMMENDATION
          </span>
        </div>
        {engineStatus === 'Complete' && engineConfidence != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#10b981' }} />
            Confidence: {engineConfidence}%
          </span>
        )}
      </header>

      {/* ═══ RECOMMENDATION TIER ═══ */}
      <section style={{ padding: '24px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 16,
        }}>
          RECOMMENDATION TIER
        </div>
        <TierSelector tier={tier} />
        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          {rationale}
        </div>
      </section>

      {/* ═══ PROBABILITY-WEIGHTED OUTCOME ═══ */}
      <section style={{ padding: '24px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 16,
        }}>
          PROBABILITY-WEIGHTED EXPECTED OUTCOME
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px 24px',
        }}>
          <OutcomeRow label="Expected EV" value={fmt$(expectedEV)} color="#8b5cf6" />
          <OutcomeRow label="Survival Probability" value={`${survivalPct}%`} color="#10b981" />
          <OutcomeRow label="Runway" value={`${runwayMonths} mo`} color="#22d3ee" />
          <OutcomeRow label="ARR Growth" value={`${growthPct >= 0 ? '+' : ''}${(growthPct * 100).toFixed(0)}%`} color="#f59e0b" />
          <OutcomeRow label="LTV/CAC" value={`${ltvCac.toFixed(1)}x`} />
          <OutcomeRow label="Burn Rate" value={`$${Math.round(burnRate)}K/mo`} />
        </div>
      </section>

      {/* ═══ CAPITAL DEPLOYMENT GUIDANCE ═══ */}
      <section style={{ padding: '24px 24px', flexShrink: 0 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 16,
        }}>
          CAPITAL DEPLOYMENT GUIDANCE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {guidance.map((a) => (
            <GuidanceRow key={a.label} action={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
