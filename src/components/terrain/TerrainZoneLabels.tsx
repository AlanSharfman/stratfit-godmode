import React, { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, KPI_CATEGORY_COLORS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  focusedKpi: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  visible?: boolean
}

const ZONE_ICONS: Record<KpiKey, string> = {
  cash: "◈", runway: "⏳", growth: "↗", arr: "₿",
  revenue: "⚡", burn: "🔥", churn: "↺",
  grossMargin: "△", headcount: "⊕", nrr: "⇈",
  efficiency: "⚙", enterpriseValue: "◆",
}

export default React.memo(function TerrainZoneLabels({ kpis, revealedKpis, focusedKpi, onFocusKpi, visible = true }: Props) {
  const zones = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return []
    return KPI_KEYS.filter(k => revealedKpis.has(k)).map(kpi => {
      const zone = KPI_ZONE_MAP[kpi]
      const color = KPI_CATEGORY_COLORS[kpi].hex
      const xCenter = (zone.xStart + zone.xEnd) / 2
      return { kpi, label: zone.label, color, xCenter, icon: ZONE_ICONS[kpi] }
    })
  }, [kpis, revealedKpis])

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
        background: "rgba(4,8,16,0.78)",
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                onMouseEnter={() => onFocusKpi?.(z.kpi)}
                onMouseLeave={() => onFocusKpi?.(null)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 5, padding: "9px 11px", borderRadius: 8,
                  background: isFocused ? "rgba(34,211,238,0.10)" : "rgba(255,255,255,0.02)",
                  border: isFocused ? `1px solid rgba(34,211,238,0.22)` : "1px solid rgba(255,255,255,0.03)",
                  cursor: onFocusKpi ? "pointer" : "default",
                  transition: "background 0.2s, border 0.2s",
                  minWidth: 46,
                }}
              >
                <span style={{
                  fontSize: 18,
                  lineHeight: 1,
                  filter: isFocused ? `drop-shadow(0 0 8px ${z.color})` : "none",
                  transition: "filter 0.2s",
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
                  transition: "color 0.2s",
                }}>
                  {z.label.split(" ")[0]}
                </span>
                <div style={{
                  width: isFocused ? 26 : 18, height: 3, borderRadius: 2,
                  background: z.color,
                  opacity: isFocused ? 1.0 : 0.45,
                  transition: "all 0.2s",
                  boxShadow: isFocused ? `0 0 8px ${z.color}` : "none",
                }} />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
})
