import React, { useEffect } from "react";
import { buildScenarioMemo, ScenarioMemo } from "../memo/buildScenarioMemo";

// Inter font import (Vercel/Next.js: use @import in CSS, here inline for demo)
const interFont = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');`;

// Memo page expects memo data via window.localStorage or passed prop
function getMemoData(): ScenarioMemo | null {
  try {
    const raw = window.localStorage.getItem("scenarioMemoSnapshot");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ScenarioMemoPage() {
  const memo = getMemoData();

  useEffect(() => {
    // Optional: auto-print on load
    window.print();
  }, []);

  if (!memo) {
    return <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>No memo data found.</div>;
  }

  return (
    <div className="memo-root">
      <style>{interFont}</style>
      <style>{`
        body, .memo-root {
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #222;
        }
        .memo-root {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 32px;
          box-sizing: border-box;
        }
        h1, h2, h3 {
          font-weight: 600;
          margin-bottom: 0.5em;
        }
        .memo-section {
          margin-bottom: 2em;
        }
        .memo-risk-block {
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          background: #fafafa;
          page-break-inside: avoid;
        }
        .memo-footer {
          color: #888;
          font-size: 0.95em;
          border-top: 1px solid #eee;
          padding-top: 16px;
          margin-top: 32px;
        }
        @media print {
          body, .memo-root {
            background: #fff !important;
            color: #222 !important;
          }
          .memo-root {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 24px !important;
            width: 100% !important;
            max-width: none !important;
          }
          .memo-risk-block {
            page-break-inside: avoid;
          }
        }
      `}</style>
      {/* 1. Cover header */}
      <div className="memo-section">
        <h1>{memo.scenarioName}</h1>
        <div>Prepared: {new Date(memo.preparedAt).toLocaleString()}</div>
        <div>Model version: {memo.modelVersion}</div>
      </div>
      {/* 2. Executive Summary */}
      <div className="memo-section">
        <h2>Executive Summary</h2>
        <ul>
          {memo.executiveSummary.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      {/* 3. System State */}
      <div className="memo-section">
        <h2>System State</h2>
        <ul>
          <li>Financial: {memo.systemState.financial}</li>
          <li>Operational: {memo.systemState.operational}</li>
          <li>Execution: {memo.systemState.execution}</li>
        </ul>
      </div>
      {/* 4. Key Observations */}
      <div className="memo-section">
        <h2>Key Observations</h2>
        <ul>
          {memo.keyObservations.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      {/* 5. Risk Signals */}
      {memo.riskSignals.length > 0 && (
        <div className="memo-section">
          <h2>Risk Signals</h2>
          {memo.riskSignals.map((risk, i) => (
            <div className="memo-risk-block" key={i}>
              <div><strong>Severity:</strong> {risk.severity}</div>
              <div><strong>Title:</strong> {risk.title}</div>
              <div><strong>Driver:</strong> {risk.driver}</div>
              <div><strong>Impact:</strong> {risk.impact}</div>
            </div>
          ))}
        </div>
      )}
      {/* 6. Leadership Attention Signals */}
      <div className="memo-section">
        <h2>Leadership Attention Signals</h2>
        <ul>
          {memo.leadershipAttention.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      {/* 7. Assumption Flags (optional) */}
      {memo.assumptionFlags && memo.assumptionFlags.length > 0 && (
        <div className="memo-section">
          <h2>Assumption Flags</h2>
          <ul>
            {memo.assumptionFlags.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {/* 8. Strategic Questions & Answers (optional) */}
      {memo.strategicQA && memo.strategicQA.length > 0 && (
        <div className="memo-section">
          <h2>Strategic Questions & Answers</h2>
          {memo.strategicQA.map((qa, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div><strong>Q:</strong> {qa.question}</div>
              <div><strong>A:</strong> {qa.answer}</div>
            </div>
          ))}
        </div>
      )}
      {/* 9. Traceability footer */}
      <div className="memo-footer">
        {memo.traceability}
      </div>
    </div>
  );
}
