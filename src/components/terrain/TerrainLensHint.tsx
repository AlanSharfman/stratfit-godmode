// src/components/terrain/TerrainLensHint.tsx
// First-run hint shown above the bottom bar until the user clicks a lens.
// Uses localStorage to only show once per device.

import React, { useEffect, useState } from "react"
import { useTerrainLensStore } from "@/state/terrainLensStore"

const STORAGE_KEY = "sf:terrain-lens-hint-dismissed"

export default function TerrainLensHint() {
  const [visible, setVisible] = useState(false)
  const activeLens = useTerrainLensStore((s) => s.activeLens)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable — skip hint
    }
  }, [])

  // Dismiss once user activates any lens
  useEffect(() => {
    if (activeLens && visible) {
      setVisible(false)
      try {
        localStorage.setItem(STORAGE_KEY, "1")
      } catch {
        // ignore
      }
    }
  }, [activeLens, visible])

  if (!visible) return null

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 18,
        pointerEvents: "none",
        animation: "sf-hint-float 2.5s ease-in-out infinite, sf-laser-fade-in 0.4s ease-out both",
      }}
    >
      <div
        style={{
          background: "rgba(8, 18, 34, 0.88)",
          border: "1px solid rgba(34, 211, 238, 0.2)",
          borderRadius: 10,
          padding: "8px 16px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(34, 211, 238, 0.7)",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>↓</span>
        Click a zone below to explore the terrain
      </div>
      <style>{`
        @keyframes sf-hint-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
