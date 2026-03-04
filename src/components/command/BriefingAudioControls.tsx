// src/components/command/BriefingAudioControls.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — NASA-style briefing audio using Web Speech API
//
// Provides play/pause/stop, voice selector, speed control (0.9–1.05).
// Gracefully handles browsers without speechSynthesis.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

interface BriefingAudioControlsProps {
  /** Full briefing text to speak */
  text: string;
  /** Callback when speech starts playing */
  onPlay?: () => void;
  /** Callback when speech is paused */
  onPause?: () => void;
  /** Callback when speech finishes or is stopped */
  onEnd?: () => void;
  /** Estimated section boundaries (seconds) for highlight sync */
  onTimeUpdate?: (elapsedSec: number) => void;
}

const RATE_MIN = 0.9;
const RATE_MAX = 1.05;
const RATE_DEFAULT = 0.95;

export default function BriefingAudioControls({
  text,
  onPlay,
  onPause,
  onEnd,
}: BriefingAudioControlsProps) {
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(RATE_DEFAULT);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      // Prefer English voices, deprioritise novelty voices
      const english = available.filter((v) =>
        v.lang.startsWith("en"),
      );
      setVoices(english.length > 0 ? english : available);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    onEnd?.();
  }, [isSupported, onEnd]);

  const play = useCallback(() => {
    if (!isSupported || !text) return;

    // If paused, resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      onPlay?.();
      return;
    }

    // Cancel previous
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate;
    utt.pitch = 0.95;
    if (voices[selectedVoiceIdx]) {
      utt.voice = voices[selectedVoiceIdx];
    }

    utt.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      onEnd?.();
    };
    utt.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
    setIsPaused(false);
    onPlay?.();
  }, [isSupported, text, rate, voices, selectedVoiceIdx, isPaused, onPlay, onEnd]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    onPause?.();
  }, [isSupported, onPause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div className="px-3 py-2 text-xs text-slate-500 italic">
        Audio briefing unavailable — browser does not support speech synthesis.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/60 border border-cyan-900/30">
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 transition-colors"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <polygon points="2,0 14,7 2,14" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        disabled={!isPlaying && !isPaused}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
        title="Stop"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="1" width="10" height="10" rx="1" />
        </svg>
      </button>

      {/* Speed */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <label htmlFor="briefing-rate" className="select-none">
          Speed
        </label>
        <input
          id="briefing-rate"
          type="range"
          min={RATE_MIN}
          max={RATE_MAX}
          step={0.01}
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-16 accent-cyan-500"
        />
        <span className="w-8 text-right tabular-nums">{rate.toFixed(2)}</span>
      </div>

      {/* Voice selector (condensed) */}
      {voices.length > 1 && (
        <select
          value={selectedVoiceIdx}
          onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
          className="text-xs bg-slate-900/60 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 max-w-[120px]"
          title="Voice"
        >
          {voices.map((v, i) => (
            <option key={v.voiceURI} value={i}>
              {v.name.length > 18 ? v.name.slice(0, 18) + "…" : v.name}
            </option>
          ))}
        </select>
      )}

      {/* Status */}
      <span className="text-[10px] uppercase tracking-widest text-cyan-600/60 ml-auto select-none">
        {isPlaying ? "speaking" : isPaused ? "paused" : "ready"}
      </span>
    </div>
  );
}
