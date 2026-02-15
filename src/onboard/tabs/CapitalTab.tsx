// src/onboard/tabs/CapitalTab.tsx

import React from "react";
import type { CapitalStructureAdvanced, LiquidationPreference, OnboardingData } from "../schema";
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

export function CapitalTab({
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
  const core = data.capitalStructureCore;
  const adv: CapitalStructureAdvanced = data.capitalStructureAdvanced ?? {
    convertibleNotes: "",
    preferredEquity: "",
    liquidationPreference: "None",
    founderOwnershipPercent: "",
    investorOwnershipPercent: "",
    optionPoolPercent: "",
  };

  const setCore = <K extends keyof typeof core>(k: K, v: (typeof core)[K]) => {
    onChange({ capitalStructureCore: { ...core, [k]: v } });
  };
  const setAdv = <K extends keyof CapitalStructureAdvanced>(k: K, v: CapitalStructureAdvanced[K]) => {
    onChange({ capitalStructureAdvanced: { ...adv, [k]: v } });
  };

  return (
    <div className="sfOn-tab">
      <GlassCard
        title="Capital Structure"
        subtitle="Debt pressure, servicing cadence, and raising context"
        tone="primary"
      >
        <div className="sfOn-grid2">
          <Field label="Total debt" hint="Outstanding" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.totalDebt} onChange={(e) => setCore("totalDebt", e.target.value)} placeholder="e.g. 800000" inputMode="decimal" />
          </Field>
          <Field label="Interest rate (%)" hint="Weighted avg" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.interestRate} onChange={(e) => setCore("interestRate", e.target.value)} placeholder="e.g. 9.5" inputMode="decimal" />
          </Field>

          <Field label="Monthly debt service" hint="Principal + interest" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.monthlyDebtService} onChange={(e) => setCore("monthlyDebtService", e.target.value)} placeholder="e.g. 28000" inputMode="decimal" />
          </Field>
          <Field label="Last raise amount" hint="Total round size" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.lastRaiseAmount} onChange={(e) => setCore("lastRaiseAmount", e.target.value)} placeholder="e.g. 5000000" inputMode="decimal" />
          </Field>

          <Field label="Last raise date" hint="YYYY-MM" >
            <input className="sfOn-input" value={core.lastRaiseDate} onChange={(e) => setCore("lastRaiseDate", e.target.value)} placeholder="2025-08" />
          </Field>
          <div className="sfOn-field">
            <div className="sfOn-note">
              We keep this compact on purpose—capital structure is captured as constraints, not a cap-table builder.
            </div>
          </div>
        </div>
      </GlassCard>

      <AdvancedSection
        title="Capital Structure"
        subtitle="Optional detail for ownership and liquidation pressure"
        open={advancedOpen}
        onToggle={onToggleAdvanced}
      >
        <div className="sfOn-grid2">
          <Field label="Convertible notes" hint="Outstanding" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.convertibleNotes} onChange={(e) => setAdv("convertibleNotes", e.target.value)} placeholder="e.g. 400000" inputMode="decimal" />
          </Field>
          <Field label="Preferred equity" hint="Invested" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.preferredEquity} onChange={(e) => setAdv("preferredEquity", e.target.value)} placeholder="e.g. 7500000" inputMode="decimal" />
          </Field>

          <Field label="Liquidation preference" hint="Controlled list">
            <select
              className="sfOn-input"
              value={adv.liquidationPreference}
              onChange={(e) => setAdv("liquidationPreference", e.target.value as LiquidationPreference)}
            >
              <option value="None">None</option>
              <option value="1x">1x</option>
              <option value="1.5x">1.5x</option>
              <option value="2x+">2x+</option>
            </select>
          </Field>
          <Field label="Founder ownership (%)" hint="Post-money" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.founderOwnershipPercent} onChange={(e) => setAdv("founderOwnershipPercent", e.target.value)} placeholder="e.g. 38" inputMode="decimal" />
          </Field>

          <Field label="Investor ownership (%)" hint="Post-money" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.investorOwnershipPercent} onChange={(e) => setAdv("investorOwnershipPercent", e.target.value)} placeholder="e.g. 52" inputMode="decimal" />
          </Field>
          <Field label="Option pool (%)" hint="Allocated" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.optionPoolPercent} onChange={(e) => setAdv("optionPoolPercent", e.target.value)} placeholder="e.g. 10" inputMode="decimal" />
          </Field>
        </div>
      </AdvancedSection>
    </div>
  );
}


