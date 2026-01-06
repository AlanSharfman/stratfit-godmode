// src/components/kpi/KPIBezel.tsx
// STRATFIT — KPI CHASSIS (NON-NEGOTIABLE)
// Stack: outer shell -> neon rails (::before/::after) -> inner frame -> header band -> divider -> fixed grid rack
// Geometry is enforced via clip-path + fixed height to prevent overlap/escape at 80–125% scaling.

import React from "react";
import styles from "./KPIBezel.module.css";

// DEBUG: set to `false` to remove all bezel/cell outlines instantly.
const DEBUG_BEZEL = false;

type Props = {
  title: string;
  columns: 2 | 3;
  children: React.ReactNode;
  className?: string;
};

export default function KPIBezel({ title, columns, children, className }: Props) {
  return (
    <div className={[styles.wrap, DEBUG_BEZEL ? styles.debug : ""].join(" ")}>
      <section
        className={[styles.bezel, className ?? ""].join(" ")}
        style={{ ["--cols" as string]: String(columns) } as React.CSSProperties}
      >
        <div className={styles.inner}>
          <div className={styles.header}>
            <div />
            <div className={styles.title}>{title}</div>
            <div className={styles.dots} aria-hidden="true">
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.grid}>{children}</div>
        </div>
      </section>
    </div>
  );
}


