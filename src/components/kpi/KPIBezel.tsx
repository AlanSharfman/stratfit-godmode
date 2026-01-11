// src/components/kpi/KPIBezel.tsx
import React from "react";
import styles from "./KPIBezel.module.css";

type Props = {
  title?: string;
  cols?: number; // number of KPI tiles in row
  children: React.ReactNode;
  className?: string;
  square?: boolean; // for Active Scenario / square use
};

export default function KPIBezel({
  title,
  cols = 3,
  children,
  className,
  square = false,
}: Props) {
  const wrapClass = square ? styles.wrapSquare : styles.wrap;
  const innerClass = square ? styles.innerSquare : styles.inner;

  return (
    <div className={[wrapClass, className].filter(Boolean).join(" ")}>
      <div className={styles.bezel}>
        <div className={innerClass}>
          {title ? (
            <>
              <div className={styles.header}>
                <div />
                <div className={styles.title}>{title}</div>
                <div className={styles.dots} />
              </div>
              <div className={styles.divider} />
            </>
          ) : null}

          {/* KPI grid layer */}
          <div
            className={styles.grid}
            style={{ ["--cols" as any]: String(cols) }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
