import React, { memo, useMemo } from "react";
import styles from "./ModeRailGod.module.css";
import { Layers, Activity, BarChart3 } from "lucide-react";

export type ModeKey = "terrain" | "variances" | "actuals";

type Props = {
  value: ModeKey;
  onChange: (next: ModeKey) => void;
  className?: string;
  disabled?: boolean;
};

const MODES: Array<{ key: ModeKey; label: string; Icon: React.FC<any> }> = [
  { key: "terrain", label: "Terrain", Icon: Layers },
  { key: "variances", label: "Variances", Icon: Activity },
  { key: "actuals", label: "Actuals", Icon: BarChart3 },
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
