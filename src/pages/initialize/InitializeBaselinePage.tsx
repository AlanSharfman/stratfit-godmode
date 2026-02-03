import React, { useMemo, useState } from "react";
import styles from "./InitializeBaselinePage.module.css";
import { useShallow } from "zustand/react/shallow";
import { useBaselineStore, type CurrencyCode } from "@/state/onboardingStore";

type StepId = "identity" | "metrics" | "operating" | "strategy";

const STEPS: { id: StepId; label: string; number: string }[] = [
  { id: "identity", label: "Identity & Context", number: "1" },
  { id: "metrics", label: "Financial Position", number: "2" },
  { id: "operating", label: "Operating Structure", number: "3" },
  { id: "strategy", label: "Strategic Intent", number: "4" },
];

const CURRENCIES: CurrencyCode[] = [
  "USD","AUD","EUR","GBP","CAD","NZD","SGD","JPY","INR","CHF","SEK","NOK","DKK","ZAR","PLN","CZK","HUF","ILS","AED","BRL","MXN",
];

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function toNumber(v: string) {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}
function fmt(n: number) {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function InitializeBaselinePage({ onExit }: { onExit: () => void }) {
  const {
    baselineLocked,
    hydrated,
    baseline,
    draft,
    setDraft,
    lockBaselineFromDraft,
    resetBaseline,
  } = useBaselineStore(
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

  const [step, setStep] = useState<StepId>("identity");
  const stepIndex = useMemo(() => Math.max(0, STEPS.findIndex((x) => x.id === step)), [step]);

  const lockedView = Boolean(baselineLocked && baseline);
  const view = lockedView && baseline ? baseline : draft;

  // Lightweight HUD derived metrics (safe + deterministic)
  const cash = Number(view?.metrics?.cashOnHand ?? 0);
  const burn = Math.max(0, Number(view?.metrics?.monthlyBurn ?? 0));
  const runwayMonths = burn > 0 ? cash / burn : 0;
  const burnMultiple = (() => {
    const arr = Math.max(0, Number(view?.metrics?.currentARR ?? 0));
    const mrr = arr / 12;
    if (mrr <= 0) return 0;
    return burn / mrr;
  })();

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

  const onBack = () => setStep(STEPS[Math.max(0, stepIndex - 1)].id);
  const onNext = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)].id);

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
    setStep("identity");
  };

  if (!hydrated) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.card}>
            <div className={styles.headerTop}>
              <div className={styles.brand}>
                <div className={styles.mark} />
                <div>
                  <div className={styles.brandTitle}>STRATFIT</div>
                  <div className={styles.brandSub}>Baseline Initialization</div>
                </div>
              </div>
            </div>
            <div className={styles.bodyPad}>
              <div className={styles.h1}>Loading baseline store…</div>
              <div className={styles.p}>Hydrating persisted truth.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* LEFT NAV */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <div className={styles.brandRow}>
              <div className={styles.logoCube} />
              <div>
                <div className={styles.brandTitleBig}>STRATFIT</div>
                <div className={styles.brandSub}>Baseline Initialization</div>
              </div>
            </div>
          </div>

          <nav className={styles.stepper}>
            {STEPS.map((s) => {
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  className={`${styles.step} ${active ? styles.stepActive : ""}`}
                  onClick={() => (!lockedView ? setStep(s.id) : null)}
                  disabled={lockedView}
                  type="button"
                >
                  <div className={`${styles.stepNum} ${active ? styles.stepNumActive : ""}`}>
                    {s.number}
                  </div>
                  <div className={styles.stepLabel}>{s.label}</div>
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.draftPill}>{lockedView ? "BASELINE — LOCKED" : "DRAFT — NOT LOCKED"}</div>
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

        {/* RIGHT */}
        <main className={styles.main}>
          <header className={styles.topHeader}>
            <div>
              <div className={styles.kicker}>{title}</div>
              <div className={styles.subtitle}>{subtitle}</div>
            </div>

            <div className={styles.headerChips}>
              <div className={styles.chip}>
                <span className={styles.chipLabel}>Runway</span>
                <span className={styles.chipValue}>{runwayMonths > 0 ? runwayMonths.toFixed(1) : "—"} mo</span>
              </div>
              <div className={styles.chip}>
                <span className={styles.chipLabel}>Burn Multiple</span>
                <span className={styles.chipValue}>{burnMultiple > 0 ? burnMultiple.toFixed(2) : "—"}x</span>
              </div>
              <div className={`${styles.chip} ${styles.chipGold}`}>
                <span className={styles.chipLabel}>Audit Mode</span>
                <span className={styles.chipValue}>{lockedView ? "ON" : "DRAFT"}</span>
              </div>
            </div>
          </header>

          <section className={styles.panel}>
            <div className={styles.panelTitle}>
              {STEPS.find((x) => x.id === step)?.label}
            </div>

            {/* IDENTITY */}
            {step === "identity" && (
              <div className={styles.grid2}>
                <Field label="Company Name" required>
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

                <Field label="Reporting Currency" required>
                  <select
                    className={styles.input}
                    value={view.identity.currency ?? "USD"}
                    onChange={(e) => setDraft({ identity: { currency: e.target.value as CurrencyCode } })}
                    disabled={lockedView}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {/* METRICS */}
            {step === "metrics" && (
              <div className={styles.grid2}>
                <MoneyField
                  label="Cash on Hand"
                  currency={view.identity.currency ?? "USD"}
                  value={Number(view.metrics.cashOnHand ?? 0)}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { cashOnHand: n } })}
                />
                <MoneyField
                  label="Monthly Net Burn"
                  currency={view.identity.currency ?? "USD"}
                  value={Number(view.metrics.monthlyBurn ?? 0)}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { monthlyBurn: n } })}
                />
                <MoneyField
                  label="Current ARR"
                  currency={view.identity.currency ?? "USD"}
                  value={Number(view.metrics.currentARR ?? 0)}
                  disabled={lockedView}
                  onChange={(n) => setDraft({ metrics: { currentARR: n } })}
                />
                <Field label="ARR Growth (optional, %)">
                  <input
                    className={styles.input}
                    value={String(view.metrics.arrGrowthPct ?? "")}
                    onChange={(e) =>
                      setDraft({
                        metrics: { arrGrowthPct: e.target.value === "" ? undefined : clamp(toNumber(e.target.value), 0, 1000) },
                      })
                    }
                    disabled={lockedView}
                    placeholder="e.g. 25"
                  />
                </Field>
              </div>
            )}

            {/* OPERATING */}
            {step === "operating" && (
              <div className={styles.grid2}>
                <Field label="Headcount">
                  <input
                    className={styles.input}
                    value={String(view.operating.headcount ?? 0)}
                    onChange={(e) => setDraft({ operating: { headcount: clamp(toNumber(e.target.value), 0, 1_000_000) } })}
                    disabled={lockedView}
                    placeholder="e.g. 18"
                  />
                </Field>
                <Field label="Notes (optional)">
                  <input className={styles.input} disabled placeholder="(wire later)" />
                </Field>
              </div>
            )}

            {/* STRATEGY */}
            {step === "strategy" && (
              <div className={styles.stack}>
                <div className={styles.note}>
                  Strategy signals guide scenario framing (we wire full intent + risk scales next pass).
                </div>
                <div className={styles.grid2}>
                  <Field label="Primary Objective">
                    <input className={styles.input} disabled placeholder="(wire next)" />
                  </Field>
                  <Field label="Risk Appetite">
                    <input className={styles.input} disabled placeholder="(wire next)" />
                  </Field>
                </div>
              </div>
            )}
          </section>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <div className={styles.footerBadge}>{lockedView ? "TRUTH LOCKED · sf.baseline.v1" : "DRAFT · not locked"}</div>
            </div>

            <div className={styles.footerRight}>
              <button className={styles.ghostBtn} type="button" onClick={onBack} disabled={stepIndex === 0}>
                Back
              </button>

              {stepIndex < STEPS.length - 1 ? (
                <button className={styles.primaryBtn} type="button" onClick={onNext} disabled={lockedView}>
                  Next
                </button>
              ) : (
                <button className={styles.primaryBtn} type="button" onClick={onLock} disabled={!canLock}>
                  {lockedView ? "Continue" : "Lock Baseline & Enter STRATFIT"}
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        <span>{label}</span>
        {required ? <span className={styles.req}>Required</span> : null}
      </div>
      {children}
    </div>
  );
}

function MoneyField({
  label,
  currency,
  value,
  disabled,
  onChange,
}: {
  label: string;
  currency: string;
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        <span>{label}</span>
        <span className={styles.hintRight}>{currency}</span>
      </div>
      <div className={styles.moneyRow}>
        <input
          className={styles.input}
          value={String(Math.max(0, Number.isFinite(value) ? value : 0))}
          onChange={(e) => onChange(clamp(toNumber(e.target.value), 0, 1e15))}
          disabled={disabled}
          inputMode="decimal"
          placeholder="0"
        />
        <div className={styles.moneyHint}>{fmt(value)}</div>
      </div>
    </div>
  );
}


