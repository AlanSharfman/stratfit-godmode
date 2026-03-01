import { NavLink } from "react-router-dom";
import "./godmodeNav.css";

export default function GodModeNav() {
  return (
    <header className="gm-nav">
      <div className="gm-logo">
        <img src="/stratfit-logo.png" alt="STRATFIT" className="gm-logo-img" />
        <span className="gm-logo-text">STRATFIT</span>
      </div>

      <nav className="gm-links">
        <NavItem to="/position" label="POSITION" />
        <NavItem to="/studio" label="STUDIO" />
        <NavItem to="/compare" label="COMPARE" />
        <NavItem to="/assessment" label="ASSESSMENT" />
        <NavItem to="/roadmap" label="ROADMAP" />
      </nav>

      <div className="gm-right" />
    </header>
  );
}

function NavItem({ to, label }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "gm-link " + (isActive ? "active" : "")
      }
    >
      {label}
    </NavLink>
  );
}
