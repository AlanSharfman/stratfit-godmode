// src/pages/objective/ObjectivePage.tsx
// STRATFIT — Strategic Targeting Console (God Mode)

import { useMemo, useCallback } from "react";
import { useObjectiveStore } from "@/state/objectiveStore";
import { generatePseudoHistory, type ObjectiveMode, type ObjectiveTargets } from "@/logic/objectiveEngine";
import { Target, Shield, AlertTriangle, CheckCircle, TrendingUp, Gauge } from "lucide-react";
import styles from "./ObjectivePage.module.css";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtX(n: number): string {
  return `${n.toFixed(1)}x`;
}

function fmtMo(n: number): string {
  return `${n}mo`;
}

function severityColor(severity: number): string {
  if (severity > 0.7) return "rgba(248, 113, 113, 0.9)";
  if (severity > 0.4) return "rgba(251, 191, 36, 0.9)";
  return "rgba(52, 211, 153, 0.9)";
}

function feasibilityColor(score: number): string {
  if (score >= 70) return "rgba(52, 211, 153, 0.9)";
  if (score >= 40) return "rgba(251, 191, 36, 0.9)";
  return "rgba(248, 113, 113, 0.9)";
}

const HORIZONS = [12, 24, 36] as const;
const MODES: ObjectiveMode[] = ["conservative", "base", "aggressive"];
const MODE_LABELS: Record<ObjectiveMode, string> = {
  conservative: "CONSERVATIVE",
  base: "BASE",
  aggressive: "AGGRESSIVE",
};

// ---------------------------------------------------------------------------
// SLIDER WITH TICKS
// ---------------------------------------------------------------------------

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (v: number) => void;
  suffix?: string;
}

