import React, { useMemo } from "react";
import { useEngineActivityStore } from "@/state/engineActivityStore";
import { useStrategicSignals } from "@/signals/useStrategicSignals";
import type { StrategicSignal } from "@/signals/strategicSignalTypes";

function sevRank(sev: StrategicSignal["severity"]) {
  switch (sev) {
    case "critical": return 4;
    case "high": return 3;
    case "medium": return 2;
    default: return 1;
  }
}

function dirGlyph(dir: StrategicSignal["direction"]) {
  if (dir === "improving") return "↑";
  if (dir === "deteriorating") return "↓";
  return "→";
}

export default function StrategicSignalTickerRow() {
  // Primitive selectors only — percentComplete and iterationsComplete do not exist on store
  const stage = useEngineActivityStore((s) => s.stage);
  const iterationsCompleted = useEngineActivityStore((s) => s.iterationsCompleted);
  const iterationsTarget = useEngineActivityStore((s) => s.iterationsTarget);

  const percent = useMemo(
    () => (iterationsTarget > 0 ? (iterationsCompleted / iterationsTarget) * 100 : 0),
    [iterationsCompleted, iterationsTarget]
  );

  const signals = useStrategicSignals();

  const top = useMemo(() => {
    if (!signals || signals.length === 0) return null;

    return [...signals].sort((a, b) => {
      const r = sevRank(b.severity) - sevRank(a.severity);
      if (r !== 0) return r;
      if (b.intensity01 !== a.intensity01) return b.intensity01 - a.intensity01;
      return a.id.localeCompare(b.id);
    })[0];
  }, [signals]);

  return (
    <div className="sf-signal-ticker-row">
      <div className="sf-signal-ticker-left">
        <span className="sf-engine-stage">{stage}</span>
        <span className="sf-engine-progress">{percent.toFixed(1)}%</span>
        <span className="sf-engine-iters">{iterationsCompleted}</span>
      </div>

      <div className="sf-signal-ticker-right">
        {top ? (
          <>
            <span className="sf-top-signal-dir">{dirGlyph(top.direction)}</span>
            <span className="sf-top-signal-title">{top.title}</span>
            <span className="sf-top-signal-sev">{top.severity.toUpperCase()}</span>
            <span className="sf-top-signal-int">{Math.round(top.intensity01 * 100)}%</span>
          </>
        ) : (
          <span className="sf-top-signal-none">No signals</span>
        )}
      </div>
    </div>
  );
}
