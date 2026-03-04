// src/components/command/BriefingAudioControls.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — NASA Documentary Voice Engine
//
// Smooth, flowing female narration — like a NASA documentary narrator
// in awe of the universe. Sentence-level chunking prevents the Chrome
// 15-second cutoff. Inter-section breathing pauses give natural rhythm.
// Smart voice auto-selection prefers known high-quality female voices.
// ═══════════════════════════════════════════════════════════════════════════

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface BriefingAudioHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
}

interface BriefingAudioControlsProps {
  /** Sections to speak sequentially */
  sections: Array<{ title: string; lines: string[] }>;
  /** Called when a new section starts speaking */
  onSectionChange?: (sectionIdx: number) => void;
  /** Callback when speech starts playing */
  onPlay?: () => void;
  /** Callback when speech is paused */
  onPause?: () => void;
  /** Callback when all sections finish or stopped */
  onEnd?: () => void;
  /** When true, automatically start speaking */
  autoPlay?: boolean;
}

// ── Voice tuning constants ──
const RATE_MIN = 0.82;
const RATE_MAX = 1.0;
const RATE_DEFAULT = 0.88; // Slow, deliberate — documentary pacing
const PITCH_DEFAULT = 1.02; // Slightly elevated — warm female register
const INTER_SECTION_PAUSE_MS = 750; // Breathing room between sections
const INTER_SENTENCE_PAUSE_MS = 180; // Micro-pause between sentences for flow
const CHROME_KEEPALIVE_MS = 5000; // Prevent Chrome from killing long utterances

// ── Preferred voices (ranked best → fallback) ──
// These are known high-quality, smooth female voices across browsers.
const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /\bMicrosoft\s+(?:Jenny|Aria)\b/i,       // Edge: Jenny/Aria — neural, very smooth
  /\bGoogle\s+UK\s+English\s+Female\b/i,    // Chrome: warm UK female
  /\bGoogle\s+US\s+English\b/i,             // Chrome: US female (shared name)
  /\bSamantha\b/i,                           // macOS/Safari: Samantha — iconic smooth
  /\bKaren\b/i,                              // macOS: Karen (AU English)
  /\bFiona\b/i,                              // macOS: Fiona (UK English)
  /\bMoira\b/i,                              // macOS: Moira (Irish English)
  /\bVictoria\b/i,                           // macOS: Victoria
  /\bMicrosoft\s+Zira\b/i,                   // Windows: Zira — soft female
  /\bMicrosoft\s+Hazel\b/i,                  // Windows: Hazel (UK)
  /\bMicrosoft\s+Susan\b/i,                  // Windows: Susan (UK)
  /\bfemale\b/i,                             // Generic female keyword match
];

/** Score a voice by how well it matches our NASA narrator preference */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name;
  // Rank by position in preference list (lower index = higher score)
  for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i++) {
    if (PREFERRED_VOICE_PATTERNS[i].test(name)) return 1000 - i;
  }
  // Prefer en-GB / en-US over others
  if (v.lang === "en-GB") return 50;
  if (v.lang === "en-US") return 40;
  if (v.lang.startsWith("en")) return 20;
  return 0;
}

/** Split text into sentences for smooth chunked delivery */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  const raw = text.match(/[^.!?]*[.!?]+[\s]*/g) ?? [text];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

