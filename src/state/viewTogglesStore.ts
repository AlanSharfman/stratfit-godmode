// src/state/viewTogglesStore.ts
// STRATFIT — Global View Toggles (Timeline, Heatmap)

import { create } from 'zustand';

type TabId = 'terrain' | 'simulate' | 'compare' | 'tradeoffs';

interface ViewTogglesState {
  // Toggle states
  timelineEnabled: boolean;
  heatmapEnabled: boolean;
  
  // Current tab (for context-aware behavior)
  currentTab: TabId;
  
  // Actions
  toggleTimeline: () => void;
  toggleHeatmap: () => void;
  setCurrentTab: (tab: TabId) => void;
  
  // Helpers
  isTimelineAvailable: () => boolean;
  isHeatmapAvailable: () => boolean;
}

// Timeline works in: TERRAIN, SIMULATE, COMPARE
const TIMELINE_TABS: TabId[] = ['terrain', 'simulate', 'compare'];

// Heatmap works in: TERRAIN, COMPARE, TRADEOFFS
const HEATMAP_TABS: TabId[] = ['terrain', 'compare', 'tradeoffs'];

export const useViewTogglesStore = create<ViewTogglesState>((set, get) => ({
  timelineEnabled: false,
  heatmapEnabled: false,
  currentTab: 'terrain',
  
  toggleTimeline: () => set({ timelineEnabled: !get().timelineEnabled }),
  toggleHeatmap: () => set({ heatmapEnabled: !get().heatmapEnabled }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  isTimelineAvailable: () => TIMELINE_TABS.includes(get().currentTab),
  isHeatmapAvailable: () => HEATMAP_TABS.includes(get().currentTab),
}));

// Convenience selectors
export const useTimelineEnabled = () => {
  const { timelineEnabled, currentTab } = useViewTogglesStore();
  return timelineEnabled && TIMELINE_TABS.includes(currentTab);
};

export const useHeatmapEnabled = () => {
  const { heatmapEnabled, currentTab } = useViewTogglesStore();
  return heatmapEnabled && HEATMAP_TABS.includes(currentTab);
};

export const useCurrentTab = () => useViewTogglesStore((s) => s.currentTab);

export default useViewTogglesStore;
