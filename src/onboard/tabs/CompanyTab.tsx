// src/onboard/tabs/CompanyTab.tsx

import React from "react";
import type { OnboardingData } from "../schema";
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

export function CompanyTab({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const c = data.companyProfile;

  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => {
    onChange({ companyProfile: { ...c, [k]: v } });
  };

  return (
    <div className="sfOn-tab">
      <GlassCard
        title="Company Profile"
        subtitle="Establish identity, model, and operating perimeter"
        tone="primary"
      >
        <div className="sfOn-grid2">
          <Field label="Legal name" hint="As registered">
            <input className="sfOn-input" value={c.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="STRATFIT Holdings Ltd" />
          </Field>
          <Field label="Industry" hint="Keep high-level">
            <select className="sfOn-input" value={c.industry} onChange={(e) => set("industry", e.target.value)}>
              <option value="SaaS">SaaS</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Business model" hint="Primary revenue logic">
            <select className="sfOn-input" value={c.businessModel} onChange={(e) => set("businessModel", e.target.value)}>
              <option value="Subscription">Subscription</option>
              <option value="Usage-based">Usage-based</option>
              <option value="Transaction">Transaction</option>
              <option value="Services">Services</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Primary market" hint="Where revenue is anchored">
            <select className="sfOn-input" value={c.primaryMarket} onChange={(e) => set("primaryMarket", e.target.value)}>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="APAC">APAC</option>
              <option value="LATAM">LATAM</option>
              <option value="Middle East">Middle East</option>
              <option value="Global">Global</option>
            </select>
          </Field>

          <Field label="Primary contact" hint="Owner of baseline">
            <input className="sfOn-input" value={c.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Name" />
          </Field>
          <Field label="Title" hint="Role / function">
            <input className="sfOn-input" value={c.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} placeholder="CEO / CFO / Head of Strategy" />
          </Field>

          <Field label="Email" hint="For exports & sharing">
            <input className="sfOn-input" value={c.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="name@company.com" />
          </Field>
          <Field label="Phone" hint="Optional if email is primary">
            <input className="sfOn-input" value={c.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+1 555 123 4567" />
          </Field>
        </div>
      </GlassCard>
    </div>
  );
}


