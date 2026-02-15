import { create } from "zustand";
import type { Anchor, AnchorId, NormCoord } from "./types";
import { clampNorm, normToWorld } from "./SpatialProjector";
import { diag } from "@/diagnostics/DiagnosticsStore";

type State = {
    anchors: Record<AnchorId, Anchor>;
};

type Actions = {
    upsertAnchor: (id: AnchorId, norm: NormCoord, priority: Anchor["priority"], label?: string) => void;
    removeAnchor: (id: AnchorId) => void;
    getAnchor: (id: AnchorId) => Anchor | null;
    clearAll: () => void;
};

export const useAnchorRegistry = create<State & Actions>((set, get) => ({
    anchors: {},

    upsertAnchor: (id, norm, priority, label) => {
        const now = Date.now();
        const n = clampNorm(norm);
        const world = normToWorld(n);

        set((s) => {
            const prev = s.anchors[id];
            const next: Anchor = {
                id,
                norm: n,
                world,
                priority,
                label: label ?? prev?.label,
                createdAt: prev?.createdAt ?? now,
                updatedAt: now
            };

            diag("info", "anchor:upsert", id, { norm: n, world, priority, label: next.label });
            return { anchors: { ...s.anchors, [id]: next } };
        });
    },

    removeAnchor: (id) => {
        set((s) => {
            if (!s.anchors[id]) return s;
            const copy = { ...s.anchors };
            delete copy[id];
            diag("warn", "anchor:remove", id);
            return { anchors: copy };
        });
    },

    getAnchor: (id) => {
        return get().anchors[id] ?? null;
    },

    clearAll: () => {
        diag("warn", "anchor:clear", "all");
        set({ anchors: {} });
    }
}));
