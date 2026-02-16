// src/terrain/camera/demoScript.ts
// STRATFIT — Demo Script (Deterministic Keyframes)
// Phase 9 Cinematic Camera Lock

export interface CameraKeyframe {
    pos: [number, number, number];
    target: [number, number, number];
    fov: number;
    dwellMs: number;
}

export const DEMO_SCRIPT: CameraKeyframe[] = [
    {
        pos: [0, 38, 90],
        target: [0, 8, 0],
        fov: 45,
        dwellMs: 2800,
    },
    {
        pos: [-28, 26, 62],
        target: [-10, 10, 8],
        fov: 42,
        dwellMs: 2600,
    },
    {
        pos: [22, 22, 54],
        target: [10, 9, 12],
        fov: 40,
        dwellMs: 2600,
    },
    {
        pos: [0, 18, 48],
        target: [0, 10, 18],
        fov: 38,
        dwellMs: 2600,
    },
];
