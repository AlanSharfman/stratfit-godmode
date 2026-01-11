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
      {/* Outer deep frame */}
      <div className={styles.frame}>
        {/* Inner surface */}
        <div className={styles.surface}>
          <div className={styles.kicker}>ACTIVE SCENARIO</div>

          <div className={styles.row}>
            <div className={styles.value}>{label}</div>

            {/* Arrow button (small dark square) */}
            <div className={styles.arrowBox} aria-hidden="true">
              <span className={styles.caret}>▼</span>
            </div>
          </div>

          {subLabel ? <div className={styles.sub}>{subLabel}</div> : null}
        </div>
      </div>
    </button>
  );
});
