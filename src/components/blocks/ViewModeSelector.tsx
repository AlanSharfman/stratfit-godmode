// src/components/blocks/ViewModeSelector.tsx
import React from "react";
import styles from "./ViewModeSelector.module.css";

export type ViewMode = "terrain" | "impact" | "compare";

interface ViewModeSelectorProps {
  activeMode: ViewMode;
  onChange: (m: ViewMode) => void;
  className?: string;
  /** Optional right-side slot (for Timeline/Heatmap toggles) */
  rightSlot?: React.ReactNode;
}

const MODES: Array<{ id: ViewMode; label: string }> = [
  { id: "terrain", label: "Terrain" },
  { id: "impact", label: "Impact" },
  { id: "compare", label: "Compare" },
];

export default function ViewModeSelector({
  activeMode,
  onChange,
  className,
  rightSlot,
}: ViewModeSelectorProps) {
  return (
    <div className={`${styles.rail} ${className ?? ""}`} role="group" aria-label="View modes">
      <div className={styles.left}>
        <div className={styles.segment} role="tablist" aria-label="Center view">
          {MODES.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                onClick={() => onChange(m.id)}
              >
                <span className={styles.tabLabel}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.right}>
        {rightSlot ?? null}
      </div>
    </div>
  );
}
