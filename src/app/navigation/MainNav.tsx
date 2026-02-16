import { useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";
import { useActiveRoute } from "./useActiveRoute";

export default function MainNav() {
    const nav = useNavigate();
    const { activeKey } = useActiveRoute();

    return (
        <div
            style={{
                position: "fixed",
                top: 12,
                left: 12,
                zIndex: 50,
                display: "flex",
                gap: 8,
                padding: 6,
                borderRadius: 14,
                background: "rgba(7, 12, 18, 0.55)",
                border: "1px solid rgba(120, 200, 255, 0.14)",
                backdropFilter: "blur(10px)",
            }}
        >
            {NAV_ITEMS.map((item) => {
                const isActive = item.key === activeKey;
                return (
                    <button
                        key={item.key}
                        onClick={() => nav(item.path)}
                        style={{
                            cursor: "pointer",
                            padding: "7px 10px",
                            borderRadius: 12,
                            fontSize: 12,
                            letterSpacing: 0.2,
                            color: isActive ? "rgba(200, 245, 255, 0.95)" : "rgba(190, 205, 220, 0.78)",
                            background: isActive ? "rgba(34, 211, 238, 0.10)" : "rgba(255,255,255,0.03)",
                            border: isActive
                                ? "1px solid rgba(34, 211, 238, 0.35)"
                                : "1px solid rgba(120, 200, 255, 0.10)",
                            boxShadow: isActive ? "0 0 0 1px rgba(34, 211, 238, 0.12)" : "none",
                        }}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
