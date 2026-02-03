import React, { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useBaselineStore,
  type CurrencyCode,
  type SalesMotion,
  type PricingModel,
  type StrategyObjective,
  type RiskAppetite,
  type BaselineQuestionId,
} from "@/state/onboardingStore";

type Props = {
  onComplete: () => void;
  allowDismiss?: boolean; // if baseline already locked, user may dismiss
};

type StepId = "identity" | "metrics" | "operating" | "strategy";

const STEPS: { id: StepId; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "metrics", label: "Baseline Metrics" },
  { id: "operating", label: "Operating Posture" },
  { id: "strategy", label: "Strategy Signals" },
];

const CURRENCIES: CurrencyCode[] = [
  "USD","AUD","EUR","GBP","CAD","NZD","SGD","JPY","INR","CHF","SEK","NOK","DKK","ZAR","PLN","CZK","HUF","ILS","AED","BRL","MXN",
];

const SALES_MOTIONS: SalesMotion[] = ["PLG","SLG","ENTERPRISE","CHANNEL","HYBRID","UNKNOWN"];
const PRICING_MODELS: PricingModel[] = ["SUBSCRIPTION","USAGE","SEAT_BASED","TIERED","SERVICES","HYBRID","UNKNOWN"];

const OBJECTIVES: StrategyObjective[] = ["SURVIVAL","GROWTH","PROFITABILITY","OPTIONALITY","EXIT"];
const RISK_APPETITES: RiskAppetite[] = ["LOW","MEDIUM","HIGH"];

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function toNumberOrZero(v: string) {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatCurrencyHint(n: number) {
  if (!Number.isFinite(n)) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export default function OnboardingSequenceNew({ onComplete, allowDismiss = false }: Props) {
  const {
    baselineLocked,
    baseline,
    hydrated,
    draft,
    setDraft,
    lockBaselineFromDraft,
    resetBaseline,
  } = useBaselineStore(
    useShallow((s) => ({
      baselineLocked: s.baselineLocked,
      baseline: s.baseline,
      hydrated: s.hydrated,
      draft: s.draft,
      setDraft: s.setDraft,
      lockBaselineFromDraft: s.lockBaselineFromDraft,
      resetBaseline: s.resetBaseline,
    }))
  );

  const [step, setStep] = useState<StepId>("identity");
  const stepIndex = useMemo(() => Math.max(0, STEPS.findIndex((x) => x.id === step)), [step]);

  const baselineView = baselineLocked && baseline ? baseline : null;
  const lockedView = baselineView !== null;

  const title = lockedView ? "Baseline Locked" : "Initialize Baseline";
  const subtitle = lockedView
    ? "Baseline truth is locked. Strategy scenarios are editable; baseline is immutable."
    : "Enter current reality. This becomes your locked baseline and anchors all scenario comparison.";

  const goNext = useCallback(() => {
    const next = STEPS[stepIndex + 1]?.id;
    if (next) setStep(next);
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prev = STEPS[stepIndex - 1]?.id;
    if (prev) setStep(prev);
  }, [stepIndex]);

  const canContinue = useMemo(() => {
    if (lockedView) return true;

    const companyName = String(draft.identity.companyName ?? "").trim();
    const currency = draft.identity.currency;
    const cash = Number(draft.metrics.cashOnHand ?? 0);
    const burn = Number(draft.metrics.monthlyBurn ?? 0);
    const arr = Number(draft.metrics.currentARR ?? 0);
    const headcount = Number(draft.operating.headcount ?? 0);

    if (!companyName) return false;
    if (!currency) return false;

    // Minimal sane baseline: cash + burn + ARR are allowed to be 0, but burn = 0 can produce nonsense.
    // We require burn > 0 OR cash > 0 OR ARR > 0 to prevent empty lock.
    const hasAnySignal = (cash > 0) || (burn > 0) || (arr > 0) || (headcount > 0);
    if (!hasAnySignal) return false;

    return true;
  }, [lockedView, draft]);

  const handleLockAndContinue = useCallback(() => {
    if (lockedView) {
      onComplete();
      return;
    }
    const snap = lockBaselineFromDraft();
    if (!snap) return;
    onComplete();
  }, [lockedView, lockBaselineFromDraft, onComplete]);

  const handleDismiss = useCallback(() => {
    if (!allowDismiss) return;
    onComplete();
  }, [allowDismiss, onComplete]);

  const handleReset = useCallback(() => {
    if (!baselineLocked) return;
    const ok = window.confirm(
      "Reset baseline? This permanently clears the locked baseline truth and returns you to draft mode."
    );
    if (!ok) return;
    resetBaseline();
    setStep("identity");
  }, [baselineLocked, resetBaseline]);

  if (!hydrated) {
    return (
      <div style={overlay}>
        <div style={panel}>
          <div style={panelTop}>
            <div style={brandRow}>
              <div style={brandMark} />
              <div>
                <div style={brandTitle}>STRATFIT</div>
                <div style={brandSub}>Baseline Initialization</div>
              </div>
            </div>
          </div>
          <div style={body}>
            <div style={headline}>Loading baseline store…</div>
            <div style={subline}>Hydrating persisted truth.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Onboarding">
      <div style={panel}>
        {/* Top */}
        <div style={panelTop}>
          <div style={brandRow}>
            <div style={brandMark} />
            <div style={{ minWidth: 0 }}>
              <div style={brandTitle}>STRATFIT</div>
              <div style={brandSub}>{title}</div>
            </div>
          </div>

          <div style={topRight}>
            {baselineLocked && allowDismiss ? (
              <button type="button" style={btnGhost} onClick={handleDismiss}>
                Continue
              </button>
            ) : null}
            {baselineLocked ? (
              <button type="button" style={btnDanger} onClick={handleReset}>
                Reset Baseline
              </button>
            ) : null}
          </div>
        </div>

        {/* Header */}
        <div style={header}>
          <div style={headline}>{subtitle}</div>

          <div style={stepper}>
            {STEPS.map((s, idx) => {
              const active = s.id === step;
              const done = idx < stepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => (!lockedView ? setStep(s.id) : null)}
                  style={{
                    ...stepPill,
                    ...(active ? stepPillActive : null),
                    ...(done ? stepPillDone : null),
                    ...(lockedView ? stepPillLocked : null),
                  }}
                  disabled={lockedView}
                  aria-current={active ? "step" : undefined}
                >
                  <span style={{ ...stepDot, ...(active ? stepDotActive : null), ...(done ? stepDotDone : null) }} />
                  <span style={stepLabel}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={body}>
          {step === "identity" && (
            <Section title="Identity" note="High-level identity anchors reporting and currency formatting.">
              <Row>
                <Field label="Company Name" required>
                  <input
                    style={input}
                    value={baselineView ? baselineView.identity.companyName : draft.identity.companyName}
                    onChange={(e) => setDraft({ identity: { companyName: e.target.value } })}
                    placeholder="Company name"
                    disabled={lockedView}
                  />
                </Field>
                <Field label="Industry">
                  <input
                    style={input}
                    value={baselineView ? baselineView.identity.industry : draft.identity.industry}
                    onChange={(e) => setDraft({ identity: { industry: e.target.value } })}
                    placeholder="Industry"
                    disabled={lockedView}
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Country">
                  <input
                    style={input}
                    value={baselineView ? baselineView.identity.country : draft.identity.country}
                    onChange={(e) => setDraft({ identity: { country: e.target.value } })}
                    placeholder="Country"
                    disabled={lockedView}
                  />
                </Field>
                <Field label="Currency" required>
                  <select
                    style={select}
                    value={baselineView ? baselineView.identity.currency : draft.identity.currency}
                    onChange={(e) => setDraft({ identity: { currency: e.target.value as CurrencyCode } })}
                    disabled={lockedView}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>
            </Section>
          )}

          {step === "metrics" && (
            <Section title="Baseline Metrics" note="These numbers define survival math and comparison deltas.">
              <Row>
                <MoneyField
                  label="Cash on Hand"
                  value={baselineView ? baselineView.metrics.cashOnHand : draft.metrics.cashOnHand}
                  currency={baselineView ? baselineView.identity.currency : draft.identity.currency}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { cashOnHand: n } })}
                  hint="Current cash balance."
                />
                <MoneyField
                  label="Monthly Burn"
                  value={baselineView ? baselineView.metrics.monthlyBurn : draft.metrics.monthlyBurn}
                  currency={baselineView ? baselineView.identity.currency : draft.identity.currency}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { monthlyBurn: n } })}
                  hint="Positive number (spend minus inflow)."
                />
              </Row>

              <Row>
                <MoneyField
                  label="Current ARR"
                  value={baselineView ? baselineView.metrics.currentARR : draft.metrics.currentARR}
                  currency={baselineView ? baselineView.identity.currency : draft.identity.currency}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { currentARR: n } })}
                  hint="Annual recurring revenue today."
                />
                <Field label="ARR Growth (optional, %)" hint="If known. Otherwise leave blank.">
                  <input
                    style={input}
                    value={
                      baselineView
                        ? (baselineView.metrics.arrGrowthPct ?? "")
                        : (draft.metrics.arrGrowthPct ?? "")
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDraft({ metrics: { arrGrowthPct: raw === "" ? undefined : toNumberOrZero(raw) } });
                    }}
                    placeholder="e.g. 25"
                    disabled={lockedView}
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Gross Margin (optional, %)" hint="If known. Otherwise leave blank.">
                  <input
                    style={input}
                    value={
                      baselineView
                        ? (baselineView.metrics.grossMarginPct ?? "")
                        : (draft.metrics.grossMarginPct ?? "")
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDraft({ metrics: { grossMarginPct: raw === "" ? undefined : clamp(toNumberOrZero(raw), 0, 100) } });
                    }}
                    placeholder="e.g. 72"
                    disabled={lockedView}
                  />
                </Field>
                <div />
              </Row>

              <Divider />
              <SmallNote>
                Baseline becomes immutable after locking. All strategic experimentation happens in Strategy Studio scenarios.
              </SmallNote>
            </Section>
          )}

          {step === "operating" && (
            <Section title="Operating Posture" note="Operating posture shapes interpretation and future modules.">
              <Row>
                <Field label="Headcount">
                  <input
                    style={input}
                    value={baselineView ? baselineView.operating.headcount : draft.operating.headcount}
                    onChange={(e) => setDraft({ operating: { headcount: clamp(toNumberOrZero(e.target.value), 0, 10_000_000) } })}
                    placeholder="e.g. 38"
                    disabled={lockedView}
                  />
                </Field>
                <Field label="Sales Motion">
                  <select
                    style={select}
                    value={baselineView ? baselineView.operating.salesMotion : draft.operating.salesMotion}
                    onChange={(e) => setDraft({ operating: { salesMotion: e.target.value as SalesMotion } })}
                    disabled={lockedView}
                  >
                    {SALES_MOTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Row>
                <Field label="Pricing Model">
                  <select
                    style={select}
                    value={baselineView ? baselineView.operating.pricingModel : draft.operating.pricingModel}
                    onChange={(e) => setDraft({ operating: { pricingModel: e.target.value as PricingModel } })}
                    disabled={lockedView}
                  >
                    {PRICING_MODELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <div />
              </Row>
            </Section>
          )}

          {step === "strategy" && (
            <Section title="Strategy Signals" note="These are intent + constraint signals. They guide scenario framing.">
              <Row>
                <Field label="Primary Objective">
                  <select
                    style={select}
                    value={
                      baselineView
                        ? (baselineView.answers.primaryObjective.value as StrategyObjective)
                        : (draft.answers.primaryObjective.value as StrategyObjective)
                    }
                    onChange={(e) => setDraft({ answers: { primaryObjective: { kind: "radio", value: e.target.value } as any } })}
                    disabled={lockedView}
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Risk Appetite">
                  <select
                    style={select}
                    value={
                      baselineView
                        ? (baselineView.answers.riskAppetite.value as RiskAppetite)
                        : (draft.answers.riskAppetite.value as RiskAppetite)
                    }
                    onChange={(e) => setDraft({ answers: { riskAppetite: { kind: "radio", value: e.target.value } as any } })}
                    disabled={lockedView}
                  >
                    {RISK_APPETITES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Scale
                id="growthUrgency"
                label="Growth Urgency"
                value={getScale(lockedView, baseline, draft, "growthUrgency")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { growthUrgency: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="marginDiscipline"
                label="Margin Discipline"
                value={getScale(lockedView, baseline, draft, "marginDiscipline")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { marginDiscipline: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="marketVolatility"
                label="Market Volatility"
                value={getScale(lockedView, baseline, draft, "marketVolatility")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { marketVolatility: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="executionConfidence"
                label="Execution Confidence"
                value={getScale(lockedView, baseline, draft, "executionConfidence")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { executionConfidence: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="fundingConstraint"
                label="Funding Constraint"
                value={getScale(lockedView, baseline, draft, "fundingConstraint")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { fundingConstraint: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="pricingPower"
                label="Pricing Power"
                value={getScale(lockedView, baseline, draft, "pricingPower")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { pricingPower: { kind: "scale", value: v } } as any })}
              />
              <Scale
                id="competitivePressure"
                label="Competitive Pressure"
                value={getScale(lockedView, baseline, draft, "competitivePressure")}
                disabled={lockedView}
                onChange={(v) => setDraft({ answers: { competitivePressure: { kind: "scale", value: v } } as any })}
              />

              <Divider />
              <DisclosureBlock />
            </Section>
          )}
        </div>

        {/* Footer Actions */}
        <div style={footer}>
          <div style={footerLeft}>
            {lockedView ? (
              <div style={lockedBadge}>TRUTH LOCKED · sf.baseline.v1</div>
            ) : (
              <div style={draftBadge}>DRAFT · not locked</div>
            )}
          </div>

          <div style={footerRight}>
            <button type="button" style={btnGhost} onClick={goBack} disabled={stepIndex === 0}>
              Back
            </button>

            {stepIndex < STEPS.length - 1 ? (
              <button type="button" style={btnPrimary} onClick={goNext} disabled={lockedView}>
                Next
              </button>
            ) : (
              <button type="button" style={btnPrimary} onClick={handleLockAndContinue} disabled={!canContinue}>
                {lockedView ? "Continue" : "Lock Baseline & Enter STRATFIT"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- Helpers -------------------------- */

function getScale(
  lockedView: boolean,
  baseline: any,
  draft: any,
  id: BaselineQuestionId
): number {
  const src = lockedView ? baseline.answers : draft.answers;
  const v = src?.[id]?.value;
  const n = typeof v === "number" ? v : Number(v ?? 5);
  return clamp(n, 0, 10);
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={section}>
      <div style={sectionTop}>
        <div style={sectionTitle}>{title}</div>
        {note ? <div style={sectionNote}>{note}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={row}>{children}</div>;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={field}>
      <div style={fieldLabel}>
        <span>{label}</span>
        {required ? <span style={req}>Required</span> : null}
      </div>
      {hint ? <div style={fieldHint}>{hint}</div> : null}
      {children}
    </div>
  );
}

function MoneyField({
  label,
  value,
  currency,
  disabled,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  currency: string;
  disabled: boolean;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const display = useMemo(() => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? String(n) : "0";
  }, [value]);

  const pretty = useMemo(() => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${currency} ${formatCurrencyHint(n)}`;
  }, [value, currency]);

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          style={input}
          value={display}
          onChange={(e) => onChange(clamp(toNumberOrZero(e.target.value), 0, 1e15))}
          placeholder="0"
          disabled={disabled}
          inputMode="decimal"
        />
        <div style={moneyHint}>{pretty}</div>
      </div>
    </Field>
  );
}

function Scale({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div style={scaleWrap}>
      <div style={scaleTop}>
        <div style={scaleLabel}>{label}</div>
        <div style={scaleValue}>{value.toFixed(0)}/10</div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        style={range}
        aria-label={label}
      />
    </div>
  );
}

function Divider() {
  return <div style={divider} />;
}

function SmallNote({ children }: { children: React.ReactNode }) {
  return <div style={smallNote}>{children}</div>;
}

function DisclosureBlock() {
  return (
    <div style={disclosure}>
      <div style={disclosureTitle}>Disclosure</div>
      <div style={disclosureText}>
        STRATFIT outputs are probabilistic and scenario-based. They are decision support signals, not financial,
        legal, or investment advice. Baseline truth is locked for auditability; scenarios remain editable.
        You can generate deeper explanations and Q&amp;A on demand in the Intelligence panel.
      </div>
    </div>
  );
}

/* -------------------------- Styles (God Mode, no orange) -------------------------- */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(3,6,10,0.78)",
  backdropFilter: "blur(10px)",
  padding: 18,
};

const panel: React.CSSProperties = {
  width: "min(1180px, 100%)",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(10,14,20,0.96), rgba(8,12,18,0.96))",
  boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
  overflow: "hidden",
};

const panelTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const brandMark: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  background: "linear-gradient(135deg, rgba(34,211,238,0.92), rgba(59,130,246,0.70))",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.10) inset",
};

const brandTitle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(226,232,240,0.92)",
  fontWeight: 900,
  lineHeight: 1,
};

const brandSub: React.CSSProperties = {
  marginTop: 3,
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(148,163,184,0.75)",
  fontWeight: 800,
};

const topRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const header: React.CSSProperties = {
  padding: "14px 16px 10px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const headline: React.CSSProperties = {
  color: "rgba(226,232,240,0.92)",
  fontWeight: 800,
  fontSize: 14,
  lineHeight: 1.35,
};

const subline: React.CSSProperties = {
  marginTop: 6,
  color: "rgba(148,163,184,0.75)",
  fontWeight: 700,
  fontSize: 12,
  lineHeight: 1.35,
};

const stepper: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const stepPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  cursor: "pointer",
  userSelect: "none",
};

const stepPillActive: React.CSSProperties = {
  border: "1px solid rgba(34,211,238,0.28)",
  background: "rgba(34,211,238,0.08)",
  boxShadow: "0 0 0 1px rgba(34,211,238,0.10) inset",
};

const stepPillDone: React.CSSProperties = {
  border: "1px solid rgba(52,211,153,0.18)",
  background: "rgba(52,211,153,0.06)",
};

const stepPillLocked: React.CSSProperties = {
  cursor: "default",
  opacity: 0.85,
};

const stepDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(148,163,184,0.65)",
};

const stepDotActive: React.CSSProperties = {
  background: "rgba(34,211,238,0.92)",
  boxShadow: "0 0 14px rgba(34,211,238,0.45)",
};

const stepDotDone: React.CSSProperties = {
  background: "rgba(52,211,153,0.88)",
  boxShadow: "0 0 14px rgba(52,211,153,0.32)",
};

const stepLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(226,232,240,0.84)",
};

const body: React.CSSProperties = {
  padding: "14px 16px",
  background: "rgba(6,10,16,0.45)",
};

const section: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  padding: 14,
};

const sectionTop: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(226,232,240,0.92)",
};

const sectionNote: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(148,163,184,0.75)",
  fontWeight: 700,
  lineHeight: 1.3,
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 12,
};

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
};

const fieldLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  color: "rgba(226,232,240,0.88)",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
};

const req: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(34,211,238,0.86)",
};

const fieldHint: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(148,163,184,0.70)",
  fontWeight: 650,
  lineHeight: 1.3,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,10,0.45)",
  color: "rgba(226,232,240,0.92)",
  outline: "none",
  fontWeight: 700,
};

const select: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,10,0.45)",
  color: "rgba(226,232,240,0.92)",
  outline: "none",
  fontWeight: 800,
};

const moneyHint: React.CSSProperties = {
  minWidth: 110,
  textAlign: "right",
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(148,163,184,0.70)",
};

const scaleWrap: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(2,6,10,0.35)",
  marginBottom: 10,
};

const scaleTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

const scaleLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(226,232,240,0.86)",
};

const scaleValue: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(34,211,238,0.86)",
};

const range: React.CSSProperties = {
  width: "100%",
  accentColor: "rgba(34,211,238,0.95)",
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.06)",
  margin: "12px 0",
};

const smallNote: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.35,
  color: "rgba(148,163,184,0.78)",
  fontWeight: 650,
};

const disclosure: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(34,211,238,0.18)",
  background: "rgba(34,211,238,0.06)",
};

const disclosureTitle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(226,232,240,0.92)",
  marginBottom: 6,
};

const disclosureText: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: "rgba(226,232,240,0.80)",
  fontWeight: 650,
};

const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 16px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(6,10,16,0.70)",
};

const footerLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const footerRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const draftBadge: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(148,163,184,0.80)",
};

const lockedBadge: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid rgba(52,211,153,0.18)",
  background: "rgba(52,211,153,0.06)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 900,
  color: "rgba(226,232,240,0.88)",
};

const btnGhost: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(226,232,240,0.86)",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(34,211,238,0.28)",
  background: "rgba(34,211,238,0.10)",
  color: "rgba(226,232,240,0.94)",
  fontWeight: 950,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.32)",
  background: "rgba(239,68,68,0.10)",
  color: "rgba(226,232,240,0.94)",
  fontWeight: 950,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};

