import React, { useMemo } from "react"
import { NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"
import ProfileSwitcher from "@/components/persistence/ProfileSwitcher"
import ExportMenu from "@/components/export/ExportMenu"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"

const NAV_ITEMS = [
  { to: ROUTES.POSITION, label: "Position" },
  { to: ROUTES.WHAT_IF, label: "What If" },
  { to: ROUTES.ACTIONS, label: "Actions" },
  { to: ROUTES.TIMELINE, label: "Timeline" },
  { to: ROUTES.RISK, label: "Risk" },
  { to: ROUTES.COMPARE, label: "Compare" },
  { to: ROUTES.STUDIO, label: "Studio" },
  { to: ROUTES.VALUATION, label: "Valuation" },
  { to: ROUTES.BOARDROOM, label: "Boardroom" },
  { to: ROUTES.PULSE, label: "Pulse" },
]

interface Props {
  children: React.ReactNode
  rightSlot?: React.ReactNode
}

export default function PageShell({ children, rightSlot }: Props) {
  const { baseline } = useSystemBaseline()
  const exportKpis = useMemo(() => baseline ? buildPositionViewModel(baseline as any).kpis : null, [baseline])

  return (
    <div style={S.root}>
      <header style={S.header}>
        <NavLink to={ROUTES.INITIATE} style={S.logo}>STRATFIT</NavLink>
        <nav style={S.nav}>
          {NAV_ITEMS.map((item, i) => (
            <span key={item.to} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={S.divider} />}
              <NavLink
                to={item.to}
                style={({ isActive }) => isActive ? S.linkActive : S.link}
              >
                {item.label}
              </NavLink>
            </span>
          ))}
        </nav>
        <div style={S.rightSlot}>
          <div style={S.rightActions}>
            <span style={S.kbdHint} title="Open command palette">
              <kbd style={S.kbd}>Ctrl</kbd><kbd style={S.kbd}>K</kbd>
            </span>
            <ExportMenu kpis={exportKpis} />
            <ProfileSwitcher />
            {rightSlot}
          </div>
        </div>
      </header>
      <div style={S.body}>{children}</div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#040810",
    color: "rgba(200, 220, 240, 0.85)",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 52,
    background: "linear-gradient(180deg, rgba(10, 18, 32, 0.95) 0%, rgba(6, 12, 24, 0.98) 100%)",
    borderBottom: "1px solid rgba(34, 211, 238, 0.12)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
    flexShrink: 0,
    zIndex: 20,
  },
  logo: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(34, 211, 238, 0.8)",
    textDecoration: "none",
    flexShrink: 0,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    overflowX: "auto",
  },
  link: {
    padding: "10px 10px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    textDecoration: "none",
    borderRadius: 4,
    transition: "color 0.2s",
    whiteSpace: "nowrap",
  },
  linkActive: {
    padding: "10px 10px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#22d3ee",
    textDecoration: "none",
    borderRadius: 4,
    background: "rgba(34, 211, 238, 0.08)",
    transition: "color 0.2s",
    whiteSpace: "nowrap",
  },
  divider: {
    width: 1,
    height: 16,
    background: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  rightSlot: {
    minWidth: 80,
    display: "flex",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  kbdHint: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    opacity: 0.3,
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
