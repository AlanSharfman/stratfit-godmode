export const RouteContract = {
    initialize: "/initiate",
    objectives: "/objectives",
    position: "/position",
    studio: "/studio",
    compare: "/scenarios",
    risk: "/risk",
    capital: "/capital",
    valuation: "/valuation",
    assessment: "/strategic-assessment",
} as const;

export type RouteKey = keyof typeof RouteContract;
