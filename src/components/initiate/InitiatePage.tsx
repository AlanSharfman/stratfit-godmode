import React, { useEffect, useMemo, useState } from "react";
import {
  buildStructuralProfile,
  deriveCapitalPhysics,
  mapOperatingStructureToStructuralFactors,
  type BusinessModel,
  type CurrencyCode,
  type InitiateCapitalPhysics,
  type InitiateEntityContext,
  type InitiateOperatingStructure,
  type Stage,
} from "./derive";
import { useEngineStore } from "@/state/engineStore";

type InitiateTabId = "entity" | "capital" | "operating" | "profile";

const STORAGE_KEY = "sf.initiate.v1";

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function fmtMoney(n: number, currency: CurrencyCode) {
  const v = Number.isFinite(n) ? n : 0;
  const symbol =
    currency === "USD" ? "$" :
    currency === "EUR" ? "€" :
    currency === "GBP" ? "£" :
    currency === "JPY" ? "¥" :
    "$";
  // Institutional: compact, no gimmicks
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${symbol}${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${symbol}${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${symbol}${Math.round(v).toLocaleString()}`;
  return `${symbol}${v.toFixed(0)}`;
}

function fmtPct(n: number, digits = 1) {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(digits)}%`;
}

function loadInitial(): {
  entity: InitiateEntityContext;
  capital: InitiateCapitalPhysics;
  operating: InitiateOperatingStructure;
  tab: InitiateTabId;
} {
  const fallback = {
    tab: "entity" as const,
    entity: {
      companyName: "STRATFIT Demo Co",
      industry: "B2B SaaS",
      businessModel: "SaaS" as BusinessModel,
      stage: "Early ARR" as Stage,
      revenueModel: "Subscription",
      currency: "USD" as CurrencyCode,
      purpose: "Anchor defaults + structural assumptions for scenario modelling.",
    },
    capital: {
      cashOnHand: 1_150_000,
      revenueInputMode: "ARR" as const,
      arr: 1_020_000,
      monthlyRevenue: 85_000,
      momGrowthPct: 6.3,
      grossMarginPct: 78,
      monthlyOpex: 265_000,
      debtObligationsMonthly: 0,
      headcount: 18,
      committedFunding: 0,
    },
    operating: {
      revenueConcentrationPct: 22,
      churnBandPct: 1.6,
      salesCycleDays: 54,
      pipelineReliabilityPct: 62,
      fixedVsVariableCostRatioPct: 72,
      keyDependencyExposurePct: 28,
      hiringPlan12mo: "Selective hiring aligned to growth efficiency targets.",
    },
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function RailItem({
  idx,
  label,
  active,
  onClick,
}: {
  idx: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg px-3 py-2 text-left text-sm transition",
        "border border-white/10 bg-black/20 hover:bg-white/5",
        active ? "text-white border-white/20" : "text-white/70",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div
          className={[
            "h-6 w-6 rounded-md grid place-items-center text-xs font-semibold",
            active ? "bg-slate-200/10 text-slate-100 border border-white/15" : "bg-black/25 text-white/60 border border-white/10",
          ].join(" ")}
        >
          {idx}
        </div>
        <div className="font-medium tracking-wide">{label}</div>
      </div>
    </button>
  );
}

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
    <label className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/60">{label}</div>
        {hint ? <div className="text-[11px] text-white/35">{hint}</div> : null}
      </div>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white/90 outline-none focus:border-white/20 focus:bg-black/35"
    />
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white/90 outline-none focus:border-white/20 focus:bg-black/35"
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white/90 outline-none focus:border-white/20 focus:bg-black/35"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ProfileBar({ label, value01 }: { label: string; value01: number }) {
  const v = clamp(value01, 0, 1);
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium text-white/75">{label}</div>
        <div className="text-[12px] font-semibold text-white/70">{Math.round(v * 100)}%</div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
        <div className="h-full bg-slate-200/30" style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );
}

export function InitiatePage({ onBaselineLocked }: { onBaselineLocked?: () => void } = {}) {
  const [{ entity, capital, operating, tab }, setState] = useState(loadInitial);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ entity, capital, operating, tab }));
    } catch {}
  }, [entity, capital, operating, tab]);

  const derived = useMemo(() => deriveCapitalPhysics(capital), [capital]);
  const structural = useMemo(
    () => mapOperatingStructureToStructuralFactors({ operating, derived }),
    [operating, derived]
  );
  const profile = useMemo(() => buildStructuralProfile({ operating, derived }), [operating, derived]);

  return (
    <div className="h-full w-full p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-4">
          <div className="text-[12px] tracking-[0.22em] uppercase text-white/45">STRATFIT</div>
          <div className="mt-1 flex items-baseline justify-between gap-6">
            <div>
              <div className="text-[18px] font-semibold tracking-wide text-white/90">INITIATE</div>
              <div className="mt-1 text-[12px] text-white/50">
                Institutional baseline inputs to anchor scenario modelling.
              </div>
            </div>
            <div className="text-[12px] text-white/35">Draft — not locked</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Left rail */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/55">Baseline Input</div>
              <div className="mt-1 text-sm font-medium text-white/85">{entity.companyName || "—"}</div>
              <div className="mt-0.5 text-[12px] text-white/45">{entity.industry || "—"}</div>
            </div>

            <div className="grid gap-2">
              <RailItem idx={1} label="Entity & Context" active={tab === "entity"} onClick={() => setState((s) => ({ ...s, tab: "entity" }))} />
              <RailItem idx={2} label="Capital Physics" active={tab === "capital"} onClick={() => setState((s) => ({ ...s, tab: "capital" }))} />
              <RailItem idx={3} label="Operating Structure" active={tab === "operating"} onClick={() => setState((s) => ({ ...s, tab: "operating" }))} />
              <RailItem idx={4} label="Structural Profile" active={tab === "profile"} onClick={() => setState((s) => ({ ...s, tab: "profile" }))} />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/55">Purpose</div>
              <div className="mt-1 text-[12px] leading-relaxed text-white/45">
                Defaults + structural assumptions. Derived metrics are computed automatically (never asked).
              </div>
            </div>
          </div>

          {/* Main panel */}
          <div className="rounded-2xl border border-white/10 bg-black/20 shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Summary strip */}
            <div className="border-b border-white/10 bg-black/25 p-3">
              <div className="grid gap-2 md:grid-cols-4">
                <SummaryMetric
                  label="Runway"
                  value={derived.runwayMonths == null ? "—" : `${derived.runwayMonths.toFixed(1)} mo`}
                />
                <SummaryMetric
                  label="Burn multiple"
                  value={derived.burnMultiple == null ? "—" : `${derived.burnMultiple.toFixed(2)}×`}
                />
                <SummaryMetric
                  label="Net burn (monthly)"
                  value={fmtMoney(derived.netBurnMonthly, entity.currency)}
                />
                <SummaryMetric
                  label="Capital durability"
                  value={derived.capitalDurabilityBand.toUpperCase()}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-5">
              {tab === "entity" && (
                <Section title="Entity & Context" subtitle="Model defaults + structural assumptions.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Company name">
                      <Input
                        value={entity.companyName}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, companyName: v } }))}
                        placeholder="Company"
                      />
                    </Field>
                    <Field label="Industry">
                      <Input
                        value={entity.industry}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, industry: v } }))}
                        placeholder="Industry"
                      />
                    </Field>
                    <Field label="Business model">
                      <Select
                        value={entity.businessModel}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, businessModel: v } }))}
                        options={[
                          { value: "SaaS", label: "SaaS" },
                          { value: "Marketplace", label: "Marketplace" },
                          { value: "Hybrid", label: "Hybrid" },
                          { value: "Services", label: "Services" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </Field>
                    <Field label="Stage">
                      <Select
                        value={entity.stage}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, stage: v } }))}
                        options={[
                          { value: "Pre-ARR", label: "Pre-ARR" },
                          { value: "Early ARR", label: "Early ARR" },
                          { value: "Growth", label: "Growth" },
                          { value: "Scale", label: "Scale" },
                        ]}
                      />
                    </Field>
                    <Field label="Revenue model">
                      <Input
                        value={entity.revenueModel}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, revenueModel: v } }))}
                        placeholder="Subscription / Usage / Transaction"
                      />
                    </Field>
                    <Field label="Currency">
                      <Select
                        value={entity.currency}
                        onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, currency: v } }))}
                        options={[
                          { value: "USD", label: "USD" },
                          { value: "EUR", label: "EUR" },
                          { value: "GBP", label: "GBP" },
                          { value: "CAD", label: "CAD" },
                          { value: "AUD", label: "AUD" },
                          { value: "JPY", label: "JPY" },
                          { value: "INR", label: "INR" },
                          { value: "BRL", label: "BRL" },
                          { value: "MXN", label: "MXN" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Purpose">
                        <Input
                          value={entity.purpose}
                          onChange={(v) => setState((s) => ({ ...s, entity: { ...s.entity, purpose: v } }))}
                          placeholder="Why are we modelling?"
                        />
                      </Field>
                    </div>
                  </div>
                </Section>
              )}

              {tab === "capital" && (
                <Section title="Capital Physics" subtitle="Minimum viable truth inputs. Derived metrics computed automatically.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Cash on hand" hint={fmtMoney(capital.cashOnHand, entity.currency)}>
                      <NumberInput
                        value={capital.cashOnHand}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, cashOnHand: Math.max(0, v) } }))}
                        step={10_000}
                        min={0}
                      />
                    </Field>

                    <Field label="Revenue input">
                      <Select
                        value={capital.revenueInputMode}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, revenueInputMode: v } }))}
                        options={[
                          { value: "ARR", label: "ARR" },
                          { value: "MonthlyRevenue", label: "Monthly revenue" },
                        ]}
                      />
                    </Field>

                    <Field label="ARR" hint={capital.revenueInputMode === "ARR" ? "primary" : "derived"}>
                      <NumberInput
                        value={capital.arr}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, arr: Math.max(0, v) } }))}
                        step={25_000}
                        min={0}
                      />
                    </Field>

                    <Field label="Monthly revenue" hint={capital.revenueInputMode === "MonthlyRevenue" ? "primary" : "derived"}>
                      <NumberInput
                        value={capital.monthlyRevenue}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, monthlyRevenue: Math.max(0, v) } }))}
                        step={5_000}
                        min={0}
                      />
                    </Field>

                    <Field label="MoM growth %" hint={fmtPct(capital.momGrowthPct, 1)}>
                      <NumberInput
                        value={capital.momGrowthPct}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, momGrowthPct: clamp(v, -50, 80) } }))}
                        step={0.1}
                      />
                    </Field>

                    <Field label="Gross margin %" hint={fmtPct(capital.grossMarginPct, 0)}>
                      <NumberInput
                        value={capital.grossMarginPct}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, grossMarginPct: clamp(v, 0, 95) } }))}
                        step={1}
                        min={0}
                        max={95}
                      />
                    </Field>

                    <Field label="Monthly opex" hint={fmtMoney(capital.monthlyOpex, entity.currency)}>
                      <NumberInput
                        value={capital.monthlyOpex}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, monthlyOpex: Math.max(0, v) } }))}
                        step={5_000}
                        min={0}
                      />
                    </Field>

                    <Field label="Debt obligations (monthly)" hint={fmtMoney(capital.debtObligationsMonthly, entity.currency)}>
                      <NumberInput
                        value={capital.debtObligationsMonthly}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, debtObligationsMonthly: Math.max(0, v) } }))}
                        step={1_000}
                        min={0}
                      />
                    </Field>

                    <Field label="Headcount">
                      <NumberInput
                        value={capital.headcount}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, headcount: Math.max(0, Math.round(v)) } }))}
                        step={1}
                        min={0}
                      />
                    </Field>

                    <Field label="Committed funding (optional)" hint={fmtMoney(capital.committedFunding, entity.currency)}>
                      <NumberInput
                        value={capital.committedFunding}
                        onChange={(v) => setState((s) => ({ ...s, capital: { ...s.capital, committedFunding: Math.max(0, v) } }))}
                        step={25_000}
                        min={0}
                      />
                    </Field>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-black/15 p-4 md:grid-cols-3">
                    <Derived label="Net burn (monthly)" value={fmtMoney(derived.netBurnMonthly, entity.currency)} />
                    <Derived label="Burn multiple" value={derived.burnMultiple == null ? "—" : `${derived.burnMultiple.toFixed(2)}×`} />
                    <Derived label="Runway" value={derived.runwayMonths == null ? "—" : `${derived.runwayMonths.toFixed(1)} mo`} />
                    <Derived label="Operating leverage" value={derived.operatingLeverage == null ? "—" : derived.operatingLeverage.toFixed(2)} />
                    <Derived label="Contribution margin" value={fmtMoney(derived.contributionMarginMonthly, entity.currency)} />
                    <Derived label="Contribution margin %" value={fmtPct(derived.contributionMarginPct * 100, 0)} />
                  </div>
                </Section>
              )}

              {tab === "operating" && (
                <Section title="Operating Structure" subtitle="Mapped to structural risk factors. No fitness scores.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Revenue concentration %" hint="top customer / top segment exposure">
                      <NumberInput
                        value={operating.revenueConcentrationPct}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, revenueConcentrationPct: clamp(v, 0, 100) } }))}
                        step={1}
                        min={0}
                        max={100}
                      />
                    </Field>
                    <Field label="Churn band %" hint="monthly churn (band midpoint)">
                      <NumberInput
                        value={operating.churnBandPct}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, churnBandPct: clamp(v, 0, 30) } }))}
                        step={0.1}
                        min={0}
                        max={30}
                      />
                    </Field>
                    <Field label="Sales cycle length (days)">
                      <NumberInput
                        value={operating.salesCycleDays}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, salesCycleDays: clamp(v, 0, 365) } }))}
                        step={1}
                        min={0}
                        max={365}
                      />
                    </Field>
                    <Field label="Pipeline reliability %">
                      <NumberInput
                        value={operating.pipelineReliabilityPct}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, pipelineReliabilityPct: clamp(v, 0, 100) } }))}
                        step={1}
                        min={0}
                        max={100}
                      />
                    </Field>
                    <Field label="Fixed vs variable cost ratio (% fixed)">
                      <NumberInput
                        value={operating.fixedVsVariableCostRatioPct}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, fixedVsVariableCostRatioPct: clamp(v, 0, 100) } }))}
                        step={1}
                        min={0}
                        max={100}
                      />
                    </Field>
                    <Field label="Key dependency exposure %">
                      <NumberInput
                        value={operating.keyDependencyExposurePct}
                        onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, keyDependencyExposurePct: clamp(v, 0, 100) } }))}
                        step={1}
                        min={0}
                        max={100}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Hiring plan (12 months)" hint="plain language, institutional">
                        <Input
                          value={operating.hiringPlan12mo}
                          onChange={(v) => setState((s) => ({ ...s, operating: { ...s.operating, hiringPlan12mo: v } }))}
                          placeholder="Plan"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-black/15 p-4 md:grid-cols-2">
                    <Derived label="Volatility coefficient" value={structural.volatilityCoefficient.toFixed(2)} />
                    <Derived label="Fragility index" value={structural.fragilityIndex.toFixed(2)} />
                    <Derived label="Shock amplification factor" value={structural.shockAmplificationFactor.toFixed(2)} />
                    <Derived label="Structural sensitivity slope" value={structural.structuralSensitivitySlope.toFixed(2)} />
                  </div>
                </Section>
              )}

              {tab === "profile" && (
                <Section title="STRATFIT Structural Profile" subtitle="Five-dimension profile. Explainable. Institutional.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/55">
                        Profile
                      </div>
                      <div className="mt-3 grid gap-3">
                        <ProfileBar label="Capital Durability" value01={profile.capitalDurability01} />
                        <ProfileBar label="Margin Resilience" value01={profile.marginResilience01} />
                        <ProfileBar label="Volatility Exposure" value01={profile.volatilityExposure01} />
                        <ProfileBar label="Funding Pressure" value01={profile.fundingPressure01} />
                        <ProfileBar label="Operating Leverage" value01={profile.operatingLeverage01} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                      <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/55">
                        Derived — explainable components
                      </div>
                      <div className="mt-3 grid gap-3 text-[12px] text-white/60">
                        <div className="flex items-center justify-between gap-4">
                          <span>Runway</span>
                          <span className="font-semibold text-white/75">{derived.runwayMonths == null ? "—" : `${derived.runwayMonths.toFixed(1)} mo`}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Net burn</span>
                          <span className="font-semibold text-white/75">{fmtMoney(derived.netBurnMonthly, entity.currency)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Burn multiple</span>
                          <span className="font-semibold text-white/75">{derived.burnMultiple == null ? "—" : `${derived.burnMultiple.toFixed(2)}×`}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Contribution margin</span>
                          <span className="font-semibold text-white/75">{fmtPct(derived.contributionMarginPct * 100, 0)}</span>
                        </div>
                        <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3 text-[12px] leading-relaxed text-white/45">
                          This is not a "fitness score". It's a structural profile derived from your baseline truth inputs and operating structure.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LOCK BASELINE — Submit action */}
                  <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div>
                      <div className="text-[12px] font-semibold text-white/80">
                        {locked ? "✓ Baseline locked" : "Ready to lock baseline?"}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        {locked
                          ? `Locked at ${new Date().toLocaleTimeString()} — inputs feed the engine.`
                          : "This populates the engine with your structural truth. You can revise later."}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        // Persist to localStorage (already done via useEffect)
                        // Mark as locked locally
                        setLocked(true);

                        // Push summary into engine store so BASELINE System State shows it
                        useEngineStore.getState().completeRun(
                          Math.round(
                            ((profile.capitalDurability01 + profile.marginResilience01 + (1 - profile.volatilityExposure01) + (1 - profile.fundingPressure01) + profile.operatingLeverage01) / 5) * 100
                          )
                        );

                        // Navigate to BASELINE view
                        onBaselineLocked?.();
                      }}
                      className={[
                        "px-5 py-2.5 rounded-lg text-[12px] font-semibold tracking-[0.1em] uppercase transition-all",
                        locked
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-default"
                          : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400/50",
                      ].join(" ")}
                    >
                      {locked ? "LOCKED" : "LOCK BASELINE"}
                    </button>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 px-3 py-2">
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/45">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold text-white/85">{value}</div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-white/55">{title}</div>
        {subtitle ? <div className="mt-1 text-[12px] text-white/45">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Derived({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/45">{label}</div>
      <div className="text-[12px] font-semibold text-white/80">{value}</div>
    </div>
  );
}


