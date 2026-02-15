import { create } from "zustand";

/**
 * Playback Store - Controls timeline animation for scenario playback.
 *
 * Architecture:
 * - Isolated from terrain/trajectory rendering
 * - Does not trigger terrain rerenders
 * - Progress is 0-1 normalized
 */
type PlaybackState = {
  progress: number; // 0 → 1
  playing: boolean;
  speed: number; // playback speed multiplier

  setProgress: (p: number) => void;
  setPlaying: (v: boolean) => void;
  setSpeed: (s: number) => void;
  reset: () => void;
};

export const usePlaybackStore = create<PlaybackState>((set) => ({
  progress: 0,
  playing: false,
  speed: 1,

  setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),
  setPlaying: (v) => set({ playing: v }),
  setSpeed: (s) => set({ speed: s }),
  reset: () => set({ progress: 0, playing: false }),
}));
