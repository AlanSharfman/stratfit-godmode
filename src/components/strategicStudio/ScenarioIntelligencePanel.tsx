import React, { useMemo, useState } from "react";
import { setCompareSelection } from "@/compare/selection";
import { saveScenarioResult } from "@/strategy/scenarioResults";
import { runScenarioSimulation } from "@/logic/runScenarioSimulation";
import { computeConstraints, computeDerivedMetrics } from "@/strategicStudio/derive";
import type { StudioBaselineModel, StudioScenarioModel } from "@/strategicStudio/types";
import { useStrategicStudioStore } from "@/state/strategicStudioStore";
import TitaniumPanel from "./TitaniumPanel";
import styles from "./ScenarioIntelligencePanel.module.css";

type TabId = "summary" | "deltas" | "constraints" | "ready";

function fmtMoney(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function fmtMo(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const r = Math.max(0, v);
  return `${r.toFixed(r < 10 ? 1 : 0)} mo`;
}

function fmtX(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(v >= 10 ? 0 : 1)}x`;
}

function fmtPct(v01: number | null): string {
  if (v01 == null || !Number.isFinite(v01)) return "—";
  const pct = v01 * 100;
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

function deltaTone(delta: number, invertBetter = false): "good" | "bad" | "neutral" {
  const better = invertBetter ? delta < 0 : delta > 0;
  if (Math.abs(delta) < 1e-6) return "neutral";
  return better ? "good" : "bad";
}

export function ScenarioIntelligencePanel(props: { baseline: StudioBaselineModel; scenario: StudioScenarioModel }) {
  const { baseline, scenario } = props;
  const [tab, setTab] = useState<TabId>("summary");
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");

  const { saveScenario } = useStrategicStudioStore((s) => ({ saveScenario: s.saveScenario }));

  const derived = useMemo(() => computeDerivedMetrics(scenario.leverConfig), [scenario.leverConfig]);
  const derivedBase = useMemo(() => computeDerivedMetrics(baseline.leverConfig), [baseline.leverConfig]);
  const constraints = useMemo(
    () => computeConstraints({ baseline: baseline.leverConfig, scenario: scenario.leverConfig }),
    [baseline.leverConfig, scenario.leverConfig]
  );

  const hasCritical = constraints.some((c) => c.severity === "critical");
  const hasAnyLeverChanged = useMemo(() => {
    // Simple check: compare to baseline levers.
    const keys = Object.keys(baseline.leverConfig) as Array<keyof typeof baseline.leverConfig>;
    return keys.some((k) => baseline.leverConfig[k] !== scenario.leverConfig[k]);
  }, [baseline.leverConfig, scenario.leverConfig]);

  const readiness = useMemo(() => {
    const checks: Array<{ label: string; ok: boolean; detail?: string }> = [
      { label: "Scenario named", ok: !!scenario.name.trim() && scenario.name.trim().length >= 2 },
      { label: "At least one lever changed", ok: hasAnyLeverChanged },
      { label: "No critical constraints", ok: !hasCritical },
      { label: "Saved", ok: scenario.status === "saved" && !scenario.hasUnsavedChanges },
      { label: "Engine config ready", ok: true, detail: "Stub runner is wired (adapter exists)." },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return { checks, okCount, total: checks.length };
  }, [hasAnyLeverChanged, hasCritical, scenario.hasUnsavedChanges, scenario.name, scenario.status]);

  const topImpacts = useMemo(() => {
    const dRunway = (derived.runwayMonths ?? 0) - (derivedBase.runwayMonths ?? 0);
    const dBurn = scenario.leverConfig.monthlyNetBurn - baseline.leverConfig.monthlyNetBurn;
    const dArr = scenario.leverConfig.currentARR - baseline.leverConfig.currentARR;
    const list = [
      { label: "Runway", delta: dRunway, fmt: `${dRunway >= 0 ? "+" : ""}${dRunway.toFixed(1)} mo`, betterWhenHigher: true },
      { label: "Monthly burn", delta: dBurn, fmt: `${dBurn >= 0 ? "+" : ""}${fmtMoney(dBurn)}`, betterWhenHigher: false },
      { label: "ARR", delta: dArr, fmt: `${dArr >= 0 ? "+" : ""}${fmtMoney(dArr)}`, betterWhenHigher: true },
    ];
    return list.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  }, [baseline.leverConfig.currentARR, baseline.leverConfig.monthlyNetBurn, derived.runwayMonths, derivedBase.runwayMonths, scenario.leverConfig.currentARR, scenario.leverConfig.monthlyNetBurn]);

  const run = async () => {
    if (runState === "running") return;
    setRunState("running");
    try {
      // Ensure baseline stored result exists (improves Compare deltas)
      const baseRes = await runScenarioSimulation({ baseline: baseline.leverConfig, scenario: baseline.leverConfig });
      saveScenarioResult("base", baseRes);
      try {
        window.dispatchEvent(new CustomEvent("sf:scenarioResultsUpdated", { detail: { scenarioId: "base" } }));
      } catch {
        // ignore
      }

      const res = await runScenarioSimulation({ baseline: baseline.leverConfig, scenario: scenario.leverConfig });
      saveScenarioResult(String(scenario.id), res);
      try {
        window.dispatchEvent(new CustomEvent("sf:scenarioResultsUpdated", { detail: { scenarioId: String(scenario.id) } }));
      } catch {
        // ignore
      }
      setRunState("done");
      window.setTimeout(() => setRunState("idle"), 1500);
    } catch (e) {
      console.error("Run simulation failed", e);
      setRunState("idle");
      window.alert("Simulation failed. Check console for details.");
    }
  };

  const viewInCompare = () => {
    setCompareSelection({ baseline: true, scenarioIds: [String(scenario.id)] });
    window.location.assign("/?view=compare");
  };

  return (
    <TitaniumPanel
      kicker="Scenario intelligence"
      title="Intelligence"
      rightSlot={
        <div className="text-[11px] text-white/55">
          Ready: <span className="text-white/80 font-extrabold">{readiness.okCount}/{readiness.total}</span>
        </div>
      }
      footer={
        <div className={styles.footerCtas}>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => saveScenario(scenario.id as any)}
            title="Explicitly save the scenario (required before investor demo flow)"
          >
            Save Scenario
          </button>
          <button
            type="button"
            className={styles.ctaSecondary}
            onClick={run}
            disabled={runState === "running"}
            title="Run simulation (stub adapter wired; results stored per scenario for Compare)"
          >
            {runState === "running" ? "Running…" : runState === "done" ? "Simulation updated" : "Run Simulation"}
          </button>
          <button type="button" className={styles.ctaGhost} onClick={viewInCompare}>
            View in Compare
          </button>
        </div>
      }
    >
      <div className={styles.tabs}>
        {(
          [
            ["summary", "Summary"],
            ["deltas", "Deltas"],
            ["constraints", "Constraints"],
            ["ready", "Ready Check"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "summary" ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className={styles.grid2}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Runway</div>
              <div className={styles.metricValue}>{fmtMo(derived.runwayMonths)}</div>
              <div className={styles.metricSub}>Baseline: {fmtMo(derivedBase.runwayMonths)}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Burn multiple</div>
              <div className={styles.metricValue}>{fmtX(derived.burnMultiple)}</div>
              <div className={styles.metricSub}>Baseline: {fmtX(derivedBase.burnMultiple)}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Operating profit (approx)</div>
              <div className={styles.metricValue}>
                {derived.operatingProfitApproxMonthly == null ? "—" : fmtMoney(derived.operatingProfitApproxMonthly)}
              </div>
              <div className={styles.metricSub}>Monthly (simple cost model)</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Survival probability</div>
              <div className={styles.metricValue}>—</div>
              <div className={styles.metricSub}>Populated after Run Simulation (stored result).</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Top 3 impacts</div>
            <div className="mt-2 flex flex-col gap-2">
              {topImpacts.map((i) => {
                const good = i.betterWhenHigher ? i.delta > 0 : i.delta < 0;
                const cls = good ? styles.good : styles.bad;
                return (
                  <div key={i.label} className={styles.deltaRow}>
                    <div className={styles.deltaLabel}>{i.label}</div>
                    <div className={`${styles.deltaVal} ${cls}`}>{i.fmt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "deltas" ? (
        <div className="mt-3 flex flex-col gap-2">
          {[
            {
              label: "Δ Runway (months)",
              delta: (derived.runwayMonths ?? 0) - (derivedBase.runwayMonths ?? 0),
              fmt: `${((derived.runwayMonths ?? 0) - (derivedBase.runwayMonths ?? 0)) >= 0 ? "+" : ""}${(((derived.runwayMonths ?? 0) - (derivedBase.runwayMonths ?? 0))).toFixed(1)} mo`,
              invertBetter: false,
            },
            {
              label: "Δ Monthly net burn",
              delta: scenario.leverConfig.monthlyNetBurn - baseline.leverConfig.monthlyNetBurn,
              fmt: `${scenario.leverConfig.monthlyNetBurn - baseline.leverConfig.monthlyNetBurn >= 0 ? "+" : ""}${fmtMoney(scenario.leverConfig.monthlyNetBurn - baseline.leverConfig.monthlyNetBurn)}`,
              invertBetter: true,
            },
            {
              label: "Δ ARR",
              delta: scenario.leverConfig.currentARR - baseline.leverConfig.currentARR,
              fmt: `${scenario.leverConfig.currentARR - baseline.leverConfig.currentARR >= 0 ? "+" : ""}${fmtMoney(scenario.leverConfig.currentARR - baseline.leverConfig.currentARR)}`,
              invertBetter: false,
            },
            {
              label: "Δ Churn",
              delta: scenario.leverConfig.monthlyChurnRate - baseline.leverConfig.monthlyChurnRate,
              fmt: `${(scenario.leverConfig.monthlyChurnRate - baseline.leverConfig.monthlyChurnRate) >= 0 ? "+" : ""}${fmtPct(scenario.leverConfig.monthlyChurnRate - baseline.leverConfig.monthlyChurnRate)}`,
              invertBetter: true,
            },
            {
              label: "Δ NRR",
              delta: scenario.leverConfig.netRevenueRetention - baseline.leverConfig.netRevenueRetention,
              fmt: `${scenario.leverConfig.netRevenueRetention - baseline.leverConfig.netRevenueRetention >= 0 ? "+" : ""}${fmtPct(scenario.leverConfig.netRevenueRetention - baseline.leverConfig.netRevenueRetention)}`,
              invertBetter: false,
            },
          ].map((r) => {
            const tone = deltaTone(r.delta, r.invertBetter);
            const cls = tone === "good" ? styles.good : tone === "bad" ? styles.bad : "";
            return (
              <div key={r.label} className={styles.deltaRow}>
                <div className={styles.deltaLabel}>{r.label}</div>
                <div className={`${styles.deltaVal} ${cls}`}>{r.fmt}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "constraints" ? (
        <div className="mt-3 flex flex-col gap-2">
          {constraints.length ? (
            constraints.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-black text-white/90">{c.title}</div>
                  <div
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-[0.12em] uppercase ${
                      c.severity === "critical"
                        ? "border-red-400/25 bg-red-500/10 text-red-200"
                        : c.severity === "warning"
                          ? "border-white/12 bg-white/6 text-white/70"
                          : "border-cyan-300/20 bg-cyan-400/8 text-cyan-100/80"
                    }`}
                  >
                    {c.severity}
                  </div>
                </div>
                <div className="mt-1 text-[12px] leading-[1.5] text-white/65">{c.detail}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-[12px] text-white/70">
              No constraints flagged. This doesn’t guarantee success—just that guardrails are within typical bounds.
            </div>
          )}
        </div>
      ) : null}

      {tab === "ready" ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Readiness checklist</div>
          <div className="mt-2 flex flex-col gap-2">
            {readiness.checks.map((c) => (
              <div
                key={c.label}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="text-[12px] font-extrabold text-white/80">{c.label}</div>
                <div className={`text-[11px] font-extrabold ${c.ok ? styles.good : styles.bad}`}>
                  {c.ok ? "OK" : "Missing"}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-white/55">
            Note: “Run Simulation” stores results per scenario so Compare/Risk/Valuation/Decision can render read-only
            insights without re-running the engine.
          </div>
        </div>
      ) : null}
    </TitaniumPanel>
  );
}

export default ScenarioIntelligencePanel;


