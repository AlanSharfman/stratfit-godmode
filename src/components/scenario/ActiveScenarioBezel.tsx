import React, { memo } from "react";
import styles from "./ActiveScenarioBezel.module.css";


import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

type Props = {
  label: string;
  subLabel?: string;
  scenarioId: ScenarioId;
  onOpen: () => void;
};

export default memo(function ActiveScenarioBezel({ label, subLabel, scenarioId, onOpen }: Props) {
  const color = SCENARIO_COLORS[scenarioId]?.primary || "#22d3ee";
  return (
    <button type="button" className={styles.shell} onClick={onOpen} aria-label="Active scenario">
      <div className={styles.step}>
        <div className={styles.inner}>
          <div className={styles.kicker}>ACTIVE SCENARIO</div>

          <div className={styles.row}>
            <div className={styles.value} style={{ color, textShadow: `0 0 14px ${color}40` }}>{label}</div>
            <span className={styles.chev} aria-hidden="true">▼</span>
          </div>

          <div className={styles.sub}>{subLabel ?? ""}</div>
        </div>
      </div>
    </button>
  );
});
