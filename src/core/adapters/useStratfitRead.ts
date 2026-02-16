// src/core/adapters/useStratfitRead.ts
// STRATFIT — Global Read Adapter
// Phase 2 Store Lock

import { useStratfitStore } from "../store/useStratfitStore";

export function useStratfitRead() {
    const state = useStratfitStore();
    return state;
}
