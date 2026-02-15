// src/components/compare/CompareModeToggle.tsx
// STRATFIT — Comparison Mode Toggle: 2-WAY | 3-WAY
// 3-WAY disabled if no Scenario B available.

import React from "react";
import styles from "./ComparePage.module.css";

export type CompareMode = "2way" | "3way";

interface CompareModeToggleProps {
  active: CompareMode;
  onChange: (mode: CompareMode) => void;
  threeWayDisabled?: boolean;
}

const CompareModeToggle: React.FC<CompareModeToggleProps> = ({
  active,
  onChange,
  threeWayDisabled = false,
}) => {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.controlLabel}>Mode</span>
      <button
        type="button"
        className={`${styles.controlBtn} ${active === "2way" ? styles.controlBtnActive : ""}`}
        onClick={() => onChange("2way")}
      >
        2-Way
      </button>
      <span className={styles.controlSep} />
      <button
        type="button"
        className={`${styles.controlBtn} ${active === "3way" ? styles.controlBtnActive : ""} ${threeWayDisabled ? styles.controlBtnDisabled : ""}`}
        onClick={() => !threeWayDisabled && onChange("3way")}
        disabled={threeWayDisabled}
      >
        3-Way
      </button>
    </div>
  );
};

export default CompareModeToggle;





