// src/core/adapters/studioWriteAdapter.ts
// STRATFIT — Studio Write Adapter
// Phase 2 Store Lock

import { useStratfitStore } from "../store/useStratfitStore";

export function writeStudioPosition(updates: {
    arr?: number;
    growthRate?: number;
    grossMargin?: number;
    burnMultiple?: number;
}) {
    const { setPosition } = useStratfitStore.getState();
    setPosition(updates);
}
