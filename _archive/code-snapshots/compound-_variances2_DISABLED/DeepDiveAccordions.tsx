// src/components/compound/variances2/DeepDiveAccordions.tsx
import React, { useMemo, useState } from "react";
import styles from "./VariancesHub.module.css";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";
import { SCENARIO_KEYS, ScenarioKey, titleForScenario } from "./shared";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

export default function DeepDiveAccordions() {
  const { activeScenarioId } = useScenarioStore(useShallow((s) => ({
    activeScenarioId: s.activeScenarioId,
  })));

  // We'll render one accordion per scenario, but reuse your existing Base→Scenario table module.
  // Phase 2.2 will add optional spider toggle per accordion (without breaking layout).
  const scenarios = useMemo(() => SCENARIO_KEYS.filter((k) => k !== "base"), []);

  const [open, setOpen] = useState<Record<string, boolean>>({
    upside: true,
    downside: false,
    stress: false,
  });

  const toggle = (key: ScenarioKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.body}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Deep Dive</div>
        <div className={styles.muted}>
          Expand a scenario to view Base → Scenario comparisons. (Spider becomes optional/collapsible in Phase 2.2.)
        </div>
      </div>

      {scenarios.map((key) => (
        <div key={key} className={styles.section}>
          <div
            className={styles.sectionTitle}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={() => toggle(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? toggle(key) : null)}
          >
            <span>{titleForScenario(key)}</span>
            <span className={styles.muted}>{open[key] ? "Hide" : "Show"}</span>
          </div>

          {open[key] ? (
            <div style={{ marginTop: 10 }}>
              {/* Reuse your existing CFO-grade Base→Scenario table.
                  NOTE: It currently references active scenario in store; Phase 2.2 will parameterize it per key.
               */}
              <ScenarioDeltaSnapshot />
              <div className={styles.muted} style={{ marginTop: 10 }}>
                Current limitation: this table is bound to the active scenario ({activeScenarioId}). Phase 2.2 will wire per-accordion scenario key without changing engine math.
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
