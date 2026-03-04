// src/components/nav/PortalNav.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Portal Nav Bar (shared across pages without inline nav)
//
// Elevated horizontal nav bar rendered at the top of pages that
// don't have their own header nav (Decision, Risk, Valuation).
// Reads from ROUTES constant — no store access.
// ═══════════════════════════════════════════════════════════════════════════

import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/routeContract";

const NAV_ITEMS = [
  { to: ROUTES.INITIATE, label: "Initiate" },
  { to: ROUTES.POSITION, label: "Position" },
  { to: ROUTES.DECISION, label: "Decision" },
  { to: ROUTES.STUDIO, label: "Studio" },
  { to: ROUTES.COMPARE, label: "Compare" },
  { to: ROUTES.RISK, label: "Risk" },
  { to: ROUTES.VALUATION, label: "Valuation" },
  { to: ROUTES.COMMAND, label: "Command Centre" },
] as const;

const S: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    padding: "0 32px",
    height: 46,
    background: "linear-gradient(180deg, rgba(10, 18, 32, 0.95) 0%, rgba(6, 12, 24, 0.98) 100%)",
    borderBottom: "1px solid rgba(34, 211, 238, 0.12)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(34, 211, 238, 0.06)",
    flexShrink: 0,
    backdropFilter: "blur(12px)",
    position: "relative" as const,
    zIndex: 20,
  },
  link: {
    padding: "10px 18px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(255, 255, 255, 0.45)",
    textDecoration: "none",
    borderRadius: 4,
    transition: "color 0.2s, background 0.2s",
    whiteSpace: "nowrap" as const,
  },
  linkActive: {
    padding: "10px 18px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#22d3ee",
    textDecoration: "none",
    borderRadius: 4,
    background: "rgba(34, 211, 238, 0.1)",
    transition: "color 0.2s, background 0.2s",
    whiteSpace: "nowrap" as const,
  },
  divider: {
    width: 1,
    height: 18,
    background: "rgba(255, 255, 255, 0.1)",
    flexShrink: 0,
  },
};

export default function PortalNav() {
  return (
    <nav style={S.nav} aria-label="Portal navigation">
      {NAV_ITEMS.map((item, i) => (
        <span key={item.to} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <span style={S.divider} aria-hidden="true" />}
          <NavLink
            to={item.to}
            style={({ isActive }) => (isActive ? S.linkActive : S.link)}
          >
            {item.label}
          </NavLink>
        </span>
      ))}
    </nav>
  );
}
