export type ProjectionInput = {
    // placeholder until Phase 4/5
    confidenceIntervalWidth: number;
};

export type ProjectionOutput = {
    stable: boolean;
    confidenceIntervalWidth: number;
};

export function project(input: ProjectionInput): ProjectionOutput {
    return {
        stable: input.confidenceIntervalWidth <= 0.08,
        confidenceIntervalWidth: input.confidenceIntervalWidth
    };
}
