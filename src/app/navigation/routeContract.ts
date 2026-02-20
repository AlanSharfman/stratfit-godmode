export const RouteContract = {
    initialize: "/initiate",
    position: "/position",
    objectives: "/objectives",
    studio: "/studio",
    compare: "/scenarios",
    risk: "/risk",
    capital: "/capital",
    valuation: "/valuation",
    assessment: "/strategic-assessment",
    roadmap: "/roadmap",
} as const;

export type RouteKey = keyof typeof RouteContract;
