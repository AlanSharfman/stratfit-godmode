import React, { useMemo, useState } from "react";
import { useEngineStore } from "@/state/engineStore";
import "./baselineRightPanel.css";

type DotTone = "neutral" | "cyan" | "emerald" | "violet" | "red";

type SnapshotMetric = {
  label: string;
  value: string;
  tone: DotTone;
};

type SystemState = {
  simulationStatus: "Idle" | "Running" | "Complete" | "Error";
  lastRunLabel: string; // e.g. "14m ago"
  modeLabel: string; // e.g. "Deterministic"
  confidenceLabel: string; // e.g. "92%"
};

type Props = {
  // If you have real values, pass them in.
  // Otherwise use defaults and wire later.
  snapshot?: SnapshotMetric[];
  advisoryBullets?: string[];
  systemState?: SystemState;

  // Optional callback if you want toggle analytics later
  onToggleAdvisory?: (open: boolean) => void;
};

function dotToneClass(tone: DotTone) {
  switch (tone) {
    case "cyan":
      return "sf-dot sf-dot--cyan";
    case "emerald":
      return "sf-dot sf-dot--emerald";
    case "violet":
      return "sf-dot sf-dot--violet";
    case "red":
      return "sf-dot sf-dot--red";
    default:
      return "sf-dot sf-dot--neutral";
  }
}

function simTone(status: SystemState["simulationStatus"]): DotTone {
  if (status === "Running") return "cyan";
  if (status === "Complete") return "emerald";
  if (status === "Error") return "red";
  return "neutral";
}

export default function BaselineRightPanel({
  snapshot,
  advisoryBullets,
  systemState,
  onToggleAdvisory,
}: Props) {
  const [advisoryOpen, setAdvisoryOpen] = useState(false);

  // Read shared engine state from Zustand store
  const storeStatus = useEngineStore((s) => s.status);
  const storeMode = useEngineStore((s) => s.mode);
  const storeLastRun = useEngineStore((s) => s.lastRunLabel);
  const storeConfidence = useEngineStore((s) => s.confidencePct);

  const snapshotDefault: SnapshotMetric[] = useMemo(
    () => [
      { label: "Runway Status", value: "18.4 months", tone: "emerald" },
      { label: "Growth Velocity", value: "+4.2% MoM", tone: "cyan" },
      { label: "Burn Efficiency", value: "1.3x", tone: "cyan" },
      { label: "Market Exposure", value: "0.62 Beta", tone: "violet" },
    ],
    []
  );

  const bulletsDefault = useMemo(
    () => [
      "Runway buffer exceeds sector median",
      "Revenue acceleration lags cost expansion",
      "Burn sensitivity high under delayed raise",
      "Margin resilience improving",
      "Risk concentration moderate",
    ],
    []
  );

  // System state: prefer props → fall back to shared Zustand store
  const systemFromStore: SystemState = useMemo(
    () => ({
      simulationStatus: storeStatus as SystemState["simulationStatus"],
      lastRunLabel: storeLastRun,
      modeLabel: storeMode,
      confidenceLabel: storeConfidence != null ? `${storeConfidence}%` : "—",
    }),
    [storeStatus, storeMode, storeLastRun, storeConfidence]
  );

  const s = snapshot?.length ? snapshot : snapshotDefault;
  const bullets = advisoryBullets?.length ? advisoryBullets.slice(0, 5) : bulletsDefault;
  const sys = systemState ?? systemFromStore;

  const toggle = () => {
    const next = !advisoryOpen;
    setAdvisoryOpen(next);
    onToggleAdvisory?.(next);
  };

  return (
    <aside className="sf-baseline-panel" aria-label="Baseline Right Panel">
      {/* EXECUTIVE SNAPSHOT */}
      <section className="sf-panel-section">
        <div className="sf-section-title">EXECUTIVE SNAPSHOT</div>

        <div className="sf-snapshot-grid">
          {s.slice(0, 4).map((m) => (
            <div key={m.label} className="sf-metric">
              <div className="sf-metric-value">{m.value}</div>
              <div className="sf-metric-row">
                <div className="sf-metric-label">{m.label}</div>
                <span className={dotToneClass(m.tone)} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI ADVISORY */}
      <section className="sf-panel-section">
        <button type="button" className="sf-collapsible-header" onClick={toggle} aria-expanded={advisoryOpen}>
          <span className="sf-section-title sf-section-title--button">AI ADVISORY</span>
          <span className={`sf-chevron ${advisoryOpen ? "sf-chevron--open" : ""}`} aria-hidden="true">
            ▸
          </span>
        </button>

        {advisoryOpen && (
          <div className="sf-advisory-body" role="region" aria-label="AI Advisory">
            <ul className="sf-bullets">
              {bullets.map((b, i) => (
                <li key={`${i}-${b}`} className="sf-bullet">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* SYSTEM STATE */}
      <section className="sf-panel-section sf-panel-section--system">
        <div className="sf-section-title">SYSTEM STATE</div>

        <div className="sf-system-rows">
          <div className="sf-system-row">
            <div className="sf-system-label">Simulation</div>
            <div className="sf-system-value">
              <span className={dotToneClass(simTone(sys.simulationStatus))} aria-hidden="true" />
              <span className="sf-system-text">
                {sys.simulationStatus}
                {sys.simulationStatus !== "Idle" ? ` / Last run: ${sys.lastRunLabel}` : ` / Last run: ${sys.lastRunLabel}`}
              </span>
            </div>
          </div>

          <div className="sf-system-row">
            <div className="sf-system-label">Mode</div>
            <div className="sf-system-value">
              <span className="sf-system-text">{sys.modeLabel}</span>
            </div>
          </div>

          <div className="sf-system-row">
            <div className="sf-system-label">Confidence</div>
            <div className="sf-system-value">
              <span className="sf-system-text">{sys.confidenceLabel}</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}

