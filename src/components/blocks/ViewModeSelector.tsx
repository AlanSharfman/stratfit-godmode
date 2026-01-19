// src/components/blocks/ViewModeSelector.tsx
import React from "react";
import { Layers, Activity, SplitSquareHorizontal } from "lucide-react";
import styles from "./ViewModeSelector.module.css";

export type ViewMode = "terrain" | "impact" | "compare";

interface ViewModeSelectorProps {
  activeMode: ViewMode;
  onChange: (m: ViewMode) => void;
  className?: string;
  /** Optional right-side slot (for Timeline/Heatmap toggles) */
  rightSlot?: React.ReactNode;
}

const MODES: Array<{ id: ViewMode; label: string; icon: typeof Layers }> = [
  { id: "terrain", label: "Terrain", icon: Layers },
  { id: "compare", label: "Compare", icon: SplitSquareHorizontal },
  { id: "impact", label: "Trade offs", icon: Activity },
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
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                onClick={() => {
                  console.log('🖱️ ViewModeSelector clicked:', m.id);
                  onChange(m.id);
                }}
              >
                <Icon size={16} className={styles.tabIcon} />
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
