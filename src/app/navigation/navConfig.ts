import { RouteContract, type RouteKey } from "./routeContract";

export interface NavItem {
    key: RouteKey;
    label: string;
    path: string;
}

export const NAV_ITEMS: NavItem[] = [
    { key: "initialize", label: "Initiate", path: RouteContract.initialize },
    { key: "objectives", label: "Objectives", path: RouteContract.objectives },
    { key: "position", label: "Position", path: RouteContract.position },
    { key: "studio", label: "Studio", path: RouteContract.studio },
    { key: "compare", label: "Scenarios", path: RouteContract.compare },
    { key: "risk", label: "Risk", path: RouteContract.risk },
    { key: "capital", label: "Capital", path: RouteContract.capital },
    { key: "valuation", label: "Valuation", path: RouteContract.valuation },
    { key: "assessment", label: "Strategic Assessment", path: RouteContract.assessment },
];
