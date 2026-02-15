// src/onboard/tabs/StrategicTab.tsx

import React from "react";
import type { FastestDownside, HorizonMonths, OnboardingData, PrimaryConstraint, StrategicFocus, YesNoUncertain } from "../schema";
import { GlassCard } from "../components/GlassCard";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sfOn-field">
      <div className="sfOn-labelRow">
        <label className="sfOn-label">{label}</label>
        {hint ? <div className="sfOn-hint">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function StrategicTab({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const s = data.strategicPosture;
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => {
    onChange({ strategicPosture: { ...s, [k]: v } });
  };

  return (
    <div className="sfOn-tab">
      <GlassCard
        title="Strategic Posture"
        subtitle="Top-level policy controls — short lists by design"
        tone="primary"
      >
        <div className="sfOn-grid2">
          <Field label="Focus" hint="Primary optimization goal">
            <select className="sfOn-input" value={s.focus} onChange={(e) => set("focus", e.target.value as StrategicFocus)}>
              <option value="Growth">Growth</option>
              <option value="Profitability">Profitability</option>
              <option value="Stabilise">Stabilise</option>
            </select>
          </Field>
          <Field label="Raise intent" hint="Near-term appetite">
            <select className="sfOn-input" value={s.raiseIntent} onChange={(e) => set("raiseIntent", e.target.value as YesNoUncertain)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Uncertain">Uncertain</option>
            </select>
          </Field>

          <Field label="Horizon" hint="Planning window">
            <select
              className="sfOn-input"
              value={String(s.horizon)}
              onChange={(e) => set("horizon", Number(e.target.value) as HorizonMonths)}
            >
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
            </select>
          </Field>
          <Field label="Primary constraint" hint="Current limiting factor">
            <select
              className="sfOn-input"
              value={s.primaryConstraint}
              onChange={(e) => set("primaryConstraint", e.target.value as PrimaryConstraint)}
            >
              <option value="Cash runway">Cash runway</option>
              <option value="Debt servicing">Debt servicing</option>
              <option value="Payroll commitments">Payroll commitments</option>
              <option value="Customer concentration">Customer concentration</option>
              <option value="Nothing material">Nothing material</option>
            </select>
          </Field>

          <div className="sfOn-field sfOn-field--span2">
            <Field label="Fastest downside" hint="What collapses first if conditions worsen?">
              <select
                className="sfOn-input"
                value={s.fastestDownside}
                onChange={(e) => set("fastestDownside", e.target.value as FastestDownside)}
              >
                <option value="Revenue volatility">Revenue volatility</option>
                <option value="Fixed cost rigidity">Fixed cost rigidity</option>
                <option value="Capital structure">Capital structure</option>
                <option value="Customer churn">Customer churn</option>
                <option value="Regulatory exposure">Regulatory exposure</option>
              </select>
            </Field>
          </div>

          <div className="sfOn-field sfOn-field--span2">
            <div className="sfOn-note">
              These selectors are intentionally short. They drive baseline weighting and guardrails—precision comes later in Strategy.
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}


