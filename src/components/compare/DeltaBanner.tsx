// src/components/compare/DeltaBanner.tsx
// STRATFIT — Strategic Delta Banner
// Horizontal strip: STRATEGIC DELTA: POSITIVE/NEGATIVE/NEUTRAL
// Deltas in cyan/emerald/red. No paragraph text.

import React from "react";
import styles from "./ComparePage.module.css";

interface DeltaItem {
  label: string;
  value: string;
  direction: "positive" | "negative" | "neutral";
}

interface DeltaBannerProps {
  direction: "positive" | "negative" | "neutral";
  deltas: DeltaItem[];
}

const DeltaBanner: React.FC<DeltaBannerProps> = ({ direction, deltas }) => {
  const dirClass =
    direction === "positive"
      ? styles.deltaPositive
      : direction === "negative"
        ? styles.deltaNegative
        : styles.deltaNeutral;

  return (
    <div className={styles.deltaBanner}>
      <span className={styles.deltaTitle}>Strategic Delta</span>
      <span className={`${styles.deltaDirection} ${dirClass}`}>
        {direction.toUpperCase()}
      </span>
      <div className={styles.deltaMetrics}>
        {deltas.map((d, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className={styles.deltaSep}>·</span>}
            <span className={styles.deltaMetric}>
              {d.label}{" "}
              <span
                className={`${styles.deltaValue} ${
                  d.direction === "positive"
                    ? styles.deltaValuePositive
                    : d.direction === "negative"
                      ? styles.deltaValueNegative
                      : styles.deltaValueCyan
                }`}
              >
                {d.value}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DeltaBanner;





