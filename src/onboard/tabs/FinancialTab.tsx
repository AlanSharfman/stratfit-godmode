// src/onboard/tabs/FinancialTab.tsx

import React from "react";
import type { FinancialBaselineAdvanced, OnboardingData } from "../schema";
import { GlassCard } from "../components/GlassCard";
import { AdvancedSection } from "../components/AdvancedSection";

function Field({
  label,
  hint,
  numeric,
  children,
}: {
  label: string;
  hint?: string;
  numeric?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="sfOn-field">
      <div className="sfOn-labelRow">
        <label className="sfOn-label">{label}</label>
        {hint ? <div className="sfOn-hint">{hint}</div> : null}
      </div>
      <div className={numeric ? "sfOn-numeric" : ""}>{children}</div>
    </div>
  );
}

export function FinancialTab({
  data,
  advancedOpen,
  onToggleAdvanced,
  onChange,
}: {
  data: OnboardingData;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const core = data.financialBaselineCore;
  const adv: FinancialBaselineAdvanced = data.financialBaselineAdvanced ?? {
    recurringRevenuePercent: "",
    seasonality: "None",
    fixedCosts: "",
    variableCostPercent: "",
    ebitda: "",
    operatingMargin: "",
    internationalRevenuePercent: "",
  };

  const setCore = <K extends keyof typeof core>(k: K, v: (typeof core)[K]) => {
    onChange({ financialBaselineCore: { ...core, [k]: v } });
  };
  const setAdv = <K extends keyof FinancialBaselineAdvanced>(k: K, v: FinancialBaselineAdvanced[K]) => {
    onChange({ financialBaselineAdvanced: { ...adv, [k]: v } });
  };

  return (
    <div className="sfOn-tab">
      <GlassCard
        title="Financial Baseline"
        subtitle="Core performance signal (ARR, margin, burn, cash)"
        tone="primary"
      >
        <div className="sfOn-grid2">
          <Field label="ARR" hint="Annual recurring revenue" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.arr} onChange={(e) => setCore("arr", e.target.value)} placeholder="e.g. 4500000" inputMode="decimal" />
          </Field>
          <Field label="Growth rate (%)" hint="Current annualized" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.growthRate} onChange={(e) => setCore("growthRate", e.target.value)} placeholder="e.g. 28" inputMode="decimal" />
          </Field>

          <Field label="Gross margin (%)" hint="Pre-op costs" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.grossMargin} onChange={(e) => setCore("grossMargin", e.target.value)} placeholder="e.g. 72" inputMode="decimal" />
          </Field>
          <Field label="Revenue concentration (%)" hint="Top customer share" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.revenueConcentration} onChange={(e) => setCore("revenueConcentration", e.target.value)} placeholder="e.g. 18" inputMode="decimal" />
          </Field>

          <Field label="Monthly burn" hint="Net cash outflow" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.monthlyBurn} onChange={(e) => setCore("monthlyBurn", e.target.value)} placeholder="e.g. 220000" inputMode="decimal" />
          </Field>
          <Field label="Cash on hand" hint="Liquid cash" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.cashOnHand} onChange={(e) => setCore("cashOnHand", e.target.value)} placeholder="e.g. 1500000" inputMode="decimal" />
          </Field>

          <Field label="Payroll" hint="Monthly" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.payroll} onChange={(e) => setCore("payroll", e.target.value)} placeholder="e.g. 180000" inputMode="decimal" />
          </Field>
          <Field label="Headcount" hint="Current FTE" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.headcount} onChange={(e) => setCore("headcount", e.target.value)} placeholder="e.g. 24" inputMode="numeric" />
          </Field>
        </div>
      </GlassCard>

      <AdvancedSection
        title="Financial Baseline"
        subtitle="Adds texture without increasing baseline fragility"
        open={advancedOpen}
        onToggle={onToggleAdvanced}
      >
        <div className="sfOn-grid2">
          <Field label="Recurring revenue (%)" hint="Subscription/contracted" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.recurringRevenuePercent} onChange={(e) => setAdv("recurringRevenuePercent", e.target.value)} placeholder="e.g. 92" inputMode="decimal" />
          </Field>
          <Field label="Seasonality" hint="Controlled list">
            <select className="sfOn-input" value={adv.seasonality} onChange={(e) => setAdv("seasonality", e.target.value)}>
              <option value="None">None</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </Field>

          <Field label="Fixed costs" hint="Monthly" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.fixedCosts} onChange={(e) => setAdv("fixedCosts", e.target.value)} placeholder="e.g. 120000" inputMode="decimal" />
          </Field>
          <Field label="Variable cost (%)" hint="COGS variability" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.variableCostPercent} onChange={(e) => setAdv("variableCostPercent", e.target.value)} placeholder="e.g. 18" inputMode="decimal" />
          </Field>

          <Field label="EBITDA (%)" hint="Approximate" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.ebitda} onChange={(e) => setAdv("ebitda", e.target.value)} placeholder="e.g. -12" inputMode="decimal" />
          </Field>
          <Field label="Operating margin (%)" hint="Approximate" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.operatingMargin} onChange={(e) => setAdv("operatingMargin", e.target.value)} placeholder="e.g. -18" inputMode="decimal" />
          </Field>

          <Field label="International revenue (%)" hint="Share of ARR" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.internationalRevenuePercent} onChange={(e) => setAdv("internationalRevenuePercent", e.target.value)} placeholder="e.g. 15" inputMode="decimal" />
          </Field>
          <div className="sfOn-field sfOn-field--span2">
            <div className="sfOn-note">
              Keep these values directional—STRATFIT uses them to stabilize baseline assumptions, not to enforce accounting precision.
            </div>
          </div>
        </div>
      </AdvancedSection>
    </div>
  );
}