function SliderInput({ label, value, min, max, step, format, onChange, suffix }: SliderInputProps) {
  const tickCount = Math.min(20, Math.floor((max - min) / step));
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= tickCount; i++) arr.push(i);
    return arr;
  }, [tickCount]);

  return (
    <div className={styles.inputGroup}>
      <div className={styles.inputLabel}>
        <span>{label}</span>
        <span className={styles.inputValue}>{format(value)}{suffix ?? ""}</span>
      </div>
      <div className={styles.inputRow}>
        <input
          type="number"
          className={styles.numInput}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
        />
        <div className={styles.sliderWrap}>
          <input
            type="range"
            className={styles.slider}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className={styles.tickBar}>
            {ticks.map((_, i) => (
              <span key={i} className={styles.tick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SPARKLINE
// ---------------------------------------------------------------------------

function Sparkline({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  return (
    <div className={styles.sparkline}>
      {data.map((v, i) => (
        <div
          key={i}
          className={styles.sparkBar}
          style={{ height: `${Math.max(2, (v / maxVal) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BOTTOM KPI CARD
// ---------------------------------------------------------------------------

function BottomCard({ label, value, history }: { label: string; value: string; history: number[] }) {
  return (
    <div className={styles.bottomCard}>
      <div className={styles.bottomCardLabel}>{label}</div>
      <div className={styles.bottomCardValue}>{value}</div>
      <Sparkline data={history} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function ObjectivePage() {
  const {
    horizonMonths,
    targets,
    mode,
    result,
    setHorizon,
    setMode,
    setTarget,
  } = useObjectiveStore();

  const handleTarget = useCallback(
    <K extends keyof ObjectiveTargets>(key: K) =>
      (value: ObjectiveTargets[K]) =>
        setTarget(key, value),
    [setTarget],
  );

  // Bottom strip data
  const bottomCards = useMemo(() => {
    const r = result.requirements;
    return [
      { label: "REQUIRED NRR", value: fmtPct(r.requiredNRR), data: generatePseudoHistory(r.requiredNRR) },
      { label: "MAX CHURN", value: fmtPct(r.maxChurn), data: generatePseudoHistory(r.maxChurn) },
      { label: "PIPELINE COV", value: fmtX(r.pipelineCoverage), data: generatePseudoHistory(r.pipelineCoverage) },
      { label: "CAC PAYBACK", value: fmtMo(r.cacPaybackMonths), data: generatePseudoHistory(r.cacPaybackMonths) },
      { label: "LTV/CAC", value: fmtX(r.ltvCacRatio), data: generatePseudoHistory(r.ltvCacRatio) },
      { label: "FEASIBILITY", value: `${result.feasibilityScore}`, data: generatePseudoHistory(result.feasibilityScore) },
    ];
  }, [result]);

  return (
    <div className={styles.objectivePage}>
      {/* ─── HEADER ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>OBJECTIVE</h1>
          <p>Define outcomes. STRATFIT computes structural requirements.</p>
        </div>
        <div className={styles.headerControls}>
          {/* Horizon selector */}
          <div className={styles.segmented}>
            {HORIZONS.map((h) => (
              <button
                key={h}
                className={horizonMonths === h ? styles.segBtnActive : styles.segBtn}
                onClick={() => setHorizon(h)}
              >
                {h}M
              </button>
            ))}
          </div>

          {/* Mode selector */}
          <div className={styles.segmented}>
            <span className={styles.modeLabel}>MODE</span>
            {MODES.map((m) => (
              <button
                key={m}
                className={mode === m ? styles.segBtnActive : styles.segBtn}
                onClick={() => setMode(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── THREE-PANEL GRID ─── */}
      <div className={styles.panelGrid}>
        {/* ─── LEFT: Outcome Targets ─── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <Target size={12} style={{ marginRight: 6, opacity: 0.6 }} />
            Outcome Targets
          </h3>

          <SliderInput
            label="ARR Target"
            value={targets.arr}
            min={500_000}
            max={100_000_000}
            step={500_000}
            format={fmtCurrency}
            onChange={handleTarget("arr")}
          />
          <SliderInput
            label="Growth Target"
            value={targets.growth}
            min={0}
            max={200}
            step={1}
            format={(v) => `${v}`}
            onChange={handleTarget("growth")}
            suffix="%"
          />
          <SliderInput
            label="Gross Margin Target"
            value={targets.grossMargin}
            min={10}
            max={95}
            step={1}
            format={(v) => `${v}`}
            onChange={handleTarget("grossMargin")}
            suffix="%"
          />
          <SliderInput
            label="Net Burn Target"
            value={targets.burn}
            min={10_000}
            max={2_000_000}
            step={10_000}
            format={fmtCurrency}
            onChange={handleTarget("burn")}
            suffix="/mo"
          />
          <SliderInput
            label="Runway Target"
            value={targets.runway}
            min={3}
            max={48}
            step={1}
            format={(v) => `${v}`}
            onChange={handleTarget("runway")}
            suffix=" months"
          />
          <SliderInput
            label="Survival Prob Target"
            value={targets.survival}
            min={20}
            max={99}
            step={1}
            format={(v) => `${v}`}
            onChange={handleTarget("survival")}
            suffix="%"
          />
        </div>

        {/* ─── CENTER: Requirements Lens ─── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <Gauge size={12} style={{ marginRight: 6, opacity: 0.6 }} />
            Requirements Lens
          </h3>

          {/* Feasibility gauge */}
          <div className={styles.feasibilityWrap}>
            <span className={styles.reqLabel}>FEASIBILITY</span>
            <div className={styles.feasibilityBar}>
              <div
                className={styles.feasibilityFill}
                style={{
                  width: `${result.feasibilityScore}%`,
                  background: feasibilityColor(result.feasibilityScore),
                }}
              />
            </div>
            <span
              className={styles.feasibilityText}
              style={{ color: feasibilityColor(result.feasibilityScore) }}
            >
              {result.feasibilityScore}
            </span>
          </div>

          {/* Derived requirements */}
          <RequirementCard label="Required NRR" value={fmtPct(result.requirements.requiredNRR)} />
          <RequirementCard label="Max Churn" value={fmtPct(result.requirements.maxChurn)} />
          <RequirementCard label="Pipeline Coverage" value={fmtX(result.requirements.pipelineCoverage)} />
          <RequirementCard label="CAC Payback" value={fmtMo(result.requirements.cacPaybackMonths)} />
          <RequirementCard label="LTV / CAC" value={fmtX(result.requirements.ltvCacRatio)} />
          <RequirementCard label="Sales Velocity" value={`${result.requirements.requiredSalesVelocity} deals/mo`} />
          <RequirementCard label="Headcount Ceiling" value={`${result.requirements.headcountCeiling}`} />
          <RequirementCard label="Op Discipline" value={`${result.requirements.operatingDisciplineScore}/100`} />
        </div>

        {/* ─── RIGHT: Objective Intelligence ─── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <Shield size={12} style={{ marginRight: 6, opacity: 0.6 }} />
            Objective Intelligence
          </h3>

          {/* Top 3 constraints */}
          <div className={styles.sectionLabel}>CONSTRAINT RANK</div>
          {result.constraintRank.slice(0, 3).map((c) => (
            <div key={c.id} className={styles.constraintItem}>
              <div
                className={styles.severityDot}
                style={{ background: severityColor(c.severity) }}
              />
              <div>
                <div className={styles.constraintLabel}>{c.label} — {Math.round(c.severity * 100)}%</div>
                <div className={styles.constraintNote}>{c.note}</div>
              </div>
            </div>
          ))}

          <div className={styles.sectionDivider} />

          {/* Primary constraint */}
          <div className={styles.sectionLabel}>PRIMARY CONSTRAINT</div>
          <div className={styles.primaryConstraint}>{result.primaryConstraint}</div>

          {/* Success conditions */}
          <div className={styles.sectionLabel}>SUCCESS CONDITIONS</div>
          {result.successConditions.map((cond, i) => (
            <div key={i} className={styles.checklistItem}>
              <CheckCircle size={11} className={styles.checkIcon} />
              <span>{cond}</span>
            </div>
          ))}

          <div className={styles.sectionDivider} />

          {/* Risk flags */}
          <div className={styles.sectionLabel}>RISK FLAGS</div>
          {result.riskFlags.length === 0 ? (
            <div className={styles.checklistItem}>
              <CheckCircle size={11} className={styles.checkIcon} />
              <span>No structural conflicts detected</span>
            </div>
          ) : (
            result.riskFlags.map((flag, i) => (
              <div key={i} className={styles.conflictItem}>
                <AlertTriangle size={11} className={styles.flagIcon} />
                <span>{flag}</span>
              </div>
            ))
          )}

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <>
              <div className={styles.sectionDivider} />
              <div className={styles.sectionLabel}>TARGET CONFLICTS</div>
              {result.conflicts.map((c) => (
                <div key={c.id} className={styles.conflictItem}>
                  <AlertTriangle size={11} className={styles.flagIcon} />
                  <span>{c.message}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ─── BOTTOM KPI STRIP ─── */}
      <div className={styles.bottomStrip}>
        {bottomCards.map((card, i) => (
          <BottomCard key={i} label={card.label} value={card.value} history={card.data} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function RequirementCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.reqCard}>
      <span className={styles.reqLabel}>{label}</span>
      <span className={styles.reqValue}>{value}</span>
    </div>
  );
}


