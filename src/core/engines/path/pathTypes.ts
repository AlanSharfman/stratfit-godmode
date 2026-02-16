// src/core/engines/path/pathTypes.ts
// STRATFIT — Path Engine Contract
// Phase 4 Path Engine Lock

export interface PathNode {
    id: string;
    time: number; // months
    x: number;
    y: number;
    probability: number;
}

export interface StrategicPath {
    id: string;
    label: string;
    nodes: PathNode[];
}

export interface PathEngineOutput {
    paths: StrategicPath[];
}
