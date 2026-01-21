import React from "react";
import styles from "./CommandDeckBezel.module.css";

/**
 * GOD-MODE Command Deck Bezel
 * EXACT CLONE of Scenario Intelligence Panel
 * Uses pseudo-elements for layers 2-3, matching the AI panel approach
 */
export function CommandDeckBezel({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      {/* Layer 1: Chassis (with ::before for rim, ::after for step) */}
      <div className={styles.bezel}>
        {/* Layer 4: Well - charcoal content area */}
        <div className={styles.inner}>
          <div className={styles.scroll}>{children}</div>
        </div>
      </div>
    </div>
  );
}
