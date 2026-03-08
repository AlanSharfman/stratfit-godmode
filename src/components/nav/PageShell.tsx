// src/components/nav/PageShell.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Global Application Shell
//
// ONE shell. Every primary route renders inside this component.
// Locked colour palette, cinematic dark theme, 3-column header.
//
// Colour tokens (locked — do not deviate):
//   base navy      #061326
//   deep navy      #081B33
//   dark azure     #0D2A49
//   charcoal blue  #0A101A
//   panel navy     #0B1F36
//   cyan accent    #21D4FD
//   electric cyan  #4DEBFF
//   soft white     #EAF4FF
//   muted white    #9DB7D1
//   strategic purple #6E5BFF
//   lime positive  #B7FF3C
//
// BANNED: red, orange, pink (use violet / cyan / white hierarchy instead)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react"
import { NavLink, Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ROUTES } from "@/routes/routeContract"
import { LIVE_NAV } from "@/nav/liveNav"
import ProfileSwitcher from "@/components/persistence/ProfileSwitcher"
import ExportMenu from "@/components/export/ExportMenu"
import TerrainShareButton from "@/components/terrain/TerrainShareButton"
import VoiceSettingsPanel from "@/components/settings/VoiceSettingsPanel"
import AppVersionFooter from "@/components/system/AppVersionFooter"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { buildPositionViewModel } from "@/pages/position/overlays/positionState"

interface Props {
  children: React.ReactNode
  /** Slot for page-specific controls injected into the right of the header */
  rightSlot?: React.ReactNode
  /** Override body overflow — use "visible" for pages that manage their own scroll */
  bodyOverflow?: "hidden" | "auto" | "visible"
}

export default function PageShell({ children, rightSlot, bodyOverflow = "hidden" }: Props) {
  const { baseline } = useSystemBaseline()
  const exportKpis = useMemo(
    () => (baseline ? buildPositionViewModel(baseline as any).kpis : null),
    [baseline],
  )
  const location = useLocation()

  return (
    <div style={S.root}>
      {/* ── Global header ─────────────────────────────────────────────── */}
      {/*
        3-column grid:
          col 1 (1fr)  — logo/brand,  left-aligned
          col 2 (auto) — nav items,   genuinely viewport-centred
          col 3 (1fr)  — utilities,   right-aligned
        Centre column is always centred regardless of left/right width asymmetry.
      */}
      <header style={S.header}>

        {/* Left: Logo */}
        <div style={S.headerLeft}>
          <NavLink to={ROUTES.INITIATE} style={S.logoWrap}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
              <polygon points="11,2 20,18 2,18" fill="none" stroke="#21D4FD" strokeWidth="1.6" strokeLinejoin="round" />
              <polygon points="11,6 17,17 5,17" fill="rgba(33,212,253,0.13)" stroke="none" />
            </svg>
            <span style={S.logoText}>STRATFIT</span>
            <span style={S.logoSub}>INTELLIGENCE</span>
          </NavLink>
        </div>

        {/* Centre: Primary nav */}
        <nav style={S.nav} aria-label="Primary navigation">
          {LIVE_NAV.map((item) => {
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
                    layoutId="shell-nav-indicator"
                    style={S.activeBar}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Right: Utilities + optional page slot */}
        <div style={S.headerRight}>
          <span style={S.kbdHint} title="Command palette">
            <kbd style={S.kbd}>⌘</kbd><kbd style={S.kbd}>K</kbd>
          </span>
          <VoiceSettingsPanel />
          <TerrainShareButton />
          <ExportMenu kpis={exportKpis} />
          <ProfileSwitcher />
          {rightSlot}
        </div>

      </header>

      {/* ── Page body ─────────────────────────────────────────────────── */}
      <main style={{ ...S.body, overflow: bodyOverflow }}>
        {children}
      </main>

      {/* ── Legal footer ──────────────────────────────────────────────── */}
      <footer style={S.footer}>
        <Link to="/legal/terms"  style={S.footerLink}>Terms</Link>
        <span style={S.footerDot}>·</span>
        <Link to="/legal/privacy" style={S.footerLink}>Privacy</Link>
        <span style={S.footerDot}>·</span>
        <span style={S.footerMuted}>Probabilistic decision support only</span>
      </footer>

      <AppVersionFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Styles — locked colour system
   ───────────────────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    /* Cinematic background: base navy → deep navy → dark azure depth plane */
    background:
      "linear-gradient(180deg, #061326 0%, #081B33 55%, #0D2A49 78%, #0A101A 100%)",
    color: "#EAF4FF",
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: "hidden",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    height: 56,
    padding: "0 24px",
    /* Header glass: deep navy base with cinematic top-edge line */
    background:
      "linear-gradient(180deg, rgba(6,19,38,0.99) 0%, rgba(8,27,51,0.97) 100%)",
    borderBottom: "1px solid rgba(33,212,253,0.10)",
    boxShadow:
      "0 1px 0 rgba(33,212,253,0.04), 0 4px 32px rgba(0,0,0,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    flexShrink: 0,
    zIndex: 100,
    position: "relative" as const,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    flexShrink: 0,
  },

  logoText: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "0.20em",
    textTransform: "uppercase" as const,
    color: "#EAF4FF",
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  logoSub: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#9DB7D1",
    opacity: 0.55,
    paddingLeft: 2,
    alignSelf: "flex-end",
    paddingBottom: 1,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },

  link: {
    position: "relative" as const,
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(157,183,209,0.72)",
    textDecoration: "none",
    borderRadius: 5,
    transition: "color 0.15s, background 0.15s",
    whiteSpace: "nowrap" as const,
  },

  linkActive: {
    position: "relative" as const,
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#21D4FD",
    textDecoration: "none",
    borderRadius: 5,
    background: "rgba(33,212,253,0.08)",
    boxShadow: "inset 0 0 0 1px rgba(33,212,253,0.14)",
    transition: "color 0.15s, background 0.15s",
    whiteSpace: "nowrap" as const,
  },

  activeBar: {
    position: "absolute" as const,
    bottom: -1,
    left: "18%",
    right: "18%",
    height: 2,
    borderRadius: 1,
    background: "linear-gradient(90deg, #21D4FD, #4DEBFF)",
    boxShadow: "0 0 8px rgba(33,212,253,0.55)",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  kbdHint: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    opacity: 0.22,
    cursor: "default",
  },

  kbd: {
    padding: "2px 4px",
    borderRadius: 3,
    background: "rgba(157,183,209,0.04)",
    border: "1px solid rgba(157,183,209,0.08)",
    fontSize: 9,
    fontFamily: "ui-monospace, monospace",
    color: "rgba(157,183,209,0.45)",
    fontWeight: 500,
  },

  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 24px",
    borderTop: "1px solid rgba(33,212,253,0.05)",
    flexShrink: 0,
  },

  footerLink: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "rgba(33,212,253,0.35)",
    textDecoration: "none",
  },

  footerDot: {
    fontSize: 10,
    color: "rgba(157,183,209,0.15)",
  },

  footerMuted: {
    fontSize: 10,
    color: "rgba(157,183,209,0.20)",
    letterSpacing: "0.02em",
  },
}
