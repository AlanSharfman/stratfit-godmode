import { useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";
import { useActiveRoute } from "./useActiveRoute";
import type { RouteKey } from "./routeContract";
import "./MainNav.css";

/**
 * Visual groups per STRATFIT_NAV_UX_SPEC v2:
 *   SETUP      → Initiate
 *   UNDERSTAND  → Position, Objectives
 *   EXPLORE    → Studio, Scenarios
 *   ANALYZE    → Risk, Capital, Valuation
 *   DECIDE     → Assessment, Roadmap
 */
const NAV_GROUPS: RouteKey[][] = [
    ["initialize"],
    ["position", "objectives"],
    ["studio", "compare"],
    ["risk", "capital", "valuation"],
    ["assessment", "roadmap"],
];

export default function MainNav() {
    const nav = useNavigate();
    const { activeKey } = useActiveRoute();

    // Index NAV_ITEMS by key for O(1) lookup
    const itemMap = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, i]));

    return (
        <nav className="mainNav" aria-label="Primary navigation">
            {NAV_GROUPS.map((group, gi) => (
                <div key={gi} className="navGroup">
                    {group.map((key) => {
                        const item = itemMap[key];
                        if (!item) return null;
                        const isActive = key === activeKey;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => nav(item.path)}
                                className={`navItem${isActive ? " active" : ""}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}
