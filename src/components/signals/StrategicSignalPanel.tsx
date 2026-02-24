import React, { memo, useMemo } from "react";
import { useStrategicSignals } from "@/signals/useStrategicSignals";
import type { StrategicSignal } from "@/signals/strategicSignalTypes";

function dirGlyph(direction: StrategicSignal["direction"]) {
  if (direction === "improving") return "↑";
  if (direction === "deteriorating") return "↓";
  return "→";
}

function sevBadge(sev: StrategicSignal["severity"]) {
  switch (sev) {
    case "critical": return "CRIT";
    case "high": return "HIGH";
    case "medium": return "MED";
    default: return "LOW";
  }
}

function formatIntensity(x: number) {
  const pct = Math.max(0, Math.min(1, x)) * 100;
  return `${pct.toFixed(0)}%`;
}

const Row = memo(function Row({ s }: { s: StrategicSignal }) {
  return (
    <div className="sf-signal-row">
      <div className="sf-signal-head">
        <div className="sf-signal-title">
          <span className="sf-signal-dir">{dirGlyph(s.direction)}</span>
          <span>{s.title}</span>
        </div>
        <div className="sf-signal-meta">
          <span className="sf-signal-sev">{sevBadge(s.severity)}</span>
          <span className="sf-signal-int">{formatIntensity(s.intensity01)}</span>
        </div>
      </div>

      <div className="sf-signal-summary">{s.summary}</div>

      <ul className="sf-signal-evidence">
        {s.evidence.map((e, idx) => (
          <li key={idx}>{e}</li>
        ))}
      </ul>
    </div>
  );
});

export default function StrategicSignalPanel() {
  const signals = useStrategicSignals();

  const ordered = useMemo(() => {
    // stable deterministic ordering by severity then id (no randomness)
    const rank = (sev: StrategicSignal["severity"]) =>
      sev === "critical" ? 4 : sev === "high" ? 3 : sev === "medium" ? 2 : 1;

    return [...signals].sort((a, b) => {
      const r = rank(b.severity) - rank(a.severity);
      if (r !== 0) return r;
      return a.id.localeCompare(b.id);
    });
  }, [signals]);

  if (ordered.length === 0) return null;

  return (
    <div className="sf-signal-panel">
      <div className="sf-signal-panel-title">Strategic Signals</div>
      <div className="sf-signal-panel-body">
        {ordered.map((s) => (
          <Row key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
