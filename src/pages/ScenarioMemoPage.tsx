// Helper: Extracts a minimal snapshot from engine result for memo
function snapshotFromEngineResult(result: any): ScenarioMetricsSnapshot | null {
  if (!result || !result.kpis) return null;
  return {
    runwayMonths: result.kpis.runway?.value ?? 0,
    cashPosition: result.kpis.cash?.value ?? 0,
    burnRateMonthly: result.kpis.burn?.value ?? 0,
    arr: result.kpis.growth?.value ?? 0,
    arrGrowthPct: result.kpis.growthPct?.value ?? 0,
    grossMarginPct: result.kpis.grossMargin?.value ?? 0,
    riskScore: result.kpis.risk?.value ?? 0,
    enterpriseValue: result.kpis.value?.value ?? 0,
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

import React, { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { mapScenarioIntelligence, type ScenarioMetricsSnapshot } from "@/utils/scenarioIntelligenceMapping";
import { buildScenarioIntelligence, buildScenarioMemo, type ScenarioMemo } from "../memo/buildScenarioMemo";


const interFont = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');`;

const memoStyles = `
${interFont}
.memo-root {
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 34px;
  background: #fff;
  color: #111;
  font-family: 'Inter', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
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

// Inline style objects for sections and bullets
const sectionStyle: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: 10,
  padding: '18px 18px 10px 18px',
  marginBottom: 18,
  boxShadow: '0 1px 4px 0 #e0e7ef',
};
const bulletStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#222',
  marginBottom: 6,
  lineHeight: 1.6,
};
const bodyText: React.CSSProperties = {
  fontSize: 14,
  color: '#222',
  lineHeight: 1.6,
};
const footerStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#888',
  opacity: 0.7,
  marginTop: 40,
  borderTop: '2px solid #b6e0fe',
  paddingTop: 18,
  textAlign: 'left',
};

export default function ScenarioMemoPage() {
  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow(s => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const memo: ScenarioMemo | null = useMemo(() => {
    const result = engineResults?.[activeScenarioId];
    const snapshot = snapshotFromEngineResult(result);
    if (!snapshot) return null;
    // You may need to adjust this call to match your actual buildScenarioMemo signature
    return buildScenarioMemo(
      buildScenarioIntelligence({
        scenarioId: activeScenarioId,
        scenarioName: scenarioNameFromId(activeScenarioId),
        preparedAt: new Date().toISOString(),
        modelVersion: "1.0",
        assessment: mapScenarioIntelligence({ current: snapshot, baseline: snapshot })
      })
    );
  }, [engineResults, activeScenarioId]);

  if (!memo) {
    return <div className="memo-root">No memo available.</div>;
  }

  function normalizeSeverity(sev: string) {
    const s = String(sev ?? "").toUpperCase();
    if (["HIGH", "ELEVATED", "MODERATE", "STABLE"].includes(s)) return s;
    return "MODERATE";
  }

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
        </ul>
      </section>

      {/* Key Observations */}
      <section style={sectionStyle}>
        <h2 style={{color:'#2563eb', background:'#e0edff', borderRadius:8, padding:'4px 14px', fontFamily:'inherit'}}>Key Observations</h2>
        <ul>
          {memo.keyObservations.slice(0, 4).map((item, i) => (
            <li key={i} style={bulletStyle}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Risk Signals */}
      {memo.riskSignals.length ? (
        <section style={sectionStyle}>
          <h2 style={{color:'#a78bfa', background:'#f3e8ff', borderRadius:8, padding:'4px 14px', fontFamily:'inherit'}}>Risk Signals</h2>
          {memo.riskSignals.slice(0, 3).map((risk, i) => (
            <div key={i} className="memo-risk-block">
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.06, marginBottom: 8, fontFamily:'inherit' }}>
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
        <h2 style={{color:'#22c55e', background:'#e7fbe9', borderRadius:8, padding:'4px 14px', fontFamily:'inherit'}}>Leadership Attention Signals</h2>
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
          <h2 style={{color:'#0ea5e9', background:'#e0f7fa', borderRadius:8, padding:'4px 14px', fontFamily:'inherit'}}>Strategic Q&amp;A</h2>
          {memo.strategicQA.slice(0, 2).map((qa, i) => (
            <div key={i} className="memo-qa-block" style={{padding:'18px 18px 14px 18px', border:'2px solid #bae6fd', background:'#f0f9ff', borderRadius:12, marginBottom:18}}>
              <div style={{ ...bodyText, fontWeight: 700, color:'#0ea5e9', fontSize:15 }}>
                Q: {qa.question}
              </div>
              <div style={{ ...bodyText, marginTop: 8, color:'#334155', fontSize:15 }}>
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
