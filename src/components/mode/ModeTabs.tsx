import React, { memo } from "react";
import s from "./ModeTabs.module.css";

const MODE_RAIL_V2 = true; // ← set false to instantly rollback

import type { CenterViewId } from "@/types/view";

type Props = {
  mode: CenterViewId;
  onChange: (m: CenterViewId) => void;
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

      <button type="button" role="tab" aria-selected={mode === "impact"}
        className={cx(s.tab, mode === "impact" && s.active)}
        onClick={() => onChange("impact")}
      >
        Impact
      </button>

      <div className={s.divider} aria-hidden="true" />

      <button type="button" role="tab" aria-selected={mode === "compare"}
        className={cx(s.tab, mode === "compare" && s.active)}
        onClick={() => onChange("compare")}
      >
        Compare
      </button>
    </div>
  );
});

