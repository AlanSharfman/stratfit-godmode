// src/components/AIColdPanel.tsx
import React, { useMemo, useState } from "react";

type Severity = "LOW" | "MED" | "HIGH";
type Direction = "UP" | "DOWN" | "FLAT";

export interface AIColdPanelProps {
  // Keep inputs minimal and canonical. These should be passed from AIIntelligence shell.
  scenarioName?: string;
  kpis?: Array<{
    key: string;
    label: string;
    value: string;
    delta?: string;
    direction?: Direction;
    severity?: Severity;
  }>;
  drivers?: Array<{
    label: string;
    detail?: string;
  }>;
  actions?: Array<{
    label: string;
    detail?: string;
  }>;
  trace?: {
    notes?: string[];
    leverDeltas?: Array<{ label: string; from: string; to: string }>;
    kpiDeltas?: Array<{ label: string; from: string; to: string }>;
  };
}

function dirSymbol(dir?: Direction) {
  if (dir === "UP") return "↑";
  if (dir === "DOWN") return "↓";
  return "→";
}

export default function AIColdPanel({
  scenarioName = "Current Scenario",
  kpis = [],
  drivers = [],
  actions = [],
  trace,
}: AIColdPanelProps) {
  const [showTrace, setShowTrace] = useState(false);

  const brief = useMemo(() => {
    // 3 factual bullets, derived from scenario name and top KPIs.
    const bullets: string[] = [];
    bullets.push(`Scenario: ${scenarioName}`);
    
    // Add top 2 KPIs with severity if available
    const topKpis = [...kpis]
      .filter((k) => k.severity)
      .sort((a, b) => {
        const rank = (s?: Severity) => (s === "HIGH" ? 3 : s === "MED" ? 2 : 1);
        return rank(b.severity) - rank(a.severity);
      })
      .slice(0, 2);
    
    if (topKpis[0]) {
      bullets.push(`Primary signal: ${topKpis[0].label} ${dirSymbol(topKpis[0].direction)} (${topKpis[0].value}${topKpis[0].delta ? `, Δ ${topKpis[0].delta}` : ""})`);
    }
    if (topKpis[1]) {
      bullets.push(`Secondary signal: ${topKpis[1].label} ${dirSymbol(topKpis[1].direction)} (${topKpis[1].value}${topKpis[1].delta ? `, Δ ${topKpis[1].delta}` : ""})`);
    }
    
    while (bullets.length < 3) bullets.push("No critical deviations detected.");
    return bullets.slice(0, 3);
  }, [scenarioName, kpis]);

  return (
    <div className="cold-panel">
      <div className="cold-header">
        <div className="cold-title">INTELLIGENCE</div>
        <div className="cold-subtitle">{scenarioName}</div>
      </div>

      <section className="cold-section">
        <div className="cold-section-title">SITUATION BRIEF</div>
        <ul className="cold-bullets">
          {brief.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="cold-section">
        <div className="cold-section-title">DRIVERS</div>
        {drivers.length === 0 ? (
          <div className="cold-muted">No dominant drivers identified.</div>
        ) : (
          <ul className="cold-list">
            {drivers.slice(0, 5).map((d, i) => (
              <li key={i}>
                <span className="cold-strong">{d.label}</span>
                {d.detail ? <span className="cold-dim"> — {d.detail}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cold-section">
        <div className="cold-section-title">NEXT ACTIONS</div>
        {actions.length === 0 ? (
          <div className="cold-muted">No action recommendations generated.</div>
        ) : (
          <ul className="cold-list">
            {actions.slice(0, 3).map((a, i) => (
              <li key={i}>
                <span className="cold-strong">{a.label}</span>
                {a.detail ? <span className="cold-dim"> — {a.detail}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="cold-trace">
        <button className="trace-btn" onClick={() => setShowTrace((v) => !v)}>
          {showTrace ? "Hide Traceability" : "Show Traceability"}
        </button>

        {showTrace ? (
          <div className="trace-box">
            {trace?.notes?.length ? (
              <>
                <div className="trace-title">NOTES</div>
                <ul className="trace-list">
                  {trace.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {trace?.leverDeltas?.length ? (
              <>
                <div className="trace-title">LEVER CHANGES</div>
                <ul className="trace-list">
                  {trace.leverDeltas.map((l, i) => (
                    <li key={i}>
                      {l.label}: <span className="cold-dim">{l.from}</span> → <span className="cold-strong">{l.to}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {trace?.kpiDeltas?.length ? (
              <>
                <div className="trace-title">KPI DELTAS</div>
                <ul className="trace-list">
                  {trace.kpiDeltas.map((k, i) => (
                    <li key={i}>
                      {k.label}: <span className="cold-dim">{k.from}</span> → <span className="cold-strong">{k.to}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {!trace ? <div className="cold-muted">No trace data available.</div> : null}
          </div>
        ) : null}
      </div>

      <style>{`
        .cold-panel{
          width:100%;
          display:flex;
          flex-direction:column;
          min-height: 0;
          gap:14px;
          padding:14px;
          border-radius:18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 18px 44px rgba(0,0,0,0.45);
        }
        .cold-header{display:flex;flex-direction:column;gap:4px;}
        .cold-title{
          font-size:10px;
          font-weight:900;
          letter-spacing:0.18em;
          color:rgba(220,240,255,0.62);
        }
        .cold-subtitle{
          font-size:13px;
          font-weight:800;
          color:rgba(235,248,255,0.92);
        }
        .cold-section{display:flex;flex-direction:column;gap:8px;}
        .cold-section-title{
          font-size:10px;
          font-weight:900;
          letter-spacing:0.14em;
          color:rgba(220,240,255,0.55);
        }
        .cold-bullets{
          margin:0;
          padding-left:16px;
          color:rgba(235,248,255,0.88);
          font-size:12.5px;
          line-height:1.35;
        }
        .cold-list{
          margin:0;
          padding-left:16px;
          color:rgba(235,248,255,0.86);
          font-size:12.5px;
          line-height:1.35;
        }
        .cold-muted{
          font-size:12px;
          color:rgba(235,248,255,0.55);
        }
        .cold-strong{font-weight:850;color:rgba(235,248,255,0.92);}
        .cold-dim{color:rgba(235,248,255,0.62);}

        .cold-trace{margin-top:auto;display:flex;flex-direction:column;gap:10px;}
        .trace-btn{
          width:fit-content;
          cursor:pointer;
          border-radius:999px;
          padding:8px 10px;
          font-size:11px;
          font-weight:900;
          letter-spacing:0.10em;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(235,248,255,0.82);
        }
        .trace-btn:hover{
          background: rgba(255,255,255,0.08);
        }
        .trace-box{
          padding:10px 10px;
          border-radius:14px;
          border:1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.20);
        }
        .trace-title{
          font-size:10px;
          font-weight:950;
          letter-spacing:0.14em;
          color:rgba(220,240,255,0.55);
          margin-top:6px;
          margin-bottom:6px;
        }
        .trace-list{
          margin:0;
          padding-left:16px;
          font-size:12px;
          color:rgba(235,248,255,0.78);
          line-height:1.35;
        }
      `}</style>
    </div>
  );
}
