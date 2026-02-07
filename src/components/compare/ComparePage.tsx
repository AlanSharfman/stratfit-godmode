// src/components/compare/ComparePage.tsx
// STRATFIT — Scenario Delta Engine (God Mode)
// Purpose: Prove STRATFIT is a scenario delta engine, not a dashboard.

import React, { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { ScenarioMountain } from "@/components/mountain/ScenarioMountain";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { useScenarioStore, type ScenarioId } from "@/state/scenarioStore";
import { useEngineStore } from "@/state/engineStore";
import { getCompareSelection } from "@/compare/selection";
import { loadScenarioResult } from "@/strategy/scenarioResults";
import "./ComparePage.css";

const BASELINE_ID: ScenarioId = "base";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt$(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function signed(v: number, unit: string, invert = false): string {
  const n = invert ? -v : v;
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(n % 1 === 0 ? 0 : 1)}${unit}`;
}

function signedMoney(v: number): string {
  const sign = v >= 0 ? "+" : "-";
  return `${sign}${fmt$(Math.abs(v))}`;
}

function tone(delta: number, invertBetter = false): "emerald" | "red" | "neutral" {
  const better = invertBetter ? delta < 0 : delta > 0;
  if (Math.abs(delta) < 0.01) return "neutral";
  return better ? "emerald" : "red";
}

function scenarioLabel(sid: ScenarioId): string {
  return sid === "base" ? "BASE" : sid === "upside" ? "UPSIDE" : sid === "downside" ? "DOWNSIDE" : "STRESS";
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ComparePage: React.FC = () => {
  const { activeScenarioId, engineResults, hoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
      hoveredKpiIndex: s.hoveredKpiIndex,
    }))
  );

  const engineStatus = useEngineStore((s) => s.status);
  const confidencePct = useEngineStore((s) => s.confidencePct);

  useEffect(() => {
    // PASS 4B: apply pinned selection if present (baseline + scenario).
    const sel = getCompareSelection();
    const pinned = sel?.scenarioIds?.[0];
    if (!pinned) return;
    if (pinned === "base" || pinned === "upside" || pinned === "downside" || pinned === "stress") {
      // Avoid redundant state churn.
      if (useScenarioStore.getState().activeScenarioId !== pinned) {
        useScenarioStore.getState().setScenario(pinned);
      }
    }
  }, []);

  const sid = activeScenarioId || "base";
  const bResult = engineResults?.[BASELINE_ID];
  const aResult = engineResults?.[sid];

  // PASS 4C: read stored per-scenario simulation result (if any)
  const stored = useMemo(() => loadScenarioResult(String(sid)), [sid]);

  const baselineForces = useMemo(() => engineResultToMountainForces(bResult), [bResult]);
  const activeForces = useMemo(() => engineResultToMountainForces(aResult), [aResult]);

  const bk = bResult?.kpis;
  const ak = aResult?.kpis;

  // ── Extract raw values ──────────────────────────────────────────────────────
  const rBase = bk?.runway?.value ?? 0;
  const rActive = ak?.runway?.value ?? 0;
  const evBase = bk?.enterpriseValue?.value ?? 0;
  const evActive = ak?.enterpriseValue?.value ?? 0;
  const riskBase = (bk?.riskScore as any)?.value ?? 50;
  const riskActive = (ak?.riskScore as any)?.value ?? 50;
  const volBase = (bk?.growthStress as any)?.value ?? 0.5;
  const volActive = (ak?.growthStress as any)?.value ?? 0.5;

  // ── Top 4 deltas ────────────────────────────────────────────────────────────
  const deltas = useMemo(() => {
    const dSurv = rActive - rBase;
    const dEv = evActive - evBase;
    const dRisk = riskActive - riskBase;
    const dVol = (volActive - volBase) * 100;
    return [
      { label: "Δ SURVIVAL", value: signed(dSurv, " mo"), tone: tone(dSurv) },
      { label: "Δ MEDIAN OUTCOME", value: signedMoney(dEv / 10), tone: tone(dEv) },
      { label: "Δ TAIL RISK", value: signed(dRisk, "", true), tone: tone(dRisk, true) },
      { label: "Δ VOLATILITY", value: signed(dVol, "%", true), tone: tone(dVol, true) },
    ];
  }, [rBase, rActive, evBase, evActive, riskBase, riskActive, volBase, volActive]);

  // ── Structural breakdown ────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const cashB = bk?.cashPosition?.value ?? 0;
    const cashA = ak?.cashPosition?.value ?? 0;
    const arrB = bk?.arrCurrent?.value ?? 0;
    const arrA = ak?.arrCurrent?.value ?? 0;
    const burnB = bk?.burnQuality?.value ?? 0;
    const burnA = ak?.burnQuality?.value ?? 0;
    const ltvB = (bk?.ltvCac as any)?.value ?? 0;
    const ltvA = (ak?.ltvCac as any)?.value ?? 0;

    return [
      { metric: "Runway", base: bk?.runway?.display ?? "—", active: ak?.runway?.display ?? "—", delta: rActive - rBase, fmt: signed(rActive - rBase, " mo"), better: rActive - rBase > 0 },
      { metric: "Cash Position", base: bk?.cashPosition?.display ?? "—", active: ak?.cashPosition?.display ?? "—", delta: cashA - cashB, fmt: signedMoney(cashA - cashB), better: cashA - cashB > 0 },
      { metric: "ARR", base: bk?.arrCurrent?.display ?? "—", active: ak?.arrCurrent?.display ?? "—", delta: arrA - arrB, fmt: signedMoney(arrA - arrB), better: arrA - arrB > 0 },
      { metric: "Risk Score", base: (bk?.riskScore as any)?.display ?? "—", active: (ak?.riskScore as any)?.display ?? "—", delta: -(riskActive - riskBase), fmt: signed(riskActive - riskBase, "", true), better: riskActive - riskBase < 0 },
      { metric: "Enterprise Value", base: bk?.enterpriseValue?.display ?? "—", active: ak?.enterpriseValue?.display ?? "—", delta: evActive - evBase, fmt: signedMoney((evActive - evBase) / 10), better: evActive - evBase > 0 },
      { metric: "Burn Rate", base: bk?.burnQuality?.display ?? "—", active: ak?.burnQuality?.display ?? "—", delta: -(burnA - burnB), fmt: signed(burnA - burnB, "K", true), better: burnA - burnB < 0 },
      { metric: "LTV/CAC", base: (bk?.ltvCac as any)?.display ?? "—", active: (ak?.ltvCac as any)?.display ?? "—", delta: ltvA - ltvB, fmt: signed(ltvA - ltvB, "x"), better: ltvA - ltvB > 0 },
    ];
  }, [bk, ak, rActive, rBase, evActive, evBase, riskActive, riskBase]);

  return (
    <div className="sf-compare-root">
      {/* ═══ HEADER ═══ */}
      <header className="sf-compare-header">
        <div className="sf-compare-header-left">
          <span className="sf-compare-badge">COMPARE</span>
          <span className="sf-compare-subtitle">
            Baseline vs {scenarioLabel(sid)}
          </span>
        </div>
        {engineStatus === "Complete" && confidencePct != null && (
          <div className="sf-compare-confidence">
            <span className="sf-compare-conf-dot" />
            Engine Confidence: {confidencePct}%
          </div>
        )}
      </header>

      {/* PASS 4C: Stored results status (telemetry) */}
      {sid !== "base" && !stored ? (
        <div className="mx-auto mt-3 max-w-[1100px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[12px] text-white/70">
          No simulation result yet — run simulation in Strategy Studio.
        </div>
      ) : sid !== "base" && stored ? (
        <div className="mx-auto mt-3 max-w-[1100px] rounded-xl border border-cyan-300/20 bg-cyan-400/8 px-4 py-3 text-[12px] text-cyan-50/90">
          Stored simulation loaded.
        </div>
      ) : null}

      {/* ═══ MOUNTAIN OVERLAY ═══ */}
      <section className="sf-compare-mountains">
        <div className="sf-compare-mountain-layer sf-compare-mountain-layer--ghost">
          <ScenarioMountain
            scenario={BASELINE_ID}
            dataPoints={baselineForces}
            activeKpiIndex={hoveredKpiIndex}
            mode="ghost"
            glowIntensity={0.3}
          />
        </div>
        <div className="sf-compare-mountain-layer sf-compare-mountain-layer--primary">
          <ScenarioMountain
            scenario={sid}
            dataPoints={activeForces}
            activeKpiIndex={hoveredKpiIndex}
            mode="default"
            glowIntensity={1.2}
          />
        </div>
        <div className="sf-compare-labels-strip">
          <span className="sf-compare-label sf-compare-label--ghost">BASELINE</span>
          <span className="sf-compare-label sf-compare-label--primary">{scenarioLabel(sid)}</span>
        </div>
      </section>

      {/* ═══ 4 DELTA CARDS ═══ */}
      <section className="sf-compare-delta-strip">
        {deltas.map((d) => (
          <div key={d.label} className={`sf-delta-cell sf-delta-cell--${d.tone}`}>
            <div className="sf-delta-cell-label">{d.label}</div>
            <div className="sf-delta-cell-value">{d.value}</div>
          </div>
        ))}
      </section>

      {/* ═══ STRUCTURAL DELTA BREAKDOWN ═══ */}
      <section className="sf-compare-breakdown">
        <div className="sf-breakdown-heading">STRUCTURAL DELTA BREAKDOWN</div>
        <div className="sf-breakdown-header-row">
          <div>Metric</div>
          <div>Baseline</div>
          <div>Scenario</div>
          <div>Δ Change</div>
        </div>
        {rows.map((r) => (
          <div key={r.metric} className="sf-breakdown-row">
            <div className="sf-breakdown-metric">{r.metric}</div>
            <div className="sf-breakdown-val">{r.base}</div>
            <div className="sf-breakdown-val">{r.active}</div>
            <div className={`sf-breakdown-delta ${r.better ? "sf-breakdown-delta--pos" : r.delta !== 0 ? "sf-breakdown-delta--neg" : ""}`}>
              {r.fmt}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ComparePage;
