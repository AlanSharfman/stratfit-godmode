import React, { useMemo, useState } from "react";
import styles from "./CompassPage.module.css";
import { useSimulationStore } from "@/state/simulationStore";
import SimulationBriefPanel from "@/components/simulation/SimulationBriefPanel";
import SimulationProgressTicker from "@/components/simulation/SimulationProgressTicker";
import ScenarioDiffInspectorPanel from "@/components/scenario/ScenarioDiffInspectorPanel";

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

          {/* God Mode credibility: cancellation is mandatory */}
          {(status === "queued" || status === "running") && (
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>

        {/* Lightweight status feedback */}
        {isFailed && <div className={styles.statusError}>Simulation failed. Try again.</div>}
        {isCancelled && <div className={styles.statusInfo}>Cancelled.</div>}
      </div>

      {/* RESULTS — read-only from store */}
      <SimulationProgressTicker />
      <SimulationBriefPanel />
      <ScenarioDiffInspectorPanel />

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

