import { useFrame } from "@react-three/fiber";
import { usePlaybackStore } from "@/state/playbackStore";

/**
 * PlaybackController animates the playback progress over time.
 *
 * Architecture:
 * - Runs inside Canvas (useFrame)
 * - Does NOT render any geometry
 * - Updates progress store which other components can subscribe to
 * - Isolated from terrain rendering
 */
export default function PlaybackController() {
  const { progress, playing, speed, setProgress } = usePlaybackStore();

  useFrame((_, delta) => {
    if (!playing) return;

    // Base speed: 0.08 units per second, modified by speed multiplier
    const next = Math.min(progress + delta * 0.08 * speed, 1);
    setProgress(next);

    // Auto-stop at end
    if (next >= 1) {
      usePlaybackStore.getState().setPlaying(false);
    }
  });

  return null;
}
