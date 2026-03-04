// src/components/nav/PortalNav.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Portal Nav Bar (shared across pages without inline nav)
//
// Minimal horizontal nav bar rendered at the top of pages that
// don't have their own header nav (Decision, Risk, Valuation).
// Reads from ROUTES constant — no store access.
// ═══════════════════════════════════════════════════════════════════════════

import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/routeContract";

const NAV_ITEMS = [
  { to: ROUTES.INITIATE, label: "Initiate" },
  { to: ROUTES.DECISION, label: "Decision" },
  { to: ROUTES.POSITION, label: "Position" },
  { to: ROUTES.STUDIO, label: "Studio" },
  { to: ROUTES.COMPARE, label: "Compare" },
  { to: ROUTES.RISK, label: "Risk" },
  { to: ROUTES.VALUATION, label: "Valuation" },
] as const;

const S: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "0 24px",
    height: 40,
    background: "rgba(0, 0, 0, 0.25)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    flexShrink: 0,
  },
  link: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(255, 255, 255, 0.45)",
    textDecoration: "none",
    borderRadius: 4,
    transition: "color 0.15s, background 0.15s",
  },
  linkActive: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "#22d3ee",
    textDecoration: "none",
    borderRadius: 4,
    background: "rgba(34, 211, 238, 0.08)",
    transition: "color 0.15s, background 0.15s",
  },
};

export default function PortalNav() {
  return (
    <nav style={S.nav} aria-label="Portal navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => (isActive ? S.linkActive : S.link)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
