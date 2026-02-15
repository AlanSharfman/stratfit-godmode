import { create } from "zustand";
import type { DiagEvent, DiagLevel } from "./diagTypes";

type State = {
    enabled: boolean;
    events: DiagEvent[];
    max: number;
};

type Actions = {
    setEnabled: (enabled: boolean) => void;
    log: (level: DiagLevel, topic: string, msg: string, data?: any) => void;
    clear: () => void;
};

export const useDiagnosticsStore = create<State & Actions>((set, get) => ({
    enabled: false,
    events: [],
    max: 200,

    setEnabled: (enabled) => set({ enabled }),

    log: (level, topic, msg, data) =>
        set((s) => {
            const next: DiagEvent = { ts: Date.now(), level, topic, msg, data };
            const arr = s.events.length >= s.max ? s.events.slice(1) : s.events.slice();
            arr.push(next);
            return { events: arr };
        }),

    clear: () => set({ events: [] })
}));

export function diag(level: DiagLevel, topic: string, msg: string, data?: any) {
    // Always record even when overlay disabled (flight recorder)
    useDiagnosticsStore.getState().log(level, topic, msg, data);
}
