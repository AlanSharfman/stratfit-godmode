// src/pages/ScenarioMemoPage.tsx
// STRATFIT — Print-to-PDF Scenario Intelligence Memo
// Truth rule: baseline must come from engineResults.base (not current snapshot).

import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { mapScenarioIntelligence, type ScenarioMetricsSnapshot } from "@/utils/scenarioIntelligenceMapping";
import { buildScenarioIntelligence, buildScenarioMemo, type ScenarioMemo } from "../memo/buildScenarioMemo";

// Helper: Extracts a minimal snapshot from engine result for memo
function snapshotFromEngineResult(result: any): ScenarioMetricsSnapshot | null {
  if (!result || !result.kpis) return null;

  const k = result.kpis;

  const read = (key: string): number => {
    const v = k?.[key]?.value;
    return typeof v === "number" ? v : 0;
  };

  // Risk semantics: riskIndex is "health" (higher = better)
  const riskIndex = read("riskIndex");
  const riskScore = read("riskScore") || (100 - riskIndex);

  // ARR: prefer next 12, fallback current
  const arrNext12 = read("arrNext12");
  const arrCurrent = read("arrCurrent");

  // Burn: your engine uses burnQuality as "$K monthly burn" display
  // We treat burnRateMonthly as dollars/month (proxy).
  const burnQualityK = read("burnQuality"); // value is in K
  const burnRateMonthly = burnQualityK * 1000;

  // Margin proxy: earningsPower is percent-like in your KPI contract
  const earningsPower = read("earningsPower"); // proxy for margin/efficiency
  const grossMarginPct = earningsPower; // explicit proxy (you can rename later if you add true GM)

  return {
    runwayMonths: read("runway"),
    cashPosition: read("cashPosition"),
    burnRateMonthly,
    arr: arrNext12 !== 0 ? arrNext12 : arrCurrent,
    arrGrowthPct: read("arrGrowthPct"),
    grossMarginPct,
    riskScore,
    enterpriseValue: read("enterpriseValue"),
  };
}

// Helper: Maps scenarioId to display name
function scenarioNameFromId(id: string): string {
  switch (id) {
    case "base": return "Base Case";
    case "upside": return "Upside";
    case "downside": return "Downside";
    case "stress": return "Stress";
    default: return id;
  }
}

const interFont = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');`;

const memoStyles = `
${interFont}
.memo-root {
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 34px;
  background: #fff;
  color: #111;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}
h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: 0.01em;
}
h2 {
  font-size: 12px;
  font-weight: 700;
  margin-top: 22px;
  margin-bottom: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #111;
}
ul {
  margin: 0;
  padding-left: 18px;
}
li {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #111;
}
.memo-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.memo-meta {
  font-size: 12px;
  color: #333;
  opacity: 0.75;
  margin-bottom: 12px;
}
.memo-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.memo-footer {
  color: #888;
  font-size: 13px;
  opacity: 0.7;
  margin-top: 40px;
  border-top: 2px solid #b6e0fe;
  padding-top: 18px;
  text-align: left;
}
@media print {
  .no-print { display: none !important; }
  body { margin: 0; background: #fff !important; }
  .memo-root {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 18mm;
  }
}
`;

const sectionStyle: React.CSSProperties = {
  background: "#f8fafc",
  borderRadius: 10,
  padding: "18px 18px 10px 18px",
  marginBottom: 18,
  boxShadow: "0 1px 4px 0 #e0e7ef",
};
const bulletStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#222",
  marginBottom: 6,
  lineHeight: 1.6,
};
const bodyText: React.CSSProperties = {
  fontSize: 14,
  color: "#222",
  lineHeight: 1.6,
};
const footerStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
  opacity: 0.7,
  marginTop: 40,
  borderTop: "2px solid #b6e0fe",
  paddingTop: 18,
  textAlign: "left",
};

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

