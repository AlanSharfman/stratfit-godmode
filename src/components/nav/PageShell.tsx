import React, { useMemo } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ROUTES } from "@/routes/routeContract"
import ProfileSwitcher from "@/components/persistence/ProfileSwitcher"
import ExportMenu from "@/components/export/ExportMenu"
import TerrainShareButton from "@/components/terrain/TerrainShareButton"
import VoiceSettingsPanel from "@/components/settings/VoiceSettingsPanel"
import AppVersionFooter from "@/components/system/AppVersionFooter"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"

const NAV_ITEMS = [
  { to: ROUTES.POSITION,   label: "Position" },
  { to: ROUTES.WHAT_IF,    label: "What If" },
  { to: ROUTES.COMPARE,    label: "Compare" },
  { to: ROUTES.RISK,       label: "Risk" },
  { to: ROUTES.VALUATION,  label: "Valuation" },
  { to: ROUTES.BOARDROOM,  label: "Boardroom" },
]

interface Props {
  children: React.ReactNode
  rightSlot?: React.ReactNode
}

export default function PageShell({ children, rightSlot }: Props) {
  const { baseline } = useSystemBaseline()
  const exportKpis = useMemo(() => baseline ? buildPositionViewModel(baseline as any).kpis : null, [baseline])
  const location = useLocation()

  return (
    <div style={S.root}>
      <header style={S.header}>
        {/* Logo + wordmark */}
        <NavLink to={ROUTES.INITIATE} style={S.logoWrap}>
          {/* Icon mark */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
            <polygon
              points="11,2 20,18 2,18"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <polygon
              points="11,6 17,17 5,17"
              fill="rgba(34,211,238,0.15)"
              stroke="none"
            />
          </svg>
          <span style={S.logoText}>STRATFIT</span>
        </NavLink>

        {/* Separator */}
        <span style={S.logoSep} />

        {/* Main nav */}
        <nav style={S.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={isActive ? S.linkActive : S.link}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    style={S.activeBar}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={S.rightActions}>
          <span style={S.kbdHint} title="Open command palette">
            <kbd style={S.kbd}>Ctrl</kbd><kbd style={S.kbd}>K</kbd>
          </span>
          <VoiceSettingsPanel />
          <TerrainShareButton />
          <ExportMenu kpis={exportKpis} />
          <ProfileSwitcher />
          {rightSlot}
        </div>
      </header>

      <div style={S.body}>{children}</div>
      <AppVersionFooter />
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0B1520",
    color: "rgba(210, 228, 245, 0.92)",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "0 20px",
    height: 58,
    background: "linear-gradient(180deg, rgba(14,24,40,0.98) 0%, rgba(10,18,30,0.99) 100%)",
    borderBottom: "1px solid rgba(34,211,238,0.18)",
    boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
    flexShrink: 0,
    zIndex: 20,
    position: "relative" as const,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
    flexShrink: 0,
    marginRight: 4,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#ffffff",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  logoSep: {
    width: 1,
    height: 24,
    background: "rgba(34,211,238,0.15)",
    flexShrink: 0,
    margin: "0 16px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    gap: 2,
    minWidth: 0,
    overflow: "visible",
  },
  link: {
    position: "relative" as const,
    padding: "8px 11px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.72)",
    textDecoration: "none",
    borderRadius: 5,
    transition: "color 0.15s, background 0.15s",
    whiteSpace: "nowrap" as const,
  },
  linkActive: {
    position: "relative" as const,
    padding: "8px 11px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "#22d3ee",
    textDecoration: "none",
    borderRadius: 5,
    background: "rgba(34,211,238,0.09)",
    transition: "color 0.15s, background 0.15s",
    whiteSpace: "nowrap" as const,
  },
  activeBar: {
    position: "absolute" as const,
    bottom: -1,
    left: "15%",
    right: "15%",
    height: 2,
    borderRadius: 1,
    background: "#22d3ee",
    boxShadow: "0 0 10px rgba(34,211,238,0.5)",
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    marginLeft: 12,
  },
  kbdHint: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    opacity: 0.25,
    cursor: "default",
  },
  kbd: {
    padding: "2px 5px",
    borderRadius: 3,
    background: "rgba(200,220,240,0.04)",
    border: "1px solid rgba(200,220,240,0.08)",
    fontSize: 9,
    fontFamily: "ui-monospace, monospace",
    color: "rgba(200,220,240,0.4)",
    fontWeight: 500,
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
}
