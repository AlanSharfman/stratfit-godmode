import React, { useState } from "react";
import styles from "./CompassPage.module.css";

import { useEngineActivityStore } from "@/state/engineActivityStore";

export default function CompassPage() {
  const [prompt, setPrompt] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const engine = useEngineActivityStore();

  function runSimulation() {
    if (!prompt.trim()) return;

    // Trigger engine activity (demo-safe)
    engine.start({ iterationsTarget: 500 });

    setTimeout(() => {
      engine.update({ stage: "SAMPLING", message: "Running scenario…" });
    }, 600);

    setTimeout(() => {
      engine.complete();
      setHasRun(true);
    }, 2600);
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

        <button className={styles.runButton} onClick={runSimulation}>
          Run Simulation
        </button>
      </div>

      {/* RESULTS */}
      {hasRun && (
        <div className={styles.results}>
          <div className={styles.narrative}>
            <div className={styles.cardTitle}>Strategic Insight</div>
            <p>
              Based on the simulated trajectory, liquidity pressure increases
              within the next 9–12 months. Capital planning or cost discipline
              will materially improve survival probability.
            </p>
            <div className={styles.badge}>WATCH</div>
          </div>

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
