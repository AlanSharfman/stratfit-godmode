export type NormCoord = {
    // normalized simulation plane
    // x: time horizon 0..1
    // y: outcome gradient -1..+1
    // z: confidence elevation 0..1
    x: number;
    y: number;
    z: number;
};

export type WorldCoord = {
    x: number;
    y: number;
    z: number;
};

export type AnchorId = string;

export type Anchor = {
    id: AnchorId;
    norm: NormCoord;
    world: WorldCoord;
    priority: 1 | 2 | 3; // 1 critical, 2 secondary, 3 diagnostic
    label?: string;
    createdAt: number;
    updatedAt: number;
};

export type PathNode = {
    id: string;             // e.g. "p50_t0.5"
    percentile: 10 | 50 | 90;
    t: number;              // time 0..1
    coord: NormCoord;
    anchorId: AnchorId;     // MUST exist in registry
};

export type PathNetwork = {
    scenarioId: string;
    nodes: PathNode[];
};
