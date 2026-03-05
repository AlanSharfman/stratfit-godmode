// src/components/system/AppVersionFooter.tsx
// STRATFIT — App Version & System Health Indicator (9D)

import React, { useEffect, useMemo, useState } from "react"

type HealthStatus = "healthy" | "degraded" | "offline"

const VERSION = import.meta.env.VITE_APP_VERSION || "0.9.0"
const BUILD_TS = __BUILD_TIMESTAMP__ ?? new Date().toISOString()

function getSystemHealth(): HealthStatus {
  if (!navigator.onLine) return "offline"
  if (typeof performance !== "undefined") {
    const mem = (performance as any).memory
    if (mem && mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.85) return "degraded"
  }
  return "healthy"
}

const HEALTH_CONFIG: Record<HealthStatus, { color: string; label: string }> = {
  healthy: { color: "rgba(40, 255, 190, 0.8)", label: "All systems operational" },
  degraded: { color: "rgba(250, 204, 21, 0.8)", label: "Performance degraded" },
  offline: { color: "rgba(255, 78, 128, 0.8)", label: "Offline" },
}

export default function AppVersionFooter() {
  const [health, setHealth] = useState<HealthStatus>(getSystemHealth)

  useEffect(() => {
    const interval = setInterval(() => setHealth(getSystemHealth()), 10_000)
    const onOnline = () => setHealth(getSystemHealth())
    const onOffline = () => setHealth("offline")
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      clearInterval(interval)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  const buildDate = useMemo(() => {
    try {
      return new Date(BUILD_TS).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return "—"
    }
  }, [])

  const cfg = HEALTH_CONFIG[health]

  return (
    <div style={S.root}>
      <span style={{ ...S.dot, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} title={cfg.label} />
      <span style={S.version}>v{VERSION}</span>
      <span style={S.separator} />
      <span style={S.build}>{buildDate}</span>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    fontSize: 9,
    fontWeight: 500,
    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    color: "rgba(148, 180, 214, 0.3)",
    letterSpacing: "0.04em",
    userSelect: "none",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  version: {
    color: "rgba(148, 180, 214, 0.4)",
  },
  separator: {
    width: 1,
    height: 10,
    background: "rgba(148, 180, 214, 0.1)",
  },
  build: {
    color: "rgba(148, 180, 214, 0.25)",
  },
}
