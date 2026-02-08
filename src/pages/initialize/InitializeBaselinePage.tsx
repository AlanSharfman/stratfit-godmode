import React, { useMemo, useState } from "react";
import styles from "./InitializeBaselinePage.module.css";
import { useShallow } from "zustand/react/shallow";
import {
  useBaselineStore,
  type CurrencyCode,
  type AccessToCapital,
  type PrimaryObjective,
  type RiskAppetite,
  type BurnFlexibility,
  type HiringVelocity,
} from "@/state/onboardingStore";

const CURRENCIES: CurrencyCode[] = [
  "USD","AUD","EUR","GBP","CAD","NZD","SGD","JPY","INR","CHF","SEK","NOK","DKK","ZAR","PLN","CZK","HUF","ILS","AED","BRL","MXN",
];

const ACCESS_TO_CAPITAL: AccessToCapital[] = ["Low", "Moderate", "Strong"];
const PRIMARY_OBJECTIVE: PrimaryObjective[] = ["Runway", "ARR Growth", "Efficiency", "Profitability"];
const RISK_APPETITE: RiskAppetite[] = ["Conservative", "Balanced", "Aggressive"];
const BURN_FLEX: BurnFlexibility[] = ["Fixed", "Variable"];
const HIRING_VELOCITY: HiringVelocity[] = ["Low", "Medium", "High"];

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function toNumber(v: string) {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}
function fmtInt(n: number) {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function fmt1(n: number) {
  if (!Number.isFinite(n)) return "0.0";
  return n.toFixed(1);
}
function fmt2(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function InitializeBaselinePage({ onExit }: { onExit: () => void }) {
  const { baselineLocked, hydrated, baseline, draft, setDraft, lockBaselineFromDraft, resetBaseline } =
    useBaselineStore(
      useShallow((s) => ({
        baselineLocked: s.baselineLocked,
        hydrated: s.hydrated,
        baseline: s.baseline,
        draft: s.draft,
        setDraft: s.setDraft,
        lockBaselineFromDraft: s.lockBaselineFromDraft,
        resetBaseline: s.resetBaseline,
      }))
    );

  const lockedView = Boolean(baselineLocked && baseline);
  const view = lockedView && baseline ? baseline : draft;

  // UI toggles (pure UI, not persisted)
  const [showAdvancedFunding, setShowAdvancedFunding] = useState(true);
  const [showAdvancedRevenue, setShowAdvancedRevenue] = useState(true);
  const [showAdvancedCost, setShowAdvancedCost] = useState(true);
  const [showAdvancedPosture, setShowAdvancedPosture] = useState(true);

  // --------- Inputs (safe defaults) ----------
  const cashOnHand = Number(view.metrics.cashOnHand ?? 0);
  const restrictedCash = Number(view.funding.restrictedCash ?? 0);
  const committedCapital = Number(view.funding.committedCapital ?? 0);

  const cashAvailable = Math.max(0, cashOnHand - Math.max(0, restrictedCash)); // available to burn

  const directBurn = Math.max(0, Number(view.metrics.monthlyBurn ?? 0));
  const currentARR = Math.max(0, Number(view.metrics.currentARR ?? 0));
  const mrr = currentARR / 12;

  const gm = clamp(Number(view.metrics.grossMarginPct ?? 0), 0, 100);
  const monthlyGrowth = Math.max(0, Number(view.metrics.monthlyGrowthPct ?? 0));
  const monthlyChurn = clamp(Number(view.metrics.monthlyChurnPct ?? 0), 0, 100);
  const nrr = Math.max(0, Number(view.metrics.nrrPct ?? 100));

  const headcount = Math.max(0, Number(view.operating.headcount ?? 0));
  const avgFullyLoadedCostAnnual = Math.max(0, Number(view.operating.avgFullyLoadedCostAnnual ?? 0));
  const smMonthly = Math.max(0, Number(view.operating.smMonthly ?? 0));
  const rndMonthly = Math.max(0, Number(view.operating.rndMonthly ?? 0));
  const gaMonthly = Math.max(0, Number(view.operating.gaMonthly ?? 0));

  const payrollMonthly = (headcount * avgFullyLoadedCostAnnual) / 12;
  const oneOffMonthly = Math.max(0, Number(view.cost.oneOffMonthly ?? 0));

  const structuralBurn = payrollMonthly + smMonthly + rndMonthly + gaMonthly + oneOffMonthly;

  // If user provides directBurn we treat it as “operational burn outside structure”
  const netBurn = Math.max(0, directBurn + structuralBurn);

  const runwayMonths = netBurn > 0 ? cashAvailable / netBurn : 0;

  // Growth-adjusted “effective revenue” (simple deterministic heuristic)
  const growthAdjustedRevenue =
    mrr * (1 + monthlyGrowth / 100) * (1 - monthlyChurn / 100) * Math.max(0.25, nrr / 100);

  const burnMultiple = growthAdjustedRevenue > 0 ? netBurn / growthAdjustedRevenue : 0;

  // Survival score (heuristic, deterministic)
  const survivalProbability = clamp(
    runwayMonths * 6 + (nrr / 100) * 10 + gm * 0.2 - burnMultiple * 6,
    0,
    100
  );

  const canLock = useMemo(() => {
    if (lockedView) return true;
    const companyName = String(draft.identity.companyName ?? "").trim();
    const currency = draft.identity.currency;
    const anySignal =
      Number(draft.metrics.cashOnHand ?? 0) > 0 ||
      Number(draft.metrics.monthlyBurn ?? 0) > 0 ||
      Number(draft.metrics.currentARR ?? 0) > 0 ||
      Number(draft.operating.headcount ?? 0) > 0;
    return Boolean(companyName && currency && anySignal);
  }, [draft, lockedView]);

  const title = lockedView ? "BASELINE LOCKED" : "INITIALIZE BASELINE";
  const subtitle = lockedView
    ? "Baseline truth is locked. Scenarios remain editable; baseline is immutable."
    : "Enter your current financial truth to anchor scenario modeling.";

  const onLock = () => {
    if (lockedView) return onExit();
    const snap = lockBaselineFromDraft();
    if (!snap) return;
    onExit();
  };

  const onReset = () => {
    if (!baselineLocked) return;
    const ok = window.confirm(
      "Reset baseline? This permanently clears the locked baseline truth and returns you to draft mode."
    );
    if (!ok) return;
    resetBaseline();
  };

  if (!hydrated) {
    return (
      <div className={styles.scene}>
        <div className={styles.terrain} />
        <div className={styles.vignette} />
      </div>
    );
  }

  return (
    <div className={styles.scene}>
      <div className={styles.terrain} />
      <div className={styles.vignette} />

      <div className={styles.wrap}>
        {/* LEFT RAIL */}
        <aside className={styles.rail}>
          <div className={styles.railHeader}>
            <div className={styles.brand}>
              <div className={styles.brandMark} />
              <div className={styles.brandText}>
                <div className={styles.brandName}>STRATFIT</div>
                <div className={styles.brandSub}>Baseline Initialization</div>
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.draftPill}>
              {lockedView ? "BASELINE — LOCKED" : "DRAFT — NOT LOCKED"}
            </div>
            <div className={styles.sidebarActions}>
              {baselineLocked ? (
                <button className={styles.ghostBtn} type="button" onClick={onReset}>
                  Reset Baseline
                </button>
              ) : null}
              <button className={styles.ghostBtn} type="button" onClick={onExit}>
                Exit
              </button>
            </div>
          </div>
        </aside>

        {/* CHASSIS */}
        <main className={styles.chassis}>
          <div className={styles.chassisInner}>
            <div className={styles.header}>
              <div className={styles.title}>{title}</div>
              <div className={styles.subtitle}>{subtitle}</div>

              {/* KPI STRIP (keep style, add signal) */}
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Runway</div>
                  <div className={styles.metricValue}>
                    {runwayMonths > 0 ? `${fmt1(runwayMonths)} mo` : "—"}
                  </div>
                </div>

                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Burn Multiple</div>
                  <div className={styles.metricValue}>
                    {burnMultiple > 0 ? `${fmt2(burnMultiple)}x` : "—"}
                  </div>
                </div>

                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Net Burn</div>
                  <div className={styles.metricValue}>
                    {netBurn > 0 ? fmtInt(Math.round(netBurn)) : "—"}
                  </div>
                </div>

                <div className={styles.metric}>
                  <div className={styles.metricLabel}>Survival</div>
                  <div className={`${styles.metricValue} ${styles.metricValueCyan}`}>
                    {survivalProbability > 0 ? `${Math.round(survivalProbability)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {/* Liquidity & Funding */}
              <div className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardTitle}>Liquidity &amp; Funding</div>
                  <button
                    type="button"
                    className={styles.smallGhostBtn}
                    onClick={() => setShowAdvancedFunding((v) => !v)}
                  >
                    {showAdvancedFunding ? "Hide Advanced" : "Show Advanced"}
                  </button>
                </div>

                <div className={styles.fieldRow}>
                  <MoneyField
                    label="Cash on Hand"
                    value={Number(view.metrics.cashOnHand ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { cashOnHand: n } })}
                  />

                  <MoneyField
                    label="Restricted Cash"
                    value={Number(view.funding.restrictedCash ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ funding: { restrictedCash: n } })}
                  />

                  <Field label="Cash Available (derived)">
                    <input className={styles.input} value={cashAvailable > 0 ? fmtInt(cashAvailable) : "0"} disabled />
                  </Field>

                  <MoneyField
                    label="Committed Capital"
                    value={Number(view.funding.committedCapital ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ funding: { committedCapital: n } })}
                  />

                  <MoneyField
                    label="Direct Monthly Burn (optional)"
                    value={Number(view.metrics.monthlyBurn ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { monthlyBurn: n } })}
                  />

                  <Field label="Runway (derived, months)">
                    <input className={styles.input} value={runwayMonths > 0 ? fmt1(runwayMonths) : "—"} disabled />
                  </Field>
                </div>

                {showAdvancedFunding ? (
                  <div className={styles.advancedBlock}>
                    <div className={styles.fieldRow}>
                      <MoneyField
                        label="Debt Outstanding"
                        value={Number(view.funding.debtOutstanding ?? 0)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ funding: { debtOutstanding: n } })}
                      />

                      <PercentField
                        label="Interest Rate %"
                        value={Number(view.funding.interestRatePct ?? 0)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ funding: { interestRatePct: n } })}
                        max={100}
                      />

                      <NumberField
                        label="Fundraising Window (months)"
                        value={Number(view.funding.fundraisingWindowMonths ?? 6)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ funding: { fundraisingWindowMonths: n } })}
                        max={120}
                      />

                      <SelectField
                        label="Access to Capital"
                        value={(view.funding.accessToCapital ?? "Moderate") as AccessToCapital}
                        disabled={lockedView}
                        options={ACCESS_TO_CAPITAL}
                        onChange={(v) => setDraft({ funding: { accessToCapital: v } })}
                      />

                      <ToggleField
                        label="Covenant Limits"
                        value={Boolean(view.funding.covenantLimitsEnabled ?? false)}
                        disabled={lockedView}
                        onChange={(v) => setDraft({ funding: { covenantLimitsEnabled: v } })}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Revenue Engine */}
              <div className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardTitle}>Revenue Engine</div>
                  <button
                    type="button"
                    className={styles.smallGhostBtn}
                    onClick={() => setShowAdvancedRevenue((v) => !v)}
                  >
                    {showAdvancedRevenue ? "Hide Advanced" : "Show Advanced"}
                  </button>
                </div>

                <div className={styles.fieldRow}>
                  <MoneyField
                    label="Current ARR"
                    value={Number(view.metrics.currentARR ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { currentARR: n } })}
                  />

                  <Field label="MRR (derived)">
                    <input className={styles.input} value={mrr > 0 ? fmtInt(Math.round(mrr)) : "0"} disabled />
                  </Field>

                  <PercentField
                    label="Gross Margin %"
                    value={Number(view.metrics.grossMarginPct ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { grossMarginPct: n } })}
                    max={100}
                  />

                  <PercentField
                    label="Monthly Growth %"
                    value={Number(view.metrics.monthlyGrowthPct ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { monthlyGrowthPct: n } })}
                    max={1000}
                  />

                  <PercentField
                    label="Monthly Churn %"
                    value={Number(view.metrics.monthlyChurnPct ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { monthlyChurnPct: n } })}
                    max={100}
                  />

                  <PercentField
                    label="NRR %"
                    value={Number(view.metrics.nrrPct ?? 100)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ metrics: { nrrPct: n } })}
                    max={300}
                  />
                </div>

                {showAdvancedRevenue ? (
                  <div className={styles.advancedBlock}>
                    <div className={styles.fieldRow}>
                      <MoneyField
                        label="Average Deal Size (ACV)"
                        value={Number(view.metrics.acv ?? 0)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ metrics: { acv: n } })}
                      />

                      <NumberField
                        label="Sales Cycle (months)"
                        value={Number(view.metrics.salesCycleMonths ?? 3)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ metrics: { salesCycleMonths: n } })}
                        max={60}
                      />

                      <NumberField
                        label="Pipeline Coverage (x)"
                        value={Number(view.metrics.pipelineCoverageX ?? 1)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ metrics: { pipelineCoverageX: n } })}
                        max={100}
                        step="0.1"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Cost Structure */}
              <div className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardTitle}>Cost Structure</div>
                  <button
                    type="button"
                    className={styles.smallGhostBtn}
                    onClick={() => setShowAdvancedCost((v) => !v)}
                  >
                    {showAdvancedCost ? "Hide Advanced" : "Show Advanced"}
                  </button>
                </div>

                <div className={styles.fieldRow}>
                  <Field label="Headcount">
                    <input
                      className={styles.input}
                      value={String(view.operating.headcount ?? 0)}
                      onChange={(e) => setDraft({ operating: { headcount: clamp(toNumber(e.target.value), 0, 1_000_000) } })}
                      disabled={lockedView}
                      placeholder="e.g. 18"
                    />
                  </Field>

                  <MoneyField
                    label="Avg Fully Loaded Cost (annual)"
                    value={Number(view.operating.avgFullyLoadedCostAnnual ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ operating: { avgFullyLoadedCostAnnual: n } })}
                  />

                  <MoneyField
                    label="Sales & Marketing (monthly)"
                    value={Number(view.operating.smMonthly ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ operating: { smMonthly: n } })}
                  />

                  <MoneyField
                    label="R&D (monthly)"
                    value={Number(view.operating.rndMonthly ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ operating: { rndMonthly: n } })}
                  />

                  <MoneyField
                    label="G&A (monthly)"
                    value={Number(view.operating.gaMonthly ?? 0)}
                    disabled={lockedView}
                    onChange={(n) => setDraft({ operating: { gaMonthly: n } })}
                  />

                  <Field label="Payroll (derived monthly)">
                    <input className={styles.input} value={payrollMonthly > 0 ? fmtInt(Math.round(payrollMonthly)) : "0"} disabled />
                  </Field>

                  <Field label="Structural Burn (derived)">
                    <input className={styles.input} value={structuralBurn > 0 ? fmtInt(Math.round(structuralBurn)) : "0"} disabled />
                  </Field>
                </div>

                {showAdvancedCost ? (
                  <div className={styles.advancedBlock}>
                    <div className={styles.fieldRow}>
                      <PercentField
                        label="COGS %"
                        value={Number(view.cost.cogsPct ?? 0)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ cost: { cogsPct: n } })}
                        max={100}
                      />

                      <MoneyField
                        label="One-offs (monthly)"
                        value={Number(view.cost.oneOffMonthly ?? 0)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ cost: { oneOffMonthly: n } })}
                      />

                      <SelectField
                        label="Burn Flexibility"
                        value={(view.operating.burnFlexibility ?? "Variable") as BurnFlexibility}
                        disabled={lockedView}
                        options={BURN_FLEX}
                        onChange={(v) => setDraft({ operating: { burnFlexibility: v } })}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Strategic Posture */}
              <div className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardTitle}>Strategic Posture</div>
                  <button
                    type="button"
                    className={styles.smallGhostBtn}
                    onClick={() => setShowAdvancedPosture((v) => !v)}
                  >
                    {showAdvancedPosture ? "Hide Advanced" : "Show Advanced"}
                  </button>
                </div>

                <div className={styles.fieldRow}>
                  <Field label="Company Name">
                    <input
                      className={styles.input}
                      value={view.identity.companyName ?? ""}
                      onChange={(e) => setDraft({ identity: { companyName: e.target.value } })}
                      disabled={lockedView}
                      placeholder="Company name"
                    />
                  </Field>

                  <Field label="Industry">
                    <input
                      className={styles.input}
                      value={view.identity.industry ?? ""}
                      onChange={(e) => setDraft({ identity: { industry: e.target.value } })}
                      disabled={lockedView}
                      placeholder="Industry"
                    />
                  </Field>

                  <Field label="Country">
                    <input
                      className={styles.input}
                      value={view.identity.country ?? ""}
                      onChange={(e) => setDraft({ identity: { country: e.target.value } })}
                      disabled={lockedView}
                      placeholder="Country"
                    />
                  </Field>

                  <Field label="Reporting Currency">
                    <select
                      className={styles.select}
                      value={(view.identity.currency ?? "USD") as CurrencyCode}
                      onChange={(e) => setDraft({ identity: { currency: e.target.value as CurrencyCode } })}
                      disabled={lockedView}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {showAdvancedPosture ? (
                  <div className={styles.advancedBlock}>
                    <div className={styles.fieldRow}>
                      <SelectField
                        label="Primary Objective"
                        value={(view.posture.primaryObjective ?? "Runway") as PrimaryObjective}
                        disabled={lockedView}
                        options={PRIMARY_OBJECTIVE}
                        onChange={(v) => setDraft({ posture: { primaryObjective: v } })}
                      />

                      <SelectField
                        label="Risk Appetite"
                        value={(view.posture.riskAppetite ?? "Balanced") as RiskAppetite}
                        disabled={lockedView}
                        options={RISK_APPETITE}
                        onChange={(v) => setDraft({ posture: { riskAppetite: v } })}
                      />

                      <SelectField
                        label="Hiring Velocity"
                        value={(view.operating.hiringVelocity ?? "Medium") as HiringVelocity}
                        disabled={lockedView}
                        options={HIRING_VELOCITY}
                        onChange={(v) => setDraft({ operating: { hiringVelocity: v } })}
                      />

                      <NumberField
                        label="Sales Ramp (months)"
                        value={Number(view.operating.salesRampMonths ?? 4)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ operating: { salesRampMonths: n } })}
                        max={36}
                      />

                      <NumberField
                        label="Engineering Velocity (months)"
                        value={Number(view.operating.engineeringVelocityMonths ?? 4)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ operating: { engineeringVelocityMonths: n } })}
                        max={36}
                      />

                      <PercentField
                        label="Target Growth Band (monthly %)"
                        value={Number(view.posture.targetGrowthBandPct ?? 8)}
                        disabled={lockedView}
                        onChange={(n) => setDraft({ posture: { targetGrowthBandPct: n } })}
                        max={100}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.badge}>{lockedView ? "Truth — Locked" : "Draft — Not Locked"}</div>
              <button className={styles.primaryBtn} type="button" onClick={onLock} disabled={!canLock}>
                {lockedView ? "Continue" : "Lock Baseline & Enter Stratfit"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Small field helpers (no new CSS required) ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      {children}
    </div>
  );
}

function MoneyField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <input
        className={styles.input}
        value={String(Math.max(0, Number.isFinite(value) ? value : 0))}
        onChange={(e) => onChange(clamp(toNumber(e.target.value), 0, 1e15))}
        disabled={disabled}
        inputMode="decimal"
        placeholder="0"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
  max,
  step,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
  max: number;
  step?: string;
}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <input
        className={styles.input}
        value={String(Number.isFinite(value) ? value : 0)}
        onChange={(e) => onChange(clamp(toNumber(e.target.value), 0, max))}
        disabled={disabled}
        inputMode="decimal"
        placeholder="0"
        step={step}
      />
    </div>
  );
}

function PercentField({
  label,
  value,
  disabled,
  onChange,
  max,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <input
        className={styles.input}
        value={String(Number.isFinite(value) ? value : 0)}
        onChange={(e) => onChange(clamp(toNumber(e.target.value), 0, max))}
        disabled={disabled}
        inputMode="decimal"
        placeholder="0"
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  disabled,
  options,
  onChange,
}: {
  label: string;
  value: T;
  disabled: boolean;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <button
        type="button"
        className={styles.smallToggleBtn}
        onClick={() => onChange(!value)}
        disabled={disabled}
        aria-pressed={value}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );
}


