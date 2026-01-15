import React, { memo } from "react";
import s from "./ModeTabs.module.css";

const MODE_RAIL_V2 = true; // ← set false to instantly rollback

export type ModeKey = "terrain" | "scenario" | "variances";

type Props = {
  mode: ModeKey;
  onChange: (m: ModeKey) => void;
  className?: string;
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export const ModeTabs = memo(function ModeTabs({ mode, onChange, className }: Props) {
  return (
    <div
      className={cx(s.wrap, MODE_RAIL_V2 && s.rail, className)}
      role="tablist"
      aria-label="Analysis mode"
    >
      <button type="button" role="tab" aria-selected={mode === "terrain"}
        className={cx(s.tab, mode === "terrain" && s.active)}
        onClick={() => onChange("terrain")}
      >
        Terrain
      </button>

      <div className={s.divider} aria-hidden="true" />

      <button type="button" role="tab" aria-selected={mode === "scenario"}
        className={cx(s.tab, mode === "scenario" && s.active)}
        onClick={() => onChange("scenario")}
      >
        Impact
      </button>

      <div className={s.divider} aria-hidden="true" />

      <button type="button" role="tab" aria-selected={mode === "variances"}
        className={cx(s.tab, mode === "variances" && s.active)}
        onClick={() => onChange("variances")}
      >
        Compare
      </button>
    </div>
  );
});

