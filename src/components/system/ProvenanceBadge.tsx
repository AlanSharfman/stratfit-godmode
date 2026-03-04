// src/components/system/ProvenanceBadge.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Provenance Badge
//
// Compact institutional badge showing simulation provenance:
//   runId · engineVersion · seed · inputsHash
//
// Mount on any module page to provide traceability.
// Pure display — reads from useProvenance() hook. No business logic.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import { useProvenance } from "@/hooks/useProvenance";

const ProvenanceBadge: React.FC = memo(() => {
  const prov = useProvenance();

  if (!prov.runId) return null;

  return (
    <div style={S.container} role="status" aria-label="Simulation provenance">
      <span style={S.label}>PROVENANCE</span>
      <span style={S.sep}>│</span>
      <span style={S.item}>
        <span style={S.key}>Run</span>
        <span style={S.val}>#{String(prov.runId)}</span>
      </span>
      <span style={S.sep}>·</span>
      <span style={S.item}>
        <span style={S.key}>Engine</span>
        <span style={S.val}>v{prov.engineVersion}</span>
      </span>
      {prov.seed != null && (
        <>
          <span style={S.sep}>·</span>
          <span style={S.item}>
            <span style={S.key}>Seed</span>
            <span style={S.val}>{prov.seed}</span>
          </span>
        </>
      )}
      {prov.inputsHash != null && (
        <>
          <span style={S.sep}>·</span>
          <span style={S.item}>
            <span style={S.key}>Hash</span>
            <span style={S.val}>{prov.inputsHash}</span>
          </span>
        </>
      )}
    </div>
  );
});

ProvenanceBadge.displayName = "ProvenanceBadge";
export default ProvenanceBadge;

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 4,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 10,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.45)",
    userSelect: "none",
  },
  label: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1.2,
    color: "rgba(34,211,238,0.55)",
    textTransform: "uppercase" as const,
  },
  sep: {
    color: "rgba(255,255,255,0.12)",
  },
  item: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
  },
  key: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  val: {
    color: "rgba(255,255,255,0.55)",
  },
};