export default function ScenarioMemoPage() {
  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const memo: ScenarioMemo | null = useMemo(() => {
    const currentResult = engineResults?.[activeScenarioId];
    const baselineResult = engineResults?.["base"];

    const current = snapshotFromEngineResult(currentResult);
    const baseline = snapshotFromEngineResult(baselineResult);

    if (!current) return null;

    // If baseline is missing (first load), fall back to current (but keep explicit)
    const baselineSnap = baseline ?? current;

    return buildScenarioMemo(
      buildScenarioIntelligence({
        scenarioId: activeScenarioId,
        scenarioName: scenarioNameFromId(activeScenarioId),
        preparedAt: new Date().toISOString(),
        modelVersion: "1.0",
        assessment: mapScenarioIntelligence({ current, baseline: baselineSnap }),
      })
    );
  }, [engineResults, activeScenarioId]);

  const systemState = useMemo(() => {
    const currentResult = engineResults?.[activeScenarioId];
    const baselineResult = engineResults?.["base"];
    const current = snapshotFromEngineResult(currentResult);
    const baseline = snapshotFromEngineResult(baselineResult);

    if (!current) return null;

    const delta = (a: number, b: number) => (Number.isFinite(a) && Number.isFinite(b) ? a - b : 0);

    const baselineSnap = baseline ?? current;

    return {
      current,
      baseline: baselineSnap,
      deltas: {
        runway: delta(current.runwayMonths, baselineSnap.runwayMonths),
        cash: delta(current.cashPosition, baselineSnap.cashPosition),
        arr: delta(current.arr, baselineSnap.arr),
        risk: delta(current.riskScore, baselineSnap.riskScore),
        ev: delta(current.enterpriseValue, baselineSnap.enterpriseValue),
      },
    };
  }, [engineResults, activeScenarioId]);

  if (!memo || !systemState) {
    return <div className="memo-root">No memo available.</div>;
  }

  function normalizeSeverity(sev: string) {
    const s = String(sev ?? "").toUpperCase();
    if (["HIGH", "ELEVATED", "MODERATE", "STABLE"].includes(s)) return s;
    return "MODERATE";
  }

  const { current, baseline, deltas } = systemState;

  const deltaBadge = (n: number, suffix = "") => {
    const sign = n > 0 ? "+" : n < 0 ? "−" : "";
    const abs = Math.abs(n);
    return `${sign}${suffix ? `${abs}${suffix}` : abs}`;
  };

  return (
    <div className="memo-root">
      <style>{memoStyles}</style>

      {/* Header */}
      <div className="memo-topbar">
        <div>
          <h1>Scenario Intelligence Memo</h1>
          <div className="memo-meta">
            Scenario: {memo.scenarioName} • Prepared: {new Date(memo.preparedAt).toLocaleString()}
          </div>
        </div>
        <button className="memo-btn no-print" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      {/* Executive Summary */}
      <section style={sectionStyle}>
        <h2>Executive Summary</h2>
        <ul>
          {memo.executiveSummary.slice(0, 5).map((item, i) => (
            <li key={i} style={bulletStyle}>{item}</li>
          ))}
        </ul>
      </section>

      {/* System State */}
      <section style={sectionStyle}>
        <h2>System State</h2>
        <ul>
          <li style={bulletStyle}>
            <strong>Runway:</strong> {Math.round(current.runwayMonths)} mo
            {" "}
            (Δ vs Base: {deltas.runway >= 0 ? "+" : ""}{Math.round(deltas.runway)} mo)
          </li>
          <li style={bulletStyle}>
            <strong>Cash Position:</strong> {fmtMoney(current.cashPosition)}
            {" "}
            (Δ vs Base: {deltas.cash >= 0 ? "+" : ""}{fmtMoney(deltas.cash)})
          </li>
          <li style={bulletStyle}>
            <strong>ARR (Next 12):</strong> {fmtMoney(current.arr)}
            {" "}
            (Δ vs Base: {deltas.arr >= 0 ? "+" : ""}{fmtMoney(deltas.arr)})
          </li>
          <li style={bulletStyle}>
            <strong>ARR Growth:</strong> {fmtPct(current.arrGrowthPct)}
            {" "}
            (Base: {fmtPct(baseline.arrGrowthPct)})
          </li>
          <li style={bulletStyle}>
            <strong>Risk Score (danger):</strong> {Math.round(current.riskScore)}/100
            {" "}
            (Δ vs Base: {deltas.risk >= 0 ? "+" : ""}{Math.round(deltas.risk)})
          </li>
          <li style={bulletStyle}>
            <strong>Enterprise Value:</strong> {fmtMoney(current.enterpriseValue)}
            {" "}
            (Δ vs Base: {deltas.ev >= 0 ? "+" : ""}{fmtMoney(deltas.ev)})
          </li>
          <li style={bulletStyle}>
            <strong>Burn (proxy):</strong> {fmtMoney(current.burnRateMonthly)}/mo
            {" "}
            <span style={{ opacity: 0.75 }}>(from burnQuality KPI)</span>
          </li>
          <li style={bulletStyle}>
            <strong>Margin/Efficiency (proxy):</strong> {fmtPct(current.grossMarginPct)}
            {" "}
            <span style={{ opacity: 0.75 }}>(from earningsPower KPI)</span>
          </li>
        </ul>
      </section>

      {/* Key Observations */}
      <section style={sectionStyle}>
        <h2 style={{ color: "#2563eb", background: "#e0edff", borderRadius: 8, padding: "4px 14px", fontFamily: "inherit" }}>
          Key Observations
        </h2>
        <ul>
          {memo.keyObservations.slice(0, 4).map((item, i) => (
            <li key={i} style={bulletStyle}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Risk Signals */}
      {memo.riskSignals.length ? (
        <section style={sectionStyle}>
          <h2 style={{ color: "#a78bfa", background: "#f3e8ff", borderRadius: 8, padding: "4px 14px", fontFamily: "inherit" }}>
            Risk Signals
          </h2>
          {memo.riskSignals.slice(0, 3).map((risk, i) => (
            <div key={i} className="memo-risk-block">
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.06, marginBottom: 8, fontFamily: "inherit" }}>
                {normalizeSeverity(risk.severity)} · {risk.title}
              </div>
              <div style={bodyText}><strong>Driver:</strong> {risk.driver}</div>
              <div style={bodyText}><strong>Impact:</strong> {risk.impact}</div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Leadership Attention Signals */}
      <section style={sectionStyle}>
        <h2 style={{ color: "#22c55e", background: "#e7fbe9", borderRadius: 8, padding: "4px 14px", fontFamily: "inherit" }}>
          Leadership Attention Signals
        </h2>
        <ul>
          {memo.leadershipAttention.slice(0, 3).map((item, i) => (
            <li key={i} style={bulletStyle}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Assumption Flags (optional) */}
      {memo.assumptionFlags && memo.assumptionFlags.length ? (
        <section style={sectionStyle}>
          <h2>Assumption Flags</h2>
          <ul>
            {memo.assumptionFlags.slice(0, 2).map((item, i) => (
              <li key={i} style={bulletStyle}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Strategic Questions & Answers (optional) */}
      {memo.strategicQA && memo.strategicQA.length ? (
        <section style={sectionStyle}>
          <h2 style={{ color: "#0ea5e9", background: "#e0f7fa", borderRadius: 8, padding: "4px 14px", fontFamily: "inherit" }}>
            Strategic Q&amp;A
          </h2>
          {memo.strategicQA.slice(0, 2).map((qa, i) => (
            <div
              key={i}
              className="memo-qa-block"
              style={{
                padding: "18px 18px 14px 18px",
                border: "2px solid #bae6fd",
                background: "#f0f9ff",
                borderRadius: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ ...bodyText, fontWeight: 700, color: "#0ea5e9", fontSize: 15 }}>
                Q: {qa.question}
              </div>
              <div style={{ ...bodyText, marginTop: 8, color: "#334155", fontSize: 15 }}>
                A: {qa.answer}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Footer */}
      <div className="memo-footer" style={footerStyle}>
        {memo.traceability}
      </div>
    </div>
  );
}
