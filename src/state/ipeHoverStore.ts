import { create } from "zustand";

/** Which leverage peak index is currently hovered (-1 = none) */
export interface IpeHoverState {
    hoveredPeakIndex: number;
    setHoveredPeak: (index: number) => void;
    clearHover: () => void;
}

export const useIpeHoverStore = create<IpeHoverState>((set) => ({
    hoveredPeakIndex: -1,
    setHoveredPeak: (index) => set({ hoveredPeakIndex: index }),
    clearHover: () => set({ hoveredPeakIndex: -1 }),
}));
