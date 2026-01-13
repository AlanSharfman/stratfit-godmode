import React from "react";
import styles from "./CommandDeckBezel.module.css";

export function CommandDeckBezel({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bezel}>
        <div className={styles.inner}>
          <div className={styles.scroll}>{children}</div>
        </div>
      </div>
    </div>
  );
}

