import React, { memo } from "react";
import s from "./ActiveScenarioHeader.module.css";

type Props = {
  scenarioName: string;
  pillText?: string; // e.g. "BASE" or "LIVE"
  rightSlot: React.ReactNode; // your existing dropdown / caret control
};

export const ActiveScenarioHeader = memo(function ActiveScenarioHeader({
  scenarioName,
  pillText = "BASE",
  rightSlot,
}: Props) {
  return (
    <div className={s.wrap}>
      <div className={s.bezel}>
        <div className={s.inner}>
          <div className={s.pill}>{pillText}</div>

          <div className={s.meta}>
            <div className={s.label}>Active Scenario</div>
            <div className={s.valueRow}>
              <div className={s.value}>{scenarioName}</div>
              {rightSlot}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

