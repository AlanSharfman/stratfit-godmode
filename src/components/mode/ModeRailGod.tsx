import React, { memo, useMemo } from "react";
import styles from "./ModeRailGod.module.css";
import { Layers, Activity, BarChart3 } from "lucide-react";

import type { CenterViewId } from "@/types/view";

type Props = {
  value: CenterViewId;
  onChange: (next: CenterViewId) => void;
  className?: string;
  disabled?: boolean;
};

const MODES: Array<{ key: CenterViewId; label: string; Icon: React.FC<any> }> = [
  { key: "terrain", label: "Terrain", Icon: Layers },
  { key: "impact", label: "Impact", Icon: BarChart3 },
  { key: "compare", label: "Compare", Icon: Activity },
];

export default memo(function ModeRailGod({ value, onChange, className, disabled }: Props) {
  const aria = useMemo(() => `Mode: ${value}`, [value]);

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")} aria-label={aria}>
      <div className={styles.rail} role="tablist" aria-label="Mode">
        {MODES.map(({ key, label, Icon }) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              className={[styles.seg, active ? styles.active : styles.inactive].join(" ")}
              onClick={() => onChange(key)}
              role="tab"
              aria-selected={active}
              disabled={disabled}
            >
              <Icon size={16} className={styles.icon} />
              <span className={styles.label}>{label}</span>
              {active ? <span className={styles.signal} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {/* global "signal line" under rail for peripheral discoverability */}
      <div className={styles.railUnderline} aria-hidden="true" />
    </div>
  );
});
