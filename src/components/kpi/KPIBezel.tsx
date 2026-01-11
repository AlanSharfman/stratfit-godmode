// src/components/kpi/KPIBezel.tsx
// STRATFIT — God-Mode 4-layer chassis bezel (chassis → rim → step → well)
import React from "react";
import styles from "./KPIBezel.module.css";

type Props = {
  title?: string;
  cols?: number;
  children: React.ReactNode;
  className?: string;
  square?: boolean;
};

export default function KPIBezel({
  title,
  cols = 3,
  children,
  className,
  square = false,
}: Props) {
  // Square variant for ScenarioBezel
  if (square) {
    return (
      <div className={[styles.wrapSquare, className].filter(Boolean).join(" ")}>
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

  // God-Mode 4-layer chassis structure
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <div className={styles.chassis}>
        <div className={styles.rim}>
          <div className={styles.step}>
            <div className={styles.well}>
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
                data-cols={cols}
                style={{ ["--cols" as any]: String(cols) }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
