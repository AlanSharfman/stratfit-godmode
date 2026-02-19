import React from "react"
import { usePositionNarrative } from "./PositionNarrativeContext"

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.06)",
        opacity: 0.9,
      }}
    >
      {text}
    </span>
  )
}

export default function InsightPanel() {
  const { selection, isLocked, lockedId } = usePositionNarrative()
  const ins = selection.insight

  return (
    <div
      style={{
        width: 360,
        padding: 14,
        borderRadius: 14,
        background: "rgba(8, 12, 16, 0.62)",
        border: "1px solid rgba(0, 224, 255, 0.18)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
        color: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{selection.title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {ins?.confidence ? <Pill text={`Confidence: ${ins.confidence.toUpperCase()}`} /> : null}
          {isLocked && lockedId ? <Pill text="LOCKED" /> : <Pill text="HOVER" />}
        </div>
      </div>

      <div style={{ marginTop: 10, lineHeight: 1.35 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{ins?.summary ?? "—"}</div>

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
          <div style={{ opacity: 0.65, marginBottom: 4 }}>WHY IT MATTERS</div>
          <div>{ins?.whyItMatters ?? "—"}</div>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
          <div style={{ opacity: 0.65, marginBottom: 4 }}>PRIMARY DRIVER</div>
          <div>{ins?.driver ?? "—"}</div>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
          <div style={{ opacity: 0.65, marginBottom: 4 }}>RECOMMENDED FOCUS</div>
          <div>{ins?.recommendation ?? "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6 }}>
        Click a beacon to lock. Press ESC to clear.
      </div>
    </div>
  )
}
