// src/core/engines/simulation/seed.ts
// STRATFIT — Deterministic Seed Generator
// Phase 5 Simulation Orchestration Lock

function fnv1a32(str: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function seedFromInputs(inputs: Record<string, unknown>) {
    return fnv1a32(JSON.stringify(inputs));
}
