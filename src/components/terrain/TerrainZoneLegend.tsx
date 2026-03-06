import React, { useCallback, useMemo, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, KPI_CATEGORY_COLORS, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  focusedKpi: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  compact?: boolean
}

export default React.memo(function TerrainZoneLegend({ kpis, revealedKpis, focusedKpi, onFocusKpi, compact = false }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])
  const clearFocus = useCallback(() => onFocusKpi?.(null), [onFocusKpi])

  const zones = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return []
    return KPI_KEYS.filter((k) => revealedKpis.has(k)).map((kpi) => {
      const color = KPI_CATEGORY_COLORS[kpi].hex
      const health = getHealthLevel(kpi, kpis)
      return { kpi, label: KPI_ZONE_MAP[kpi].label, health, color }
    })
  }, [kpis, revealedKpis])

  if (zones.length === 0) return null

  return (
    <div style={{
      position: "absolute",
      bottom: compact ? 8 : 14,
      left: compact ? 8 : 14,
      zIndex: 15,
      pointerEvents: "auto",
    }}>
      <button
        onClick={toggleCollapsed}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(12,20,34,0.88)", border: "1px solid rgba(34,211,238,0.1)",
          borderRadius: collapsed ? 6 : "6px 6px 0 0", padding: "6px 10px",
          cursor: "pointer", color: "rgba(34,211,238,0.5)", fontSize: 9,
          fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
          fontFamily: "'Inter', system-ui, sans-serif",
          width: collapsed ? "auto" : compact ? 170 : 200,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 7 L5 2 L9 7" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" fill="none"
            transform={collapsed ? "rotate(180 5 4.5)" : ""} />
        </svg>
        Terrain Zones
      </button>

      {!collapsed && (
        <div style={{
          background: "rgba(12,20,34,0.88)", border: "1px solid rgba(34,211,238,0.1)",
          borderTop: "none", borderRadius: "0 0 6px 6px",
          padding: "4px 0",
          width: compact ? 170 : 200,
          maxHeight: 280, overflowY: "auto",
        }}>
          {zones.map(({ kpi, label, health, color }) => {
            const isFocused = focusedKpi === kpi
            return (
              <div
                key={kpi}
                onClick={() => onFocusKpi?.(isFocused ? null : kpi)}
                onMouseEnter={() => onFocusKpi?.(kpi)}
                onMouseLeave={() => { if (!isFocused) clearFocus() }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: compact ? "4px 10px" : "5px 10px",
                  cursor: onFocusKpi ? "pointer" : "default",
                  background: isFocused ? `${color}18` : "transparent",
                  transition: "background 0.2s, box-shadow 0.2s",
                  boxShadow: isFocused ? `inset 0 0 8px ${color}22` : "none",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: color, flexShrink: 0,
                  boxShadow: isFocused ? `0 0 8px ${color}, 0 0 3px ${color}` : "none",
                  transition: "box-shadow 0.2s",
                }} />
                <span style={{
                  fontSize: compact ? 9 : 10, fontWeight: 600,
                  color: isFocused ? "#E6F1FF" : "rgba(200,220,240,0.5)",
                  letterSpacing: "0.03em", flex: 1,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textShadow: isFocused ? `0 0 6px ${color}` : "none",
                  transition: "color 0.2s, text-shadow 0.2s",
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 700,
                  color, textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  textShadow: isFocused ? `0 0 6px ${color}` : "none",
                }}>
                  {health}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