const BriefingAudioControls = forwardRef<BriefingAudioHandle, BriefingAudioControlsProps>(
  function BriefingAudioControls(
    { sections, onSectionChange, onPlay, onPause, onEnd, autoPlay = false },
    ref,
  ) {
    const [isSupported] = useState(
      () => typeof window !== "undefined" && "speechSynthesis" in window,
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(RATE_DEFAULT);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
    const [currentSection, setCurrentSection] = useState(-1);

    const stoppedRef = useRef(false);
    const autoPlayedRef = useRef(false);
    const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Load voices with smart auto-selection ──
    useEffect(() => {
      if (!isSupported) return;
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        const english = available.filter((v) => v.lang.startsWith("en"));
        const pool = english.length > 0 ? english : available;

        // Sort by our preference scoring
        const sorted = [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a));
        setVoices(sorted);

        // Auto-select best match (index 0 after sort)
        setSelectedVoiceIdx(0);
      };
      loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }, [isSupported]);

    // ── Chrome keepalive: prevent synthesis from dying on long utterances ──
    const startKeepAlive = useCallback(() => {
      stopKeepAlive();
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, CHROME_KEEPALIVE_MS);
    }, []);

    const stopKeepAlive = useCallback(() => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    }, []);

    // ── Core: speak a single section sentence-by-sentence ──
    const speakSection = useCallback(
      (sectionIdx: number) => {
        if (!isSupported || stoppedRef.current || sectionIdx >= sections.length) {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentSection(-1);
          stopKeepAlive();
          onEnd?.();
          return;
        }

        const section = sections[sectionIdx];
        setCurrentSection(sectionIdx);
        onSectionChange?.(sectionIdx);

        // Build sentence queue: title as intro sentence + body sentences
        const titleSentence = section.title + ".";
        const bodySentences = splitSentences(section.lines.join(" "));
        const sentenceQueue = [titleSentence, ...bodySentences];

        let sentenceIdx = 0;

        const speakNextSentence = () => {
          if (stoppedRef.current) return;

          if (sentenceIdx >= sentenceQueue.length) {
            // Section complete — pause before next section for natural breathing
            const nextSection = sectionIdx + 1;
            if (nextSection < sections.length) {
              pauseTimerRef.current = setTimeout(() => {
                if (!stoppedRef.current) speakSection(nextSection);
              }, INTER_SECTION_PAUSE_MS);
            } else {
              // All sections done
              setIsPlaying(false);
              setIsPaused(false);
              setCurrentSection(-1);
              stopKeepAlive();
              onEnd?.();
            }
            return;
          }

          const text = sentenceQueue[sentenceIdx];
          const utt = new SpeechSynthesisUtterance(text);
          utt.rate = rate;
          utt.pitch = PITCH_DEFAULT;
          utt.volume = 1.0;

          if (voices[selectedVoiceIdx]) {
            utt.voice = voices[selectedVoiceIdx];
          }

          utt.onend = () => {
            if (stoppedRef.current) return;
            sentenceIdx++;
            // Micro-pause between sentences for flowing rhythm
            if (sentenceIdx < sentenceQueue.length) {
              pauseTimerRef.current = setTimeout(speakNextSentence, INTER_SENTENCE_PAUSE_MS);
            } else {
              speakNextSentence(); // triggers section transition
            }
          };

          utt.onerror = (ev) => {
            // "interrupted" is normal when stop() is called
            if (ev.error === "interrupted" || ev.error === "canceled") return;
            setIsPlaying(false);
            setIsPaused(false);
            stopKeepAlive();
          };

          window.speechSynthesis.speak(utt);
        };

        speakNextSentence();
      },
      [isSupported, sections, rate, voices, selectedVoiceIdx, onSectionChange, onEnd, stopKeepAlive],
    );

    const stop = useCallback(() => {
      if (!isSupported) return;
      stoppedRef.current = true;
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      window.speechSynthesis.cancel();
      stopKeepAlive();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSection(-1);
      onEnd?.();
    }, [isSupported, onEnd, stopKeepAlive]);

    const play = useCallback(() => {
      if (!isSupported || !sections.length) return;

      // Resume from pause
      if (isPaused) {
        window.speechSynthesis.resume();
        startKeepAlive();
        setIsPaused(false);
        setIsPlaying(true);
        onPlay?.();
        return;
      }

      // Fresh start
      window.speechSynthesis.cancel();
      stoppedRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);
      startKeepAlive();
      onPlay?.();
      speakSection(0);
    }, [isSupported, sections, isPaused, onPlay, speakSection, startKeepAlive]);

    const pause = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.pause();
      stopKeepAlive();
      setIsPaused(true);
      setIsPlaying(false);
      onPause?.();
    }, [isSupported, onPause, stopKeepAlive]);

    // Expose imperative handle for parent control
    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        stop,
        isPlaying,
      }),
      [play, pause, stop, isPlaying],
    );

    // Auto-play when director starts
    useEffect(() => {
      if (autoPlay && !autoPlayedRef.current && isSupported && sections.length > 0) {
        autoPlayedRef.current = true;
        play();
      }
      if (!autoPlay) {
        autoPlayedRef.current = false;
      }
    }, [autoPlay, isSupported, sections.length, play]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (isSupported) window.speechSynthesis.cancel();
        stopKeepAlive();
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      };
    }, [isSupported, stopKeepAlive]);

    if (!isSupported) {
      return (
        <div className="px-3 py-2 text-xs text-slate-500 italic">
          Audio unavailable — browser does not support speech synthesis.
        </div>
      );
    }

    const activeVoiceName = voices[selectedVoiceIdx]?.name ?? "—";

    return (
      <div className="flex flex-col gap-2 px-4 py-2.5 rounded-lg bg-slate-800/60 border border-cyan-900/30">
        {/* Row 1: Transport controls + status */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={isPlaying ? pause : play}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 transition-colors"
            title={isPlaying ? "Pause" : "Play voice"}
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
              Pace
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
            <span className="w-8 text-right tabular-nums text-[10px]">{rate.toFixed(2)}×</span>
          </div>

          {/* Status */}
          <span className="text-[10px] uppercase tracking-widest text-cyan-600/60 ml-auto select-none">
            {isPlaying
              ? `speaking ${currentSection >= 0 ? currentSection + 1 : ""}/${sections.length}`
              : isPaused
                ? "paused"
                : "ready"}
          </span>
        </div>

        {/* Row 2: Voice selector + active voice name */}
        <div className="flex items-center gap-2">
          {voices.length > 1 && (
            <select
              value={selectedVoiceIdx}
              onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
              className="text-[11px] bg-slate-900/60 border border-slate-700/60 text-slate-300 rounded px-1.5 py-0.5 max-w-[180px] flex-1"
              title="Narrator voice"
            >
              {voices.map((v, i) => (
                <option key={v.voiceURI} value={i}>
                  {v.name.length > 28 ? v.name.slice(0, 28) + "…" : v.name}
                </option>
              ))}
            </select>
          )}
          <span className="text-[9px] text-slate-600 truncate select-none" title={activeVoiceName}>
            {activeVoiceName}
          </span>
        </div>
      </div>
    );
  },
);

export default BriefingAudioControls;
