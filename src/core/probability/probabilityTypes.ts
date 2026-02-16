export type ProbabilityBand = {
    p10: number;
    p50: number;
    p90: number;
};

export type ProbabilityMetric = {
    label: string;
    value: number;
    probability?: number; // 0–1
    band?: ProbabilityBand;
};
