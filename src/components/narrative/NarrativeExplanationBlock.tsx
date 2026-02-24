import React, { useMemo } from "react";
import { generateNarrative, type SimulationSnapshot } from "@/logic/narrative/generateNarrative";

export default function NarrativeExplanationBlock(props: { snapshot: SimulationSnapshot | null }) {
  const narrative = useMemo(() => {
    if (!props.snapshot) return null;
    return generateNarrative(props.snapshot);
  }, [props.snapshot]);

  if (!props.snapshot) {
    return (
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9 }}>Executive Narrative</div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Run a simulation to generate a grounded narrative summary.
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Executive narrative"
      style={{
        marginTop: 14,
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Executive Narrative</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          {props.snapshot.iterations.toLocaleString()} paths · {(props.snapshot.executionTimeMs / 1000).toFixed(1)}s
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.92 }}>
        {narrative?.headline}
      </div>

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {narrative?.bullets.map((b) => (
          <div key={b} style={{ fontSize: 12, opacity: 0.78 }}>
            • {b}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
        <span style={{ opacity: 0.9 }}>Focus:</span> {narrative?.footer}
      </div>
    </div>
  );
}
