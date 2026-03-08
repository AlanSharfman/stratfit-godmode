import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/routeContract";

const NAV_ITEMS = [
  { to: ROUTES.INITIATE, label: "Initiate" },
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
] as const;

const S: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    padding: "0 24px",
    height: 46,
    background: "linear-gradient(180deg, rgba(10, 18, 32, 0.95) 0%, rgba(6, 12, 24, 0.98) 100%)",
    borderBottom: "1px solid rgba(34, 211, 238, 0.12)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(34, 211, 238, 0.06)",
    flexShrink: 0,
    backdropFilter: "blur(12px)",
    position: "relative" as const,
    zIndex: 20,
    overflowX: "auto" as const,
  },
  link: {
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(255, 255, 255, 0.4)",
    textDecoration: "none",
    borderRadius: 4,
    transition: "color 0.2s, background 0.2s",
    whiteSpace: "nowrap" as const,
  },
  linkActive: {
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
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
    height: 16,
    background: "rgba(255, 255, 255, 0.08)",
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
