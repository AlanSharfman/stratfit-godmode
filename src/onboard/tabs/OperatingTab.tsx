// src/onboard/tabs/OperatingTab.tsx

import React from "react";
import type { OnboardingData, OperatingDynamicsAdvanced, TriLevel } from "../schema";
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

export function OperatingTab({
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
  const core = data.operatingDynamicsCore;
  const adv: OperatingDynamicsAdvanced = data.operatingDynamicsAdvanced ?? {
    cac: "",
    ltv: "",
    supplierConcentrationPercent: "",
    productComplexity: "Medium",
    marketExpansionExposure: "Medium",
  };

  const setCore = <K extends keyof typeof core>(k: K, v: (typeof core)[K]) => {
    onChange({ operatingDynamicsCore: { ...core, [k]: v } });
  };
  const setAdv = <K extends keyof OperatingDynamicsAdvanced>(k: K, v: OperatingDynamicsAdvanced[K]) => {
    onChange({ operatingDynamicsAdvanced: { ...adv, [k]: v } });
  };

  return (
    <div className="sfOn-tab">
      <GlassCard
        title="Operating Dynamics"
        subtitle="Churn, cycle time, ACV, and operational risk descriptors"
        tone="primary"
      >
        <div className="sfOn-grid2">
          <Field label="Churn (%)" hint="Annualized" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.churnPercent} onChange={(e) => setCore("churnPercent", e.target.value)} placeholder="e.g. 10" inputMode="decimal" />
          </Field>
          <Field label="Sales cycle (months)" hint="From first touch to close" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.salesCycleMonths} onChange={(e) => setCore("salesCycleMonths", e.target.value)} placeholder="e.g. 3.5" inputMode="decimal" />
          </Field>

          <Field label="ACV" hint="Avg contract value" numeric>
            <input className="sfOn-input sfOn-input--num" value={core.acv} onChange={(e) => setCore("acv", e.target.value)} placeholder="e.g. 24000" inputMode="decimal" />
          </Field>
          <Field label="Key person dependency" hint="Tri-level">
            <select
              className="sfOn-input"
              value={core.keyPersonDependency}
              onChange={(e) => setCore("keyPersonDependency", e.target.value as TriLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>

          <Field label="Customer concentration risk" hint="Tri-level">
            <select
              className="sfOn-input"
              value={core.customerConcentrationRisk}
              onChange={(e) => setCore("customerConcentrationRisk", e.target.value as TriLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>
          <Field label="Regulatory exposure" hint="Tri-level">
            <select
              className="sfOn-input"
              value={core.regulatoryExposure}
              onChange={(e) => setCore("regulatoryExposure", e.target.value as TriLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>
        </div>
      </GlassCard>

      <AdvancedSection
        title="Operating Dynamics"
        subtitle="Optional unit economics and supply-side exposure"
        open={advancedOpen}
        onToggle={onToggleAdvanced}
      >
        <div className="sfOn-grid2">
          <Field label="CAC" hint="Blended" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.cac} onChange={(e) => setAdv("cac", e.target.value)} placeholder="e.g. 3200" inputMode="decimal" />
          </Field>
          <Field label="LTV" hint="Blended" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.ltv} onChange={(e) => setAdv("ltv", e.target.value)} placeholder="e.g. 22000" inputMode="decimal" />
          </Field>

          <Field label="Supplier concentration (%)" hint="Largest vendor share" numeric>
            <input className="sfOn-input sfOn-input--num" value={adv.supplierConcentrationPercent} onChange={(e) => setAdv("supplierConcentrationPercent", e.target.value)} placeholder="e.g. 25" inputMode="decimal" />
          </Field>
          <Field label="Product complexity" hint="Tri-level">
            <select
              className="sfOn-input"
              value={adv.productComplexity}
              onChange={(e) => setAdv("productComplexity", e.target.value as TriLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>

          <Field label="Market expansion exposure" hint="Tri-level">
            <select
              className="sfOn-input"
              value={adv.marketExpansionExposure}
              onChange={(e) => setAdv("marketExpansionExposure", e.target.value as TriLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>
          <div className="sfOn-field">
            <div className="sfOn-note">
              Use directional inputs—tri-level controls reduce fragility and keep option lists short by design.
            </div>
          </div>
        </div>
      </AdvancedSection>
    </div>
  );
}


