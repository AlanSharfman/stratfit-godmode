// src/components/command/director/useDirectorMode.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Director Mode Hook (Cinematic Intelligence Theatre)
//
// Controls playback of the scripted beat sequence.
// Emits currentBeat, elapsed time, and playback controls.
//
// Pure timer logic — no terrain, no simulation access.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from "react";
import type { Beat } from "./DirectorScript";
import { INTELLIGENCE_BRIEFING_SCRIPT } from "./DirectorScript";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type DirectorStatus = "idle" | "playing" | "paused" | "finished";

export interface DirectorState {
  /** Current playback status */
  status: DirectorStatus;
  /** Index of the current beat in the script */
  beatIndex: number;
  /** The active beat (null when idle) */
  currentBeat: Beat | null;
  /** Elapsed time within the current beat (ms) */
  beatElapsed: number;
  /** Progress within the current beat (0..1) */
  beatProgress: number;
  /** All beats that have been played (for transcript history) */
  playedBeats: Beat[];
  /** Total script duration (ms) */
  totalDuration: number;
  /** Elapsed across entire script (ms) */
  totalElapsed: number;
}

export interface DirectorControls {
  /** Start or resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Stop and reset to beginning */
  stop: () => void;
  /** Jump to a specific beat index */
  jumpTo: (index: number) => void;
}

// ────────────────────────────────────────────────────────────────────────────
// TICK INTERVAL
// ────────────────────────────────────────────────────────────────────────────

const TICK_MS = 50; // 20 fps update rate — smooth enough for UI, light on CPU

// ────────────────────────────────────────────────────────────────────────────
// HOOK
// ────────────────────────────────────────────────────────────────────────────

export function useDirectorMode(
  script: Beat[] = INTELLIGENCE_BRIEFING_SCRIPT,
): DirectorState & DirectorControls {
  const [status, setStatus] = useState<DirectorStatus>("idle");
  const [beatIndex, setBeatIndex] = useState(0);
  const [beatElapsed, setBeatElapsed] = useState(0);
  const [playedBeats, setPlayedBeats] = useState<Beat[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef(status);
  const beatIndexRef = useRef(beatIndex);
  const beatElapsedRef = useRef(beatElapsed);

  // Keep refs in sync
  statusRef.current = status;
  beatIndexRef.current = beatIndex;
  beatElapsedRef.current = beatElapsed;

  const totalDuration = script.reduce((sum, b) => sum + b.durationMs, 0);
  const currentBeat = status !== "idle" ? (script[beatIndex] ?? null) : null;
  const beatProgress =
    currentBeat && currentBeat.durationMs > 0
      ? Math.min(1, beatElapsed / currentBeat.durationMs)
      : 0;

  // Total elapsed across all beats
  const totalElapsed =
    script.slice(0, beatIndex).reduce((sum, b) => sum + b.durationMs, 0) +
    beatElapsed;

  // ── Cleanup interval on unmount ──
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Tick function (advances beats) ──
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (statusRef.current !== "playing") return;

      const newElapsed = beatElapsedRef.current + TICK_MS;
      const activeBeat = script[beatIndexRef.current];

      if (!activeBeat) {
        // Past end of script
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("finished");
        return;
      }

      if (newElapsed >= activeBeat.durationMs) {
        // Advance to next beat
        const nextIndex = beatIndexRef.current + 1;

        if (nextIndex >= script.length) {
          // Script complete
          setBeatElapsed(activeBeat.durationMs);
          setStatus("finished");
          setPlayedBeats((prev) => [...prev, activeBeat]);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        setPlayedBeats((prev) => [...prev, activeBeat]);
        setBeatIndex(nextIndex);
        beatIndexRef.current = nextIndex;
        setBeatElapsed(0);
        beatElapsedRef.current = 0;
      } else {
        setBeatElapsed(newElapsed);
        beatElapsedRef.current = newElapsed;
      }
    }, TICK_MS);
  }, [script]);

  // ── Controls ──
  const play = useCallback(() => {
    if (statusRef.current === "finished") {
      // Restart from beginning
      setBeatIndex(0);
      beatIndexRef.current = 0;
      setBeatElapsed(0);
      beatElapsedRef.current = 0;
      setPlayedBeats([]);
    }
    setStatus("playing");
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    setStatus("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const stop = useCallback(() => {
    setStatus("idle");
    setBeatIndex(0);
    beatIndexRef.current = 0;
    setBeatElapsed(0);
    beatElapsedRef.current = 0;
    setPlayedBeats([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(script.length - 1, index));
      setBeatIndex(clamped);
      beatIndexRef.current = clamped;
      setBeatElapsed(0);
      beatElapsedRef.current = 0;
      // Rebuild played beats
      setPlayedBeats(script.slice(0, clamped));
    },
    [script],
  );

  return {
    status,
    beatIndex,
    currentBeat,
    beatElapsed,
    beatProgress,
    playedBeats,
    totalDuration,
    totalElapsed,
    play,
    pause,
    stop,
    jumpTo,
  };
}
