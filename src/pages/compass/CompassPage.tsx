import React, { useState } from "react";
import styles from "./CompassPage.module.css";
import { useSimulationStore } from "@/state/simulationStore";
import SimulationBriefPanel from "@/components/simulation/SimulationBriefPanel";

export default function CompassPage() {
  const [prompt, setPrompt] = useState("");

  // Read dispatch once; never read reactive state to trigger a run.
  const runSimulation = useSimulationStore((s) => s.runSimulation);
  const status = useSimulationStore((s) => s.simulationStatus);

  // User action → dispatch only. No useEffect.
  function handleRun() {
    if (!prompt.trim()) return;
    runSimulation({ horizonMonths: 24 });
  }

  function applyExample(text: string) {
    setPrompt(text);
  }

  return (
    <div className={styles.page}>
      {/* HERO */}
      <div className={styles.heroPanel}>
        <h1 className={styles.title}>Where should we explore?</h1>
        <p className={styles.subtitle}>
          Ask a strategic question or describe a scenario.
        </p>

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

        <button
          className={styles.runButton}
          onClick={handleRun}
          disabled={status === "running"}
        >
          {status === "running" ? "Running…" : "Run Simulation"}
        </button>
      </div>

      {/* RESULTS — read-only from store */}
      <SimulationBriefPanel />

      {status === "complete" && (
        <div className={styles.results}>
          <div className={styles.terrainPreview}>
            <div className={styles.previewLabel}>Terrain Reaction</div>
            <div className={styles.previewBox}>
              Terrain preview placeholder
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
