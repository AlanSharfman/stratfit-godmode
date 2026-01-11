// src/components/kpi/ScenarioBezel.tsx
// STRATFIT — Scenario Bezel (God-Mode 4-layer chassis)

import React from "react";
import styles from "./KPIBezel.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ScenarioBezel({ children, className }: Props) {
  return (
    <div className={[styles.wrapSquare, className ?? ""].join(" ")}>
      <div className={styles.chassis}>
        <div className={styles.rim}>
          <div className={styles.step}>
            <div className={styles.wellSquare}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

