// src/components/ui/ScenarioIntelligencePanel.tsx
// STRATFIT — Scenario Intelligence (Cold Brief) — deterministic, UI-only wiring

import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";

type Kpi = { value: number; display: string };

function getKpi(result: any, key: string): Kpi | null {
  const k = result?.kpis?.[key];
  if (!k || typeof k.value !== "number" || typeof k.display !== "string") return null;
  return k as Kpi;
}

function fmtDelta(n: number, unit: string) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number.isFinite(n) ? n.toFixed(unit === "mo" ? 0 : 1) : "—"}${unit ? ` ${unit}` : ""}`;
}

function safeNum(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export default function ScenarioIntelligencePanel() {
  const { scenario, activeScenarioId, current, base } = useScenarioStore(
    useShallow((s) => {
      const current = s.engineResults?.[s.activeScenarioId];
      const base = s.engineResults?.["base"];
      return { scenario: s.scenario, activeScenarioId: s.activeScenarioId, current, base };
    })
  );

  const view = useMemo(() => {
    const runway = getKpi(current, "runway");
    const cash = getKpi(current, "cashPosition");
    const momentum = getKpi(current, "momentum");
    const arrGrowthPct = getKpi(current, "arrGrowthPct");
    const arrDelta = getKpi(current, "arrDelta");
    const margin = getKpi(current, "earningsPower");
    const risk = getKpi(current, "riskIndex");

    const runwayBase = getKpi(base, "runway");
    const cashBase = getKpi(base, "cashPosition");
    const momentumBase = getKpi(base, "momentum");

    const runwayV = safeNum(runway?.value);
    const cashV = safeNum(cash?.value);
    const momentumV = safeNum(momentum?.value);
    const marginV = safeNum(margin?.value);
    const riskV = safeNum(risk?.value);

    const deltas =
      activeScenarioId !== "base" && runwayBase && cashBase && momentumBase && runwayV !== null && cashV !== null && momentumV !== null
        ? {
            runway: runwayV - runwayBase.value,
            cash: cashV - cashBase.value,
            momentum: momentumV - momentumBase.value,
          }
        : null;

    // Deterministic observation (2–3 short lines)
    const observationLines: string[] = [];
    observationLines.push(
      `Runway ${runway?.display ?? "—"} · Cash ${cash?.display ?? "—"} · Momentum ${momentum?.display ?? "—"}`
    );

    if (arrGrowthPct?.display && arrGrowthPct.display !== "—") {
      observationLines.push(`ARR Growth ${arrGrowthPct.display} · Δ ARR ${arrDelta?.display ?? "—"}`);
    }

    if (deltas) {
      observationLines.push(
        `vs Base: Runway ${fmtDelta(deltas.runway, "mo")} · Cash ${fmtDelta(deltas.cash / 1_000_000, "M")} · Momentum ${fmtDelta(deltas.momentum, "")}`
      );
    }

    if (risk || margin) {
      observationLines.push(
        `${margin ? `Gross Margin ${margin.display}` : ""}${margin && risk ? " · " : ""}${risk ? `Risk ${risk.display}` : ""}`
      );
    }

    // Threshold-based actions (no AI, no orange)
    const actions: string[] = [];

    if (runwayV !== null) {
      if (runwayV < 12) actions.push("Extend runway: cut burn, freeze non-critical hiring, or raise capital.");
      else if (runwayV < 18) actions.push("Tighten burn discipline to reach 18+ months of runway.");
    }

    if (marginV !== null && marginV < 60) {
      actions.push("Improve gross margin: pricing, COGS reduction, and churn mitigation.");
    }

    if (riskV !== null && riskV >= 65) {
      actions.push("Reduce execution risk: de-risk roadmap, secure financing, and simplify dependencies.");
    } else if (riskV !== null && riskV >= 45) {
      actions.push("Add guardrails: tighten forecasts, stage investments, and monitor leading indicators weekly.");
    }

    if (momentumV !== null && momentumV < 40) {
      actions.push("Rebuild momentum: sharpen ICP, strengthen pipeline, and focus on retention-led expansion.");
    }

    // Always show 2–3, deterministic ordering
    const topActions = actions.slice(0, 3);

    return {
      observationLines: observationLines.filter(Boolean).slice(0, 3),
      signals: {
        runway: runway?.display ?? "—",
        cash: cash?.display ?? "—",
        momentum: momentum?.display ?? "—",
      },
      actions: topActions.length ? topActions : ["Maintain posture: continue monitoring runway, margin, and risk for drift."],
      scenarioLabel: activeScenarioId.toUpperCase(),
      accent: "rgba(34,211,238,0.35)",
    };
  }, [activeScenarioId, base, current]);

  return (
    <div className="cold-panel">
      <div className="cold-header">
        <div className="cold-title">SCENARIO INTELLIGENCE</div>
        <div className="cold-subtitle">
          Cold Brief <span style={{ opacity: 0.55 }}>·</span>{" "}
          <span style={{ opacity: 0.85 }}>{view.scenarioLabel}</span>
        </div>
      </div>

      <div className="cold-section">
        <div className="cold-section-title">OBSERVATION</div>
        <div className="text-[13px] leading-relaxed text-white/80">
          {view.observationLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      <div className="cold-section">
        <div className="cold-section-title">SIGNALS</div>
        <div className="signals">
          <div className="signal">
            <div className="signal-label">Runway</div>
            <div className="signal-dir">{view.signals.runway}</div>
          </div>
          <div className="signal">
            <div className="signal-label">Cash</div>
            <div className="signal-dir">{view.signals.cash}</div>
          </div>
          <div className="signal">
            <div className="signal-label">Momentum</div>
            <div className="signal-dir">{view.signals.momentum}</div>
          </div>
        </div>
      </div>

      <div className="cold-section">
        <div className="cold-section-title">RECOMMENDED ACTIONS</div>
        <ul className="cold-bullets">
          {view.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


