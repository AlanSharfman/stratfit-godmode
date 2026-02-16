// src/core/store/usePathStore.ts
// STRATFIT — Path Store
// Phase 4 Path Engine Lock

import { create } from "zustand";
import type { StrategicPath } from "@/core/engines/path/pathTypes";

interface PathStore {
    paths: StrategicPath[];
    setPaths: (paths: StrategicPath[]) => void;
}

export const usePathStore = create<PathStore>((set) => ({
    paths: [],
    setPaths: (paths) => set({ paths }),
}));
