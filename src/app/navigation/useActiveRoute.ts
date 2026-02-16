import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "./navConfig";

export function useActiveRoute() {
    const location = useLocation();
    const active = NAV_ITEMS.find((x) => location.pathname.startsWith(x.path));
    return { activeKey: active?.key ?? "initialize", pathname: location.pathname };
}
