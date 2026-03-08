import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAlertsStore, type AlertSeverity } from "@/engine/alertsEngine"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"

interface AlertsDashboardProps {
  kpis: PositionKpis | null
  compact?: boolean
}

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.12)", text: "#f87171", dot: "#f87171" },
  warning: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.1)", text: "#fbbf24", dot: "#fbbf24" },
  info: { bg: "rgba(34,211,238,0.04)", border: "rgba(34,211,238,0.08)", text: "#22d3ee", dot: "#22d3ee" },
}

export default React.memo(function AlertsDashboard({ kpis, compact = false }: AlertsDashboardProps) {
  const triggered = useAlertsStore((s) => s.triggered)
  const evaluateAlerts = useAlertsStore((s) => s.evaluateAlerts)
  const acknowledgeAlert = useAlertsStore((s) => s.acknowledgeAlert)
  const rules = useAlertsStore((s) => s.rules)

  useEffect(() => {
    if (kpis) evaluateAlerts(kpis)
  }, [kpis, evaluateAlerts])

  const unacknowledged = useMemo(() => triggered.filter((a) => !a.acknowledged), [triggered])
  const activeCount = unacknowledged.length

  if (compact) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: activeCount > 0 ? "#f87171" : "rgba(34,211,238,0.5)", marginBottom: 8 }}>
          Alerts ({activeCount})
        </div>
        {unacknowledged.length === 0 ? (
          <div style={{ fontSize: 11, color: "rgba(52,211,153,0.5)", padding: "8px 0" }}>All clear</div>
        ) : (
          unacknowledged.slice(0, 5).map((alert) => {
            const c = SEVERITY_COLORS[alert.severity]
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  padding: "8px 10px", marginBottom: 4, borderRadius: 6,
                  background: c.bg, border: `1px solid ${c.border}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: c.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(200,220,240,0.2)" }}>
                    {KPI_ZONE_MAP[alert.kpi].label}
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  style={{
                    padding: "2px 6px", borderRadius: 3, background: "transparent",
                    border: "1px solid rgba(200,220,240,0.08)", color: "rgba(200,220,240,0.3)",
                    fontSize: 8, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Ack
                </button>
              </motion.div>
            )
          })
        )}
        <div style={{ fontSize: 8, color: "rgba(200,220,240,0.12)", marginTop: 6 }}>
          {rules.filter((r) => r.enabled).length} rules active
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)", marginBottom: 16 }}>
        Alert Rules & Triggered Alerts
      </div>

      {/* Active alerts */}
      {unacknowledged.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#f87171", marginBottom: 8 }}>
            Active ({unacknowledged.length})
          </div>
          {unacknowledged.map((alert) => {
            const c = SEVERITY_COLORS[alert.severity]
            return (
              <div key={alert.id} style={{
                padding: "10px 12px", marginBottom: 6, borderRadius: 6,
                background: c.bg, border: `1px solid ${c.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{alert.message}</div>
                  <div style={{ fontSize: 9, color: "rgba(200,220,240,0.25)", marginTop: 2 }}>
                    {KPI_ZONE_MAP[alert.kpi].label} · {new Date(alert.triggeredAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  style={{
                    padding: "4px 10px", borderRadius: 4,
                    background: "rgba(200,220,240,0.03)", border: "1px solid rgba(200,220,240,0.08)",
                    color: "rgba(200,220,240,0.4)", fontSize: 10, cursor: "pointer",
                  }}
                >
                  Acknowledge
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Rules */}
      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(200,220,240,0.5)", marginBottom: 8 }}>
        Rules ({rules.length})
      </div>
      {rules.map((rule) => (
        <div key={rule.id} style={{
          padding: "8px 10px", marginBottom: 4, borderRadius: 6,
          background: rule.enabled ? "rgba(200,220,240,0.02)" : "rgba(200,220,240,0.01)",
          border: "1px solid rgba(200,220,240,0.04)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          opacity: rule.enabled ? 1 : 0.4,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(200,220,240,0.6)" }}>{rule.message}</div>
            <div style={{ fontSize: 9, color: "rgba(200,220,240,0.2)" }}>
              {KPI_ZONE_MAP[rule.kpi].label} {rule.condition} {rule.threshold} · {rule.severity}
            </div>
          </div>
          <span style={{
            fontSize: 8, fontWeight: 600,
            color: rule.enabled ? "rgba(52,211,153,0.5)" : "rgba(200,220,240,0.2)",
          }}>
            {rule.enabled ? "ON" : "OFF"}
          </span>
        </div>
      ))}
    </div>
  )
})
