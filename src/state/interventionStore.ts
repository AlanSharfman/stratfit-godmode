import { create } from "zustand";
import type { InterventionSuggestion, InterventionCategory } from "@/types/simulation";

// ============================================================================
// AI INTERVENTION STORE
// ============================================================================

type InterventionFilters = {
  category?: InterventionCategory;
  minImpact?: "low" | "medium" | "high" | "critical";
  showDismissed?: boolean;
};

type InterventionStoreState = {
  // Suggestions
  suggestions: InterventionSuggestion[];
  selectedSuggestionId: string | null;
  hoveredSuggestionId: string | null;

  // Filters
  filters: InterventionFilters;
  sortBy: "priority" | "confidence" | "impact";

  // State
  isGenerating: boolean;
  lastGeneratedAt: string | null;

  // Actions
  setSuggestions: (suggestions: InterventionSuggestion[]) => void;
  addSuggestion: (suggestion: InterventionSuggestion) => void;
  removeSuggestion: (id: string) => void;
  setSelectedSuggestionId: (id: string | null) => void;
  setHoveredSuggestionId: (id: string | null) => void;
  setFilters: (filters: InterventionFilters) => void;
  setSortBy: (sortBy: "priority" | "confidence" | "impact") => void;
  setIsGenerating: (isGenerating: boolean) => void;
  dismissSuggestion: (id: string) => void;
  applySuggestion: (id: string) => void;
  clearSuggestions: () => void;
};

export const useInterventionStore = create<InterventionStoreState>((set) => ({
  suggestions: [],
  selectedSuggestionId: null,
  hoveredSuggestionId: null,
  filters: {},
  sortBy: "priority",
  isGenerating: false,
  lastGeneratedAt: null,

  setSuggestions: (suggestions) =>
    set({ suggestions, lastGeneratedAt: new Date().toISOString() }),

  addSuggestion: (suggestion) =>
    set((state) => ({
      suggestions: [...state.suggestions, suggestion],
    })),

  removeSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.id !== id),
    })),

  setSelectedSuggestionId: (id) => set({ selectedSuggestionId: id }),
  setHoveredSuggestionId: (id) => set({ hoveredSuggestionId: id }),
  setFilters: (filters) => set({ filters }),
  setSortBy: (sortBy) => set({ sortBy }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  dismissSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, status: "dismissed" as const } : s
      ),
    })),

  applySuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, status: "applied" as const } : s
      ),
    })),

  clearSuggestions: () =>
    set({ suggestions: [], selectedSuggestionId: null, lastGeneratedAt: null }),
}));
