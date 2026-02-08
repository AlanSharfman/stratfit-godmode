import React, { useMemo, useState } from "react";
import styles from "./InitializeBaselinePage.module.css";
import { useShallow } from "zustand/react/shallow";
import { useBaselineStore, type CurrencyCode } from "@/state/onboardingStore";
import { CommandDeckBezel } from "@/components/command/CommandDeckBezel";

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

  const lockedView = Boolean(baselineLocked && baseline);
  const view = lockedView && baseline ? baseline : draft;

  // Derived metrics (safe + deterministic)
  const cash = Number(view?.metrics?.cashOnHand ?? 0);
  const burn = Math.max(0, Number(view?.metrics?.monthlyBurn ?? 0));

  const arr = Math.max(0, Number(view?.metrics?.currentARR ?? 0));
  const mrr = arr / 12;

  const monthlyGrowth = Math.max(0, Number(view?.metrics?.monthlyGrowthPct ?? 0));
  const monthlyChurn = Math.max(0, Number(view?.metrics?.monthlyChurnPct ?? 0));
  const nrr = Math.max(0, Number(view?.metrics?.nrrPct ?? 100));

  const headcount = Math.max(0, Number(view?.operating?.headcount ?? 0));
  const avgFullyLoadedCostAnnual = Math.max(
    0,
    Number(view?.operating?.avgFullyLoadedCostAnnual ?? 0)
  );
  const smMonthly = Math.max(0, Number(view?.operating?.smMonthly ?? 0));
  const rndMonthly = Math.max(0, Number(view?.operating?.rndMonthly ?? 0));
  const gaMonthly = Math.max(0, Number(view?.operating?.gaMonthly ?? 0));

  const payrollMonthly = (headcount * avgFullyLoadedCostAnnual) / 12;
  const structuralBurn = payrollMonthly + smMonthly + rndMonthly + gaMonthly;
  const netBurn = burn + structuralBurn;

  const runwayMonths = netBurn > 0 ? cash / netBurn : 0;

  const burnMultiple = (() => {
    const growthAdjustedRevenue = mrr * (1 + monthlyGrowth / 100) * (1 - monthlyChurn / 100);
    if (growthAdjustedRevenue <= 0) return 0;
    return netBurn / growthAdjustedRevenue;
  })();

  const survivalProbability = clamp(runwayMonths * 6 + (nrr / 100) * 10 - burnMultiple * 5, 0, 100);

  const canLock = useMemo(() => {
    if (lockedView) return true;
    const companyName = String(draft.identity.companyName ?? "").trim();
    const currency = draft.identity.currency;
    const anySignal =
      Number(draft.metrics.cashOnHand ?? 0) > 0 ||
      Number(draft.metrics.monthlyBurn ?? 0) > 0 ||
      Number(draft.metrics.currentARR ?? 0) > 0 ||
      Number(draft.operating.headcount ?? 0) > 0 ||
      Number(draft.operating.avgFullyLoadedCostAnnual ?? 0) > 0 ||
      Number(draft.operating.smMonthly ?? 0) > 0 ||
      Number(draft.operating.rndMonthly ?? 0) > 0 ||
      Number(draft.operating.gaMonthly ?? 0) > 0;

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
        {/* LEFT NAV (minimal status + actions) */}
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
          <CommandDeckBezel>
            <div className={styles.deck}>
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
                  <div className={styles.chip}>
                    <span className={styles.chipLabel}>Net Burn</span>
                    <span className={styles.chipValue}>{netBurn > 0 ? fmt(Math.round(netBurn)) : "—"}</span>
                  </div>
                  <div className={styles.chip}>
                    <span className={styles.chipLabel}>Survival</span>
                    <span className={styles.chipValue}>{survivalProbability > 0 ? `${Math.round(survivalProbability)}%` : "—"}</span>
                  </div>
                  <div className={`${styles.chip} ${styles.chipGold}`}>
                    <span className={styles.chipLabel}>Audit Mode</span>
                    <span className={styles.chipValue}>{lockedView ? "ON" : "DRAFT"}</span>
                  </div>
                </div>
              </header>

              <section className={styles.compoundGrid}>
                {/* Liquidity & Funding */}
                <div className={styles.compound}>
                  <div className={styles.compoundTitle}>Liquidity &amp; Funding</div>
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
                    <Field label="Runway (derived, months)">
                      <input className={styles.input} value={runwayMonths > 0 ? runwayMonths.toFixed(1) : "—"} disabled />
                    </Field>
                    <Field label="Funding Context">
                      <input className={styles.input} disabled placeholder="(wire next)" />
                    </Field>
                  </div>
                </div>

                {/* Revenue Engine */}
                <div className={styles.compound}>
                  <div className={styles.compoundTitle}>Revenue Engine</div>
                  <div className={styles.grid2}>
                    <MoneyField
                      label="Current ARR"
                      currency={view.identity.currency ?? "USD"}
                      value={Number(view.metrics.currentARR ?? 0)}
                      disabled={lockedView}
                      onChange={(n) => setDraft({ metrics: { currentARR: n } })}
                    />
                    <Field label="Monthly Growth %">
                      <input
                        className={styles.input}
                        value={String(view.metrics.monthlyGrowthPct ?? "")}
                        onChange={(e) =>
                          setDraft({
                            metrics: { monthlyGrowthPct: e.target.value === "" ? undefined : clamp(toNumber(e.target.value), 0, 1000) },
                          })
                        }
                        disabled={lockedView}
                        placeholder="e.g. 8"
                      />
                    </Field>
                    <Field label="Monthly Churn %">
                      <input
                        className={styles.input}
                        value={String(view.metrics.monthlyChurnPct ?? "")}
                        onChange={(e) =>
                          setDraft({
                            metrics: { monthlyChurnPct: e.target.value === "" ? undefined : clamp(toNumber(e.target.value), 0, 100) },
                          })
                        }
                        disabled={lockedView}
                        placeholder="e.g. 3"
                      />
                    </Field>
                    <Field label="NRR %">
                      <input
                        className={styles.input}
                        value={String(view.metrics.nrrPct ?? "")}
                        onChange={(e) =>
                          setDraft({
                            metrics: { nrrPct: e.target.value === "" ? undefined : clamp(toNumber(e.target.value), 0, 300) },
                          })
                        }
                        disabled={lockedView}
                        placeholder="e.g. 110"
                      />
                    </Field>
                  </div>
                </div>

                {/* Execution Velocity */}
                <div className={styles.compound}>
                  <div className={styles.compoundTitle}>Execution Velocity</div>
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
                    <MoneyField
                      label="Avg Fully Loaded Cost (annual)"
                      currency={view.identity.currency ?? "USD"}
                      value={Number(view.operating.avgFullyLoadedCostAnnual ?? 0)}
                      disabled={lockedView}
                      onChange={(n) => setDraft({ operating: { avgFullyLoadedCostAnnual: n } })}
                    />
                    <MoneyField
                      label="Sales & Marketing (monthly)"
                      currency={view.identity.currency ?? "USD"}
                      value={Number(view.operating.smMonthly ?? 0)}
                      disabled={lockedView}
                      onChange={(n) => setDraft({ operating: { smMonthly: n } })}
                    />
                    <MoneyField
                      label="R&D (monthly)"
                      currency={view.identity.currency ?? "USD"}
                      value={Number(view.operating.rndMonthly ?? 0)}
                      disabled={lockedView}
                      onChange={(n) => setDraft({ operating: { rndMonthly: n } })}
                    />
                    <MoneyField
                      label="G&A (monthly)"
                      currency={view.identity.currency ?? "USD"}
                      value={Number(view.operating.gaMonthly ?? 0)}
                      disabled={lockedView}
                      onChange={(n) => setDraft({ operating: { gaMonthly: n } })}
                    />
                  </div>
                </div>

                {/* Strategic Posture */}
                <div className={styles.compound}>
                  <div className={styles.compoundTitle}>Strategic Posture</div>
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
                    <Field label="Primary Objective">
                      <input className={styles.input} disabled placeholder="(wire next)" />
                    </Field>
                    <Field label="Risk Appetite">
                      <input className={styles.input} disabled placeholder="(wire next)" />
                    </Field>
                  </div>
                </div>
              </section>

              <footer className={styles.footer}>
                <div className={styles.footerLeft}>
                  <div className={styles.footerBadge}>{lockedView ? "TRUTH LOCKED · sf.baseline.v1" : "DRAFT · not locked"}</div>
                </div>
                <div className={styles.footerRight}>
                  <button className={styles.primaryBtn} type="button" onClick={onLock} disabled={!canLock}>
                    {lockedView ? "Continue" : "Lock Baseline & Enter STRATFIT"}
                  </button>
                </div>
              </footer>
            </div>
          </CommandDeckBezel>
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


