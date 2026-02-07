import React, { useEffect, useMemo } from "react";
import { hasBaseline, loadBaseline } from "@/onboard/baseline";
import { useStrategicStudioStore } from "@/state/strategicStudioStore";
import ScenarioListPanel from "./ScenarioListPanel";
import ScenarioControlsPanel from "./ScenarioControlsPanel";
import ScenarioIntelligencePanel from "./ScenarioIntelligencePanel";
import styles from "./StrategicStudioPage.module.css";

export function StrategicStudioPage() {
  const hydrate = useStrategicStudioStore((s) => s.hydrateFromBaselineIfNeeded);
  const baseline = useStrategicStudioStore((s) => s.baseline);
  const activeScenarioId = useStrategicStudioStore((s) => s.activeScenarioId);
  const scenarios = useStrategicStudioStore((s) => s.scenarios);

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

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-950/55 to-black/75 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_0%,rgba(34,211,238,0.10),transparent_60%)]" />
      <div className="relative h-full w-full p-4">
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


