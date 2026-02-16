export type DemoStep = {
    id: string;
    cameraTarget?: [number, number, number];
    message: string;
    durationMs: number;
};

export const BASELINE_DEMO_SCRIPT: DemoStep[] = [
    {
        id: "intro",
        message: "Structural Baseline: where you are right now (no intervention).",
        durationMs: 2800,
    },
    {
        id: "runway",
        message: "Runway compression begins here (6–9 months).",
        durationMs: 2800,
    },
    {
        id: "margin",
        message: "Margin volatility dominates this region of outcomes.",
        durationMs: 2800,
    },
    {
        id: "capital",
        message: "Capital dependency peaks here — survival becomes funding-sensitive.",
        durationMs: 2800,
    },
    {
        id: "close",
        message: "Next: apply strategy levers in Studio and compare survival bands.",
        durationMs: 2800,
    },
];
