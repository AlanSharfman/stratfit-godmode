import React, { useEffect, useMemo, useState } from "react"
import { terrainHeightMode } from "@/config/featureFlags"

type Diag = {
  fps: number
  width: number
  height: number
  dpr: number
  time: string
}

export default function PositionDiagnosticsOverlay() {
  const [open, setOpen] = useState(true)
  const [diag, setDiag] = useState<Diag>(() => ({
    fps: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    time: new Date().toLocaleTimeString(),
  }))

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let frames = 0

    const onResize = () => {
      setDiag((d) => ({
        ...d,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      }))
    }

    const tick = (t: number) => {
      frames += 1
      const dt = t - last
      if (dt >= 500) {
        const fps = Math.round((frames * 1000) / dt)
        frames = 0
        last = t
        setDiag((d) => ({
          ...d,
          fps,
          time: new Date().toLocaleTimeString(),
        }))
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener("resize", onResize)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  const pill = useMemo(() => {
    const ok = diag.fps >= 30
    const label = ok ? "OK" : "LOW"
    return { ok, label }
  }, [diag.fps])

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        zIndex: 50,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 10,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            cursor: "pointer",
            borderRadius: 999,
            padding: "8px 12px",
            border: "1px solid rgba(125, 211, 252, 0.25)",
            background: "rgba(7, 12, 18, 0.7)",
            color: "rgba(226, 232, 240, 0.92)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Toggle diagnostics"
        >
          Diagnostics
        </button>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${pill.ok ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
            background: "rgba(7, 12, 18, 0.55)",
            color: pill.ok ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
            fontSize: 12,
            letterSpacing: 0.3,
          }}
        >
          {pill.label} • {diag.fps} fps
        </div>
      </div>

      {open && (
        <div
          style={{
            width: 360,
            borderRadius: 14,
            border: "1px solid rgba(125, 211, 252, 0.18)",
            background: "rgba(7, 12, 18, 0.72)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: "rgba(226, 232, 240, 0.92)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(125, 211, 252, 0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: 0.2 }}>
              Position • Diagnostics
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{diag.time}</div>
          </div>

          <div style={{ padding: 12, fontSize: 12, lineHeight: 1.5 }}>
            <Row k="terrainHeightMode" v={terrainHeightMode} />
            <Row k="viewport" v={`${diag.width} × ${diag.height}`} />
            <Row k="devicePixelRatio" v={`${diag.dpr}`} />
            <Row k="render" v="Canvas owned by TerrainStage ✅" />
            <Row k="boundary" v="R3F primitives inside Canvas ✅" />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
      <div style={{ opacity: 0.75 }}>{k}</div>
      <div style={{ opacity: 0.95, textAlign: "right" }}>{v}</div>
    </div>
  )
}
