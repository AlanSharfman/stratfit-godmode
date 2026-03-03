// src/components/debug/TerrainRenderContractPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Render Contract Debug Panel (God Mode)
//
// Compact monospace readout of the current TerrainRenderContract.
// Only visible when ?debug=1 is present in the URL.
// Mounted inside terrain viewports (Position, Studio, Compare).
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react"
import type { TerrainRenderContract } from "@/domain/terrain/renderContract"
import { assertRenderInvariants, type InvariantResult } from "@/domain/terrain/assertRenderInvariants"

interface Props {
  contract: TerrainRenderContract
  /** Label — e.g. "Position", "Studio-A", "Compare-B" */
  label?: string
}

/** Returns true if ?debug=1 is in the current URL */
function useDebugEnabled(): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  return params.get("debug") === "1"
}

export default function TerrainRenderContractPanel({ contract, label }: Props) {
  const debugEnabled = useDebugEnabled()
  if (!debugEnabled) return null

  return <ContractPanelInner contract={contract} label={label} />
}

function ContractPanelInner({ contract, label }: Props) {
  const invariantResult = useMemo(
    () => assertRenderInvariants(contract),
    [contract],
  )

  const passed = invariantResult.pass
  const c = contract

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.title}>RENDER CONTRACT {label ? `[${label}]` : ""}</span>
        <span style={passed ? S.passBadge : S.failBadge}>
          {passed ? "PASS" : "FAIL"}
        </span>
      </div>

      {/* Data Presence */}
      <div style={S.section}>
        <Row k="engine" v={c.hasEngineResults} />
        <Row k="runId" v={c.runId ?? "—"} />
        <Row k="seed" v={c.seed ?? "—"} />
        <Row k="events" v={c.eventCount} />
        <Row k="path" v={c.hasPath} extra={`(${c.pathPointCount} pts)`} />
        <Row k="metrics" v={c.hasTerrainMetrics} />
        <Row k="horizon" v={c.horizonMonths ?? "—"} />
      </div>

      {/* Layers */}
      <div style={S.section}>
        <div style={S.sectionLabel}>LAYERS</div>
        {Object.entries(c.layers).map(([k, v]) => (
          <Row key={k} k={k} v={v} />
        ))}
      </div>

      {/* Mode */}
      <div style={S.section}>
        <Row k="mode" v={c.mode ?? "—"} />
        <Row k="viewMode" v={c.viewMode ?? "—"} />
      </div>

      {/* Camera */}
      <div style={S.section}>
        <div style={S.sectionLabel}>CAMERA</div>
        <Row k="pos" v={c.camera.pos.map((n) => n.toFixed(0)).join(", ")} />
        <Row k="target" v={c.camera.target.map((n) => n.toFixed(0)).join(", ")} />
        <Row k="fov" v={c.camera.fov.toFixed(0)} />
      </div>

      {/* Invariant failures */}
      {!passed && (
        <div style={S.failSection}>
          {invariantResult.failures.map((f, i) => (
            <div key={i} style={S.failRow}>{f}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Row helper ── */
function Row({ k, v, extra }: { k: string; v: string | number | boolean; extra?: string }) {
  const isBoolean = typeof v === "boolean"
  return (
    <div style={S.row}>
      <span style={S.key}>{k}</span>
      <span style={isBoolean ? (v ? S.valTrue : S.valFalse) : S.val}>
        {isBoolean ? (v ? "✓" : "✗") : String(v)}
      </span>
      {extra && <span style={S.extra}>{extra}</span>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES — compact monospace debug panel
   ═══════════════════════════════════════════════════════════════════════════ */

const MONO = "ui-monospace, 'JetBrains Mono', 'Fira Code', monospace"

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 9999,
    background: "rgba(0,0,0,0.88)",
    border: "1px solid rgba(0,229,255,0.25)",
    borderRadius: 6,
    padding: "8px 10px",
    fontFamily: MONO,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.7)",
    pointerEvents: "none",
    maxWidth: 260,
    backdropFilter: "blur(6px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 4,
  },
  title: {
    fontWeight: 700,
    fontSize: 8.5,
    letterSpacing: "0.12em",
    color: "rgba(0,229,255,0.75)",
  },
  passBadge: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#22c55e",
    background: "rgba(34,197,94,0.12)",
    padding: "1px 6px",
    borderRadius: 3,
  },
  failBadge: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#ef4444",
    background: "rgba(239,68,68,0.12)",
    padding: "1px 6px",
    borderRadius: 3,
  },
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.35)",
    marginBottom: 2,
  },
  row: {
    display: "flex",
    gap: 6,
    alignItems: "baseline",
  },
  key: {
    color: "rgba(255,255,255,0.4)",
    minWidth: 70,
  },
  val: {
    color: "rgba(255,255,255,0.75)",
  },
  valTrue: {
    color: "#22c55e",
    fontWeight: 700,
  },
  valFalse: {
    color: "#ef4444",
    fontWeight: 700,
  },
  extra: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8.5,
  },
  failSection: {
    marginTop: 6,
    borderTop: "1px solid rgba(239,68,68,0.3)",
    paddingTop: 4,
  },
  failRow: {
    color: "#ef4444",
    fontSize: 8.5,
    lineHeight: 1.4,
  },
}
