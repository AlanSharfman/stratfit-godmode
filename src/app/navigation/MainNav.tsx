// src/app/navigation/MainNav.tsx
// STRATFIT — Main Navigation (Contract Locked)
// Nav Rewire Lock

import { NavLink } from "react-router-dom";
import { PRIMARY_NAV } from "./navConfig";
import { useActiveRoute } from "./useActiveRoute";

export default function MainNav() {
    const active = useActiveRoute();

    return (
        <nav className="mainNav" aria-label="Primary Navigation">
            {PRIMARY_NAV.map((item) => (
                <NavLink
                    key={item.key}
                    to={item.path}
                    className={`navItem ${active === item.key ? "active" : ""}`}
                >
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}
