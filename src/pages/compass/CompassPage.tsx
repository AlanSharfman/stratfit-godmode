import React, { useMemo, useState } from "react";
import styles from "./CompassPage.module.css";
import { useSimulationStore } from "@/state/simulationStore";
import SimulationBriefPanel from "@/components/simulation/SimulationBriefPanel";
import NarrativeExplanationBlock from "@/components/simulation/NarrativeExplanationBlock";
import EngineProgressTicker from "@/components/simulation/EngineProgressTicker";
import ScenarioDiffInspectorPanel from "@/components/scenario/ScenarioDiffInspectorPanel";
import LavaLegendBadge from "@/components/terrain/LavaLegendBadge";
import DivergencePanelAdapter from "@/components/compare/DivergencePanelAdapter";
import { useLavaIntensity } from "@/logic/lava/useLavaIntensity";

// NEW — Strategic Signal Layer
import StrategicSignalPanel from "@/components/signals/StrategicSignalPanel";
import StrategicSignalTickerRow from "@/components/signals/StrategicSignalTickerRow";

export default function CompassPage() {
  const [prompt, setPrompt] = useState("");

  // Primitive selectors only (no object selectors).
  const runSimulation = useSimulationStore((s) => s.runSimulation);
  const cancelSimulation = useSimulationStore((s) => s.cancelSimulation);
  const status = useSimulationStore((s) => s.simulationStatus);

  // Derived UI flags (memoized; no store writes).
  const isBusy = useMemo(() => status === "queued" || status === "running", [status]);
  const isDone = useMemo(() => status === "completed", [status]);
  const isFailed = useMemo(() => status === "failed", [status]);
  const isCancelled = useMemo(() => status === "cancelled", [status]);
  const lava = useLavaIntensity();

  // User action → dispatch only. No useEffect.
  function handleRun() {
    if (!prompt.trim()) return;
    runSimulation({ horizonMonths: 24, iterations: 20000, inputs: { prompt } });
  }

  function handleCancel() {
    cancelSimulation();
  }

  function applyExample(text: string) {
    setPrompt(text);
  }

  return (
    <div className={styles.page}>
      {/* HERO */}
      <div className={styles.heroPanel}>
        <h1 className={styles.title}>Where should we explore?</h1>
        <p className={styles.subtitle}>Ask a strategic question or describe a scenario.</p>

        <textarea
          className={styles.input}
          placeholder="e.g. What happens if growth slows to 15% and we raise capital in 9 months?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className={styles.chips}>
          {[
            "When do we run out of cash?",
            "Should we raise capital?",
            "Show downside scenario",
            "What if growth slows?",
          ].map((c) => (
            <button key={c} onClick={() => applyExample(c)} className={styles.chip}>
              {c}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.runButton} onClick={handleRun} disabled={isBusy || !prompt.trim()}>
            {isBusy ? "Running…" : "Run Simulation"}
          </button>

          {(status === "queued" || status === "running") && (
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>

        {isFailed && <div className={styles.statusError}>Simulation failed. Try again.</div>}
        {isCancelled && <div className={styles.statusInfo}>Cancelled.</div>}
      </div>

      {/* ENGINE TELEMETRY */}
      <EngineProgressTicker />
      <StrategicSignalTickerRow />

      {/* CORE OUTPUTS */}
      <SimulationBriefPanel />
      <NarrativeExplanationBlock />

      {/* COMPARISON & SIGNAL INTELLIGENCE */}
      <ScenarioDiffInspectorPanel />
      <StrategicSignalPanel />
      <DivergencePanelAdapter />
      <LavaLegendBadge intensity01={lava?.overall ?? 0} />

      {isDone && (
        <div className={styles.results}>
          <div className={styles.terrainPreview}>
            <div className={styles.previewLabel}>Terrain Reaction</div>
            <div className={styles.previewBox}>Terrain preview placeholder</div>
          </div>
        </div>
      )}
    </div>
  );
}

