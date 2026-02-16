export type StrategySnapshot = {
    id: string;
    name: string;
    timestamp: number;
    survival: number;
    runwayMonths: number;
    valuationBand?: { p10: number; p50: number; p90: number };
};

const snapshots: StrategySnapshot[] = [];

export function addSnapshot(s: StrategySnapshot) {
    snapshots.push(s);
}

export function getSnapshots() {
    return snapshots;
}
