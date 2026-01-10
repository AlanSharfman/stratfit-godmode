// src/components/kpi/ScenarioBezel.tsx
// STRATFIT — Scenario Bezel (uses same CSS module as KPIBezel, square shape)

import React from "react";
import styles from "./KPIBezel.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ScenarioBezel({ children, className }: Props) {
  return (
    <div className={[styles.wrap, styles.wrapSquare, className ?? ""].join(" ")}>
      <section className={styles.bezel}>
        <div className={[styles.inner, styles.innerSquare].join(" ")}>
          {children}
        </div>
      </section>
    </div>
  );
}

