/**
 * PositionRightRail — Docked right-side container for Position page.
 * Stacks: Briefing → Diagnostics → Command Centre (collapsible).
 */
import React from "react";
import styles from "@/styles/PositionRail.module.css";

interface Props {
  children: React.ReactNode;
}

export default function PositionRightRail({ children }: Props) {
  return (
    <aside className={styles.rail} aria-label="Position intelligence rail">
      {children}
    </aside>
  );
}
