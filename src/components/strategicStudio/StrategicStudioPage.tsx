import React, { useEffect, useMemo, useRef, useState } from "react";
import { hasBaseline, loadBaseline } from "@/onboard/baseline";
import { useStrategicStudioStore } from "@/state/strategicStudioStore";
import { loadScenarioResult } from "@/strategy/scenarioResults";
import { computeLeverConfigHash, useSimulationStore } from "@/state/simulationStore";
import DeltaRibbon from "./DeltaRibbon";
import ScenarioListPanel from "./ScenarioListPanel";
import ScenarioControlsPanel from "./ScenarioControlsPanel";
import ScenarioIntelligencePanel from "./ScenarioIntelligencePanel";
import styles from "./StrategicStudioPage.module.css";

export function StrategicStudioPage() {
  const hydrate = useStrategicStudioStore((s) => s.hydrateFromBaselineIfNeeded);
  const baseline = useStrategicStudioStore((s) => s.baseline);
  const activeScenarioId = useStrategicStudioStore((s) => s.activeScenarioId);
  const scenarios = useStrategicStudioStore((s) => s.scenarios);

  const [pulse, setPulse] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);
  const [resultsNonce, setResultsNonce] = useState(0);

  useEffect(() => {
    if (!hasBaseline()) {
      window.location.assign("/onboard");
      return;
    }
    hydrate();
  }, [hydrate]);

  const baselineTruth = useMemo(() => loadBaseline(), []);

  if (!hasBaseline()) {
    return (
      <div className="h-full w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-white/70">
        Baseline required — redirecting to onboarding…
      </div>
    );
  }

  if (!baseline) {
    return (
      <div className="h-full w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-white/70">
        Preparing Strategic Studio…
      </div>
    );
  }

  const activeScenario = scenarios[activeScenarioId];

  const {
    simulationStatus,
    lastRunAt,
    seed,
    runs,
    runSimulationForScenario,
    markStale,
  } = useSimulationStore((s) => ({
    simulationStatus: s.simulationStatus,
    lastRunAt: s.lastRunAt,
    seed: s.seed,
    runs: s.runs,
    runSimulationForScenario: s.runSimulationForScenario,
    markStale: s.markStale,
  }));

  // PASS 7C: ripple on lever changes (UI only; do NOT run simulation)
  useEffect(() => {
    if (!activeScenario) return;
    if (pulseTimerRef.current != null) window.clearTimeout(pulseTimerRef.current);
    setPulse(true);
    pulseTimerRef.current = window.setTimeout(() => setPulse(false), 240);
  }, [activeScenario?.updatedAtISO]);

  // PASS 7C+Execution Mode: mark sim stale when inputs change (do NOT auto-run)
  useEffect(() => {
    if (!activeScenario) return;
    try {
      const scenarioHash = computeLeverConfigHash(activeScenario.leverConfig);
      markStale({ scenarioId: String(activeScenarioId), scenarioHash });
    } catch {
      markStale({ scenarioId: String(activeScenarioId), scenarioHash: String(Date.now()) });
    }
  }, [activeScenario?.updatedAtISO, activeScenarioId, markStale]);

  // PASS 7C: refresh stored results instantly when Run Simulation writes (same-tab)
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const ce = e as CustomEvent<{ scenarioId?: string }>;
      const sid = ce?.detail?.scenarioId;
      if (!sid) return;
      if (String(sid) !== String(activeScenarioId) && String(sid) !== "base") return;
      setResultsNonce((n) => n + 1);

      // Small polish: pulse the ribbon on result refresh too.
      if (pulseTimerRef.current != null) window.clearTimeout(pulseTimerRef.current);
      setPulse(true);
      pulseTimerRef.current = window.setTimeout(() => setPulse(false), 240);
    };
    window.addEventListener("sf:scenarioResultsUpdated", onUpdated as EventListener);
    return () => window.removeEventListener("sf:scenarioResultsUpdated", onUpdated as EventListener);
  }, [activeScenarioId]);

  const stored = useMemo(() => {
    return loadScenarioResult(String(activeScenarioId));
  }, [activeScenarioId, resultsNonce]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-950/55 to-black/75 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_0%,rgba(34,211,238,0.10),transparent_60%)]" />
      {pulse ? (
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(34,211,238,0.35),transparent)] animate-[sf-scan_240ms_ease-out_1]" />
          <style>{`
            @keyframes sf-scan {
              from { transform: translateY(-30%); opacity: 0; }
              to { transform: translateY(30%); opacity: 1; }
            }
          `}</style>
        </div>
      ) : null}
      <div className="relative h-full w-full p-4">
        <div className={styles.topRow}>
          <div />
          <div className={styles.runBlock}>
            <button
              type="button"
              className={styles.runBtn}
              disabled={simulationStatus === "running"}
              onClick={() =>
                runSimulationForScenario({
                  scenarioId: String(activeScenarioId),
                  baseline: baseline.leverConfig,
                  scenario: activeScenario.leverConfig,
                })
              }
            >
              {simulationStatus === "running" ? "RUNNING..." : "RUN SIMULATION"}
            </button>
            <div className={styles.meta}>
              <div className={styles.metaLine}>
                Status: <span className={styles.metaStrong}>{simulationStatus.toUpperCase()}</span>
              </div>
              <div className={styles.metaLine}>
                Runs: <span className={styles.metaStrong}>{runs.toLocaleString()}</span> · Seeded:{" "}
                <span className={styles.metaStrong}>Yes</span> · Seed: <span className={styles.metaStrong}>{seed}</span>
              </div>
              <div className={styles.metaLine}>
                Last Run:{" "}
                <span className={styles.metaStrong}>
                  {lastRunAt ? new Date(lastRunAt).toLocaleString() : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <DeltaRibbon storedResult={stored} pulse={pulse} />
        </div>
        <div className={styles.root}>
          <div className={styles.col}>
            <div className={styles.scroll}>
              <ScenarioListPanel baselineTruth={baselineTruth} />
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.scroll}>
              <ScenarioControlsPanel baseline={baseline} scenario={activeScenario} />
            </div>
          </div>

          <div className={styles.col}>
            <div className={styles.scroll}>
              <ScenarioIntelligencePanel baseline={baseline} scenario={activeScenario} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrategicStudioPage;


