import React, { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, KPI_CATEGORY_COLORS, PRIMARY_KPI_KEYS, SECONDARY_KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

interface Props {
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  focusedKpi: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  visible?: boolean
}

const ZONE_ICONS: Record<KpiKey, string> = {
  cash: "◈", runway: "⏳", growth: "↗", arr: "₿",
  revenue: "⚡", burn: "🔥", churn: "↺",
  grossMargin: "△", headcount: "⊕", nrr: "⟲", efficiency: "▣", enterpriseValue: "◆",
}

export default React.memo(function TerrainZoneLabels({ kpis, revealedKpis, focusedKpi, onFocusKpi, onClickKpi, visible = true }: Props) {
  const zones = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return []
    const isSecondaryFocused = focusedKpi && SECONDARY_KPI_KEYS.includes(focusedKpi)
    const visibleKeys = isSecondaryFocused
      ? [...PRIMARY_KPI_KEYS, ...SECONDARY_KPI_KEYS.filter(k => k === focusedKpi)]
      : [...PRIMARY_KPI_KEYS]
    return visibleKeys.filter(k => revealedKpis.has(k)).map(kpi => {
      const zone = KPI_ZONE_MAP[kpi]
      const color = KPI_CATEGORY_COLORS[kpi].hex
      const xCenter = (zone.xStart + zone.xEnd) / 2
      return { kpi, label: zone.label, color, xCenter, icon: ZONE_ICONS[kpi] }
    })
  }, [kpis, revealedKpis, focusedKpi])

  if (!visible || zones.length === 0) return null

  return (
    <div style={{
      position: "absolute",
      bottom: 20, left: 0, right: 0,
      zIndex: 12,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        display: "flex", gap: 3,
        padding: "8px 14px",
        background: "rgba(12,20,34,0.78)",
        borderRadius: 12,
        border: "1px solid rgba(34,211,238,0.10)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        pointerEvents: "auto",
      }}>
        <AnimatePresence>
          {zones.map((z, i) => {
            const isFocused = focusedKpi === z.kpi
            return (
              <motion.button
                key={z.kpi}
                type="button"
                data-kpi-pill={z.kpi}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                onClick={() => { onClickKpi?.(isFocused ? null : z.kpi) }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 5, padding: "9px 11px", borderRadius: 8,
                  background: isFocused ? `rgba(${hexToRgb(z.color)},0.15)` : "rgba(255,255,255,0.02)",
                  border: isFocused ? `1px solid ${z.color}55` : "1px solid rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "background 0.25s, border 0.25s, box-shadow 0.25s",
                  minWidth: 46,
                  boxShadow: isFocused
                    ? `0 0 14px ${z.color}44, inset 0 0 10px ${z.color}18`
                    : "none",
                }}
              >
                <span style={{
                  fontSize: 18,
                  lineHeight: 1,
                  filter: isFocused ? `drop-shadow(0 0 10px ${z.color})` : "none",
                  transition: "filter 0.25s",
                }}>
                  {z.icon}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: isFocused ? z.color : "rgba(200,220,240,0.65)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: "color 0.25s",
                  textShadow: isFocused ? `0 0 8px ${z.color}` : "none",
                }}>
                  {z.label.split(" ")[0]}
                </span>
                <div style={{
                  width: isFocused ? 30 : 18, height: 3, borderRadius: 2,
                  background: z.color,
                  opacity: isFocused ? 1.0 : 0.45,
                  transition: "all 0.25s",
                  boxShadow: isFocused ? `0 0 12px ${z.color}, 0 0 4px ${z.color}` : "none",
                }} />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
})
