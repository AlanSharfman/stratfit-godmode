import React, { memo } from "react";
import s from "./ModeTabs.module.css";

const MODE_RAIL_V2 = true; // ← set false to instantly rollback

export type ModeKey = "terrain" | "variances" | "actuals";

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

      <button type="button" role="tab" aria-selected={mode === "variances"}
        className={cx(s.tab, mode === "variances" && s.active)}
        onClick={() => onChange("variances")}
      >
        Variances
      </button>

      <button type="button" role="tab" aria-selected={mode === "actuals"}
        className={cx(s.tab, mode === "actuals" && s.active)}
        onClick={() => onChange("actuals")}
      >
        Actuals
      </button>
    </div>
  );
});

