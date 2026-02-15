import type { NormCoord, WorldCoord } from "./types";

// Canonical mapping from normalized sim-plane to world space.
// This is deterministic and later will align to real terrain extents.
// For Phase 4 we use stable constants.
const WORLD = {
    X_MIN: -220,
    X_MAX: 220,
    Y_MIN: -140,
    Y_MAX: 140,
    Z_MIN: 0,
    Z_MAX: 120
};

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
}

export function normToWorld(n: NormCoord): WorldCoord {
    const x01 = clamp(n.x, 0, 1);
    const y11 = clamp(n.y, -1, 1);
    const z01 = clamp(n.z, 0, 1);

    const x = WORLD.X_MIN + (WORLD.X_MAX - WORLD.X_MIN) * x01;
    const y = WORLD.Y_MIN + (WORLD.Y_MAX - WORLD.Y_MIN) * ((y11 + 1) / 2);
    const z = WORLD.Z_MIN + (WORLD.Z_MAX - WORLD.Z_MIN) * z01;

    return { x, y, z };
}

export function worldToNorm(w: WorldCoord): NormCoord {
    const x01 = (w.x - WORLD.X_MIN) / (WORLD.X_MAX - WORLD.X_MIN);
    const y01 = (w.y - WORLD.Y_MIN) / (WORLD.Y_MAX - WORLD.Y_MIN);
    const z01 = (w.z - WORLD.Z_MIN) / (WORLD.Z_MAX - WORLD.Z_MIN);

    return {
        x: clamp(x01, 0, 1),
        y: clamp(y01 * 2 - 1, -1, 1),
        z: clamp(z01, 0, 1)
    };
}

export function clampNorm(n: NormCoord): NormCoord {
    return {
        x: clamp(n.x, 0, 1),
        y: clamp(n.y, -1, 1),
        z: clamp(n.z, 0, 1)
    };
}
