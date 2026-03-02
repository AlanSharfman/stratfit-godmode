// src/components/debug/PositionDebugHUD.tsx
// ═══════════════════════════════════════════════════════════════
// STRATFIT — Position Debug HUD (diagnostic overlay)
//
// Fixed top-left overlay showing runtime state for render debugging.
// Mount only when URL has ?debugHud=1.
// ═══════════════════════════════════════════════════════════════

import React from "react"
import { useDebugSignals, useDebugFlags } from "@/debug/debugSignals"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useShallow } from "zustand/react/shallow"

const HUD_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 8,
  left: 8,
  zIndex: 99999,
  background: "rgba(0, 0, 0, 0.82)",
  color: "#e2e8f0",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 11,
  lineHeight: 1.6,
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid rgba(34, 211, 238, 0.3)",
  pointerEvents: "none",
  userSelect: "none",
  maxWidth: 400,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
}

const LABEL: React.CSSProperties = { color: "#94a3b8" }
const VAL_OK: React.CSSProperties = { color: "#22d3ee" }
const VAL_WARN: React.CSSProperties = { color: "#f59e0b" }
const VAL_BAD: React.CSSProperties = { color: "#ef4444" }

export default function PositionDebugHUD() {
  const { debugEvents } = useDebugFlags()
  const { terrainReady, pathsOn, timelineOn, liquidityOn, eventsOn, eventsLength } = useDebugSignals(
    useShallow((s) => ({
      terrainReady: s.terrainReady,
      pathsOn: s.pathsOn,
      timelineOn: s.timelineOn,
      liquidityOn: s.liquidityOn,
      eventsOn: s.eventsOn,
      eventsLength: s.eventsLength,
    })),
  )

  const { activeId, activeStatus } = usePhase1ScenarioStore(
    useShallow((s) => {
      const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId)
      return {
        activeId: s.activeScenarioId,
        activeStatus: active?.status ?? null,
      }
    }),
  )

  const loc =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "?"

  return (
    <div style={HUD_STYLE}>
      <div>
        <span style={LABEL}>route: </span>
        <span style={VAL_OK}>{loc}</span>
      </div>
      <div>
        <span style={LABEL}>debugEvents: </span>
        <span style={debugEvents ? VAL_OK : VAL_WARN}>
          {String(debugEvents)}
        </span>
      </div>
      <div>
        <span style={LABEL}>terrainReady: </span>
        <span style={terrainReady ? VAL_OK : VAL_BAD}>
          {String(terrainReady)}
        </span>
      </div>
      <div>
        <span style={LABEL}>pathsOn: </span>
        <span style={pathsOn ? VAL_OK : VAL_WARN}>{String(pathsOn)}</span>
      </div>
      <div>
        <span style={LABEL}>timelineOn: </span>
        <span style={timelineOn ? VAL_OK : VAL_WARN}>{String(timelineOn)}</span>
      </div>
      <div>
        <span style={LABEL}>liquidityOn: </span>
        <span style={liquidityOn ? VAL_OK : VAL_WARN}>{String(liquidityOn)}</span>
      </div>
      <div>
        <span style={LABEL}>eventsOn: </span>
        <span style={eventsOn ? VAL_OK : VAL_WARN}>{String(eventsOn)}</span>
      </div>
      <div>
        <span style={LABEL}>events.length: </span>
        <span style={eventsLength > 0 ? VAL_OK : VAL_WARN}>
          {eventsLength}
        </span>
      </div>
      <div>
        <span style={LABEL}>scenario: </span>
        <span style={activeId ? VAL_OK : VAL_BAD}>
          {activeId ? activeId.slice(0, 8) : "none"}
        </span>
        <span style={LABEL}> status=</span>
        <span
          style={
            activeStatus === "complete"
              ? VAL_OK
              : activeStatus === "running"
                ? VAL_WARN
                : VAL_BAD
          }
        >
          {activeStatus ?? "—"}
        </span>
      </div>
    </div>
  )
}
