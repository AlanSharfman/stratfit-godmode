import React, { memo } from "react";
import styles from "./ActiveScenarioBezel.module.css";

type Props = {
  label: string;
  subLabel?: string;
  onOpen: () => void;
};

export default memo(function ActiveScenarioBezel({ label, subLabel, onOpen }: Props) {
  return (
    <button type="button" className={styles.shell} onClick={onOpen} aria-label="Active scenario">
      <div className={styles.step}>
        <div className={styles.inner}>
          <div className={styles.kicker}>ACTIVE SCENARIO</div>

          <div className={styles.row}>
            <div className={styles.value}>{label}</div>
            <span className={styles.chev} aria-hidden="true">▼</span>
          </div>

          <div className={styles.sub}>{subLabel ?? ""}</div>
        </div>
      </div>
    </button>
  );
});
