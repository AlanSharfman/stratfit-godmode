// src/onboard/baseline/index.ts
// Stable export surface for baseline mapping + storage (PASS 3B depends on this).

export type { BaselineV1 } from "./types";
export { mapOnboardDraftToBaseline } from "./map";
export { BASELINE_STORAGE_KEY, saveBaseline, loadBaseline, hasBaseline } from "./storage";


