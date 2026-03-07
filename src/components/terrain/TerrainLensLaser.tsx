// src/components/terrain/TerrainLensLaser.tsx
// Terrain Lens laser beam — connects bottom bar pill → 3D terrain marker.
// Colour is driven by the active lens config (not hardcoded cyan).
// No timeout — beam stays visible as long as the lens is active.

import React, { useEffect, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { getLensConfig } from "@/components/terrain/TerrainLensConfig"

const LASER_DASH_KEYFRAMES = `
@keyframes sf-laser-march {
  to { stroke-dashoffset: -40; }
}
@keyframes sf-laser-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`

let _laserStyleInjected = false
function ensureLaserStyles() {
  if (_laserStyleInjected) return
  _laserStyleInjected = true
  const s = document.createElement("style")
  s.textContent = LASER_DASH_KEYFRAMES
  document.head.appendChild(s)
}

interface Props {
  kpi: KpiKey
  markerPos: { x: number; y: number }
  viewportRef: React.RefObject<HTMLDivElement | null>
}

export default function TerrainLensLaser({ kpi, markerPos, viewportRef }: Props) {
  const [pillPos, setPillPos] = useState<{ x: number; y: number } | null>(null)
  const lens = getLensConfig(kpi)
  const color = lens?.color ?? "#22D3EE"
  const colorLight = lightenHex(color, 0.3)

  useEffect(() => {
    ensureLaserStyles()
  }, [])

  useEffect(() => {
    const vpEl = viewportRef.current
    if (!vpEl) return
    const pillEl = vpEl.querySelector(`[data-kpi-pill="${kpi}"]`) as HTMLElement | null
    if (!pillEl) return
    const vpRect = vpEl.getBoundingClientRect()
    const pillRect = pillEl.getBoundingClientRect()
    setPillPos({
      x: pillRect.left + pillRect.width / 2 - vpRect.left,
      y: pillRect.top + pillRect.height / 2 - vpRect.top,
    })
  }, [kpi, viewportRef])

  if (!pillPos) return null

  const sx = pillPos.x
  const sy = pillPos.y
  const tx = markerPos.x
  const ty = markerPos.y
  const dx = tx - sx
  const dy = ty - sy
  const len = Math.sqrt(dx * dx + dy * dy)

  return (
    <svg
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        zIndex: 20, pointerEvents: "none",
        animation: "sf-laser-fade-in 0.08s ease-out both",
      }}
    >
      <defs>
        <filter id="sf-laser-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b1" />
          <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="b2" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sf-laser-flare" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="sf-laser-grad" x1={sx} y1={sy} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="10%" stopColor={color} stopOpacity="1" />
          <stop offset="90%" stopColor={colorLight} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Wide outer glow */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke={color} strokeWidth={8} opacity={0.18}
        filter="url(#sf-laser-glow)" />

      {/* Mid glow */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke={color} strokeWidth={4} opacity={0.45}
        filter="url(#sf-laser-glow)" />

      {/* Core beam */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="url(#sf-laser-grad)" strokeWidth={2.5}
        filter="url(#sf-laser-glow)" />

      {/* White-hot center */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="#ECFEFF" strokeWidth={1} opacity={0.85} />

      {/* Animated energy pulse dashes */}
      <line x1={sx} y1={sy} x2={tx} y2={ty}
        stroke={colorLight} strokeWidth={2}
        strokeDasharray="6 14"
        style={{ animation: "sf-laser-march 0.4s linear infinite" }}
        opacity={0.7} />

      {/* Source flare (pill) */}
      <circle cx={sx} cy={sy} r={8} fill={color} opacity={0.35} filter="url(#sf-laser-flare)" />
      <circle cx={sx} cy={sy} r={4} fill="#ECFEFF" opacity={0.6} />

      {/* Target flare (marker) */}
      <circle cx={tx} cy={ty} r={12} fill={color} opacity={0.4} filter="url(#sf-laser-flare)" />
      <circle cx={tx} cy={ty} r={5} fill="#ECFEFF" opacity={0.7} />

      {/* Arrowhead at target */}
      <polygon
        points={(() => {
          if (len < 1) return "0,0 0,0 0,0"
          const nx = dx / len
          const ny = dy / len
          const px = -ny
          const py = nx
          const tipX = tx
          const tipY = ty
          const backX = tx - nx * 14
          const backY = ty - ny * 14
          return `${tipX},${tipY} ${backX + px * 7},${backY + py * 7} ${backX - px * 7},${backY - py * 7}`
        })()}
        fill={color} opacity={0.9}
        filter="url(#sf-laser-glow)"
      />
    </svg>
  )
}

/** Lighten a hex colour by a factor (0–1) towards white */
function lightenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lr = Math.round(r + (255 - r) * factor)
  const lg = Math.round(g + (255 - g) * factor)
  const lb = Math.round(b + (255 - b) * factor)
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`
}
