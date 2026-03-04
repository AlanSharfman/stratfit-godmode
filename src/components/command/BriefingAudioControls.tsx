// src/components/command/BriefingAudioControls.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Warm American Narrator Voice Engine
//
// Soft, sweet, conversational American female voice — like a warm,
// curious 30-year-old woman genuinely in awe of what the data reveals.
// Not formal or stiff. Engaging, pleasant, flowing naturally.
// Sentence-level chunking + breathing pauses for human rhythm.
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
const RATE_MAX = 1.05;
const RATE_DEFAULT = 0.92; // Natural conversational pace — not too slow, not rushed
const PITCH_DEFAULT = 1.08; // Warm, youthful female register — sweet, not robotic
const INTER_SECTION_PAUSE_MS = 600; // Natural breath between sections
const INTER_SENTENCE_PAUSE_MS = 140; // Quick micro-pause — conversational, not ponderous
const CHROME_KEEPALIVE_MS = 5000; // Prevent Chrome from killing long utterances

// ── Preferred voices (ranked best → fallback) ──
// Prioritises soft, warm AMERICAN female voices. The goal is a sweet,
// engaging 30-year-old American woman — curious and in awe, not a stiff
// British newsreader. Neural/online voices first (much smoother).
const PREFERRED_VOICE_PATTERNS: Array<{ pattern: RegExp; boost: number }> = [
  // === Tier 1: Neural American female — best available ===
  { pattern: /\bMicrosoft\s+Jenny\b/i,                   boost: 2000 }, // Edge: Jenny — warm American neural
  { pattern: /\bMicrosoft\s+Aria\b/i,                    boost: 1950 }, // Edge: Aria — American neural
  { pattern: /\bMicrosoft\s+Ana\b/i,                     boost: 1900 }, // Edge: Ana — young American
  { pattern: /\bMicrosoft\s+Michelle\b/i,                boost: 1850 }, // Edge: Michelle
  // === Tier 2: Google American ===
  { pattern: /\bGoogle\s+US\s+English\b/i,               boost: 1600 }, // Chrome: US English female
  // === Tier 3: macOS American ===
  { pattern: /\bSamantha\b/i,                            boost: 1500 }, // macOS: Samantha — iconic US voice
  { pattern: /\bAllison\b/i,                             boost: 1450 }, // macOS: Allison — American
  { pattern: /\bAva\b/i,                                 boost: 1400 }, // macOS: Ava — American
  { pattern: /\bSusan\b/i,                               boost: 1350 }, // macOS: Susan — American
  { pattern: /\bVictoria\b/i,                            boost: 1300 }, // macOS: Victoria
  // === Tier 4: Windows SAPI American fallback ===
  { pattern: /\bMicrosoft\s+Zira\b/i,                    boost: 1000 }, // Windows: Zira — US female
  // === Tier 5: Other English female (less preferred) ===
  { pattern: /\bGoogle\s+UK\s+English\s+Female\b/i,      boost: 500 },  // Chrome UK — too formal
  { pattern: /\bfemale\b/i,                              boost: 300 },  // Generic female keyword
];

/** Score a voice — higher = better match for warm American female narrator */
function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  const name = v.name;

  // Check against preference list
  for (const { pattern, boost } of PREFERRED_VOICE_PATTERNS) {
    if (pattern.test(name)) {
      score = Math.max(score, boost);
    }
  }

  // American English gets a significant locale bonus
  if (v.lang === "en-US") score += 100;
  else if (v.lang.startsWith("en")) score += 10;

  // "Online" / "Neural" tag in name = much smoother
  if (/online|neural/i.test(name)) score += 200;

  return score;
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
