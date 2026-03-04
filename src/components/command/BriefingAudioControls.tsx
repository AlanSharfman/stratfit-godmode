// src/components/command/BriefingAudioControls.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Briefing Audio Engine
//
// Primary: OpenAI TTS (nova voice) — warm, sweet, natural American female
// Fallback: Web Speech API when no API key is available
//
// Audio is synthesised per-section, cached for instant replay,
// and the next section is pre-fetched while the current one plays.
// ═══════════════════════════════════════════════════════════════════════════

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { hasOpenAIKey, synthesizeSpeech } from "../../voice/openaiTTS";

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

type AudioEngine = "openai" | "webspeech";
type PlaybackStatus = "ready" | "loading" | "playing" | "paused" | "error";

const INTER_SECTION_PAUSE_MS = 600; // Natural breath between sections

/** Build full narration text for a section */
function sectionText(section: { title: string; lines: string[] }): string {
  return `${section.title}. ${section.lines.join(" ")}`;
}

const BriefingAudioControls = forwardRef<BriefingAudioHandle, BriefingAudioControlsProps>(
  function BriefingAudioControls(
    { sections, onSectionChange, onPlay, onPause, onEnd, autoPlay = false },
    ref,
  ) {
    const [engine] = useState<AudioEngine>(() => {
      const hasKey = hasOpenAIKey();
      const selected: AudioEngine = hasKey ? "openai" : "webspeech";
      console.log(`[BriefingAudio] engine=${selected}, hasOpenAIKey=${hasKey}`);
      return selected;
    });
    const [status, setStatus] = useState<PlaybackStatus>("ready");
    const [currentSection, setCurrentSection] = useState(-1);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const stoppedRef = useRef(false);
    const autoPlayedRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cacheRef = useRef<Map<string, string>>(new Map());

    // ── Synthesise + cache a section (OpenAI TTS) ──
    const synthesizeSection = useCallback(
      async (section: { title: string; lines: string[] }): Promise<string> => {
        const text = sectionText(section);
        const cached = cacheRef.current.get(text);
        if (cached) return cached;

        const result = await synthesizeSpeech(text);
        cacheRef.current.set(text, result.url);
        return result.url;
      },
      [],
    );

    // ── OpenAI engine: play a single section (recursive chain) ──
    const playSectionOpenAI = useCallback(
      async (sectionIdx: number) => {
        if (stoppedRef.current || sectionIdx >= sections.length) {
          setStatus("ready");
          setCurrentSection(-1);
          audioRef.current = null;
          onEnd?.();
          return;
        }

        setCurrentSection(sectionIdx);
        onSectionChange?.(sectionIdx);
        setStatus("loading");

        // Synthesise current section
        let url: string;
        try {
          url = await synthesizeSection(sections[sectionIdx]);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "TTS synthesis failed";
          setStatus("error");
          setErrorMsg(msg);
          onEnd?.();
          return;
        }

        if (stoppedRef.current) return;

        // Pre-fetch next section while this one plays
        if (sectionIdx + 1 < sections.length) {
          synthesizeSection(sections[sectionIdx + 1]).catch(() => {});
        }

        // Play via HTMLAudioElement
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          if (stoppedRef.current) return;
          const nextIdx = sectionIdx + 1;
          if (nextIdx < sections.length) {
            pauseTimerRef.current = setTimeout(() => {
              if (!stoppedRef.current) playSectionOpenAI(nextIdx);
            }, INTER_SECTION_PAUSE_MS);
          } else {
            // All sections finished
            setStatus("ready");
            setCurrentSection(-1);
            audioRef.current = null;
            onEnd?.();
          }
        };

        audio.onerror = () => {
          if (stoppedRef.current) return;
          setStatus("error");
          setErrorMsg("Audio playback failed");
        };

        setStatus("playing");
        audio.play().catch(() => {
          setStatus("error");
          setErrorMsg("Browser blocked audio playback — click play again");
        });
      },
      [sections, onSectionChange, onEnd, synthesizeSection],
    );

    // ── Web Speech fallback: play a single section (recursive chain) ──
    const playSectionWebSpeech = useCallback(
      (sectionIdx: number) => {
        if (stoppedRef.current || sectionIdx >= sections.length) {
          setStatus("ready");
          setCurrentSection(-1);
          onEnd?.();
          return;
        }

        setCurrentSection(sectionIdx);
        onSectionChange?.(sectionIdx);
        setStatus("playing");

        const text = sectionText(sections[sectionIdx]);
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.92;
        utt.pitch = 1.08;

        // Best-effort voice selection
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) => /jenny|aria|samantha/i.test(v.name) && v.lang.startsWith("en"),
        );
        const english =
          preferred ??
          voices.find((v) => v.lang === "en-US") ??
          voices.find((v) => v.lang.startsWith("en"));
        if (english) utt.voice = english;

        utt.onend = () => {
          if (stoppedRef.current) return;
          pauseTimerRef.current = setTimeout(
            () => playSectionWebSpeech(sectionIdx + 1),
            INTER_SECTION_PAUSE_MS,
          );
        };

        utt.onerror = (ev) => {
          if (ev.error === "interrupted" || ev.error === "canceled") return;
          setStatus("error");
          setErrorMsg("Speech synthesis error");
        };

        window.speechSynthesis.speak(utt);
      },
      [sections, onSectionChange, onEnd],
    );

    // ── Transport controls ──
    const stop = useCallback(() => {
      stoppedRef.current = true;
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (engine === "webspeech" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setStatus("ready");
      setCurrentSection(-1);
      onEnd?.();
    }, [engine, onEnd]);

    const play = useCallback(() => {
      if (!sections.length) return;

      // Resume from pause — OpenAI
      if (status === "paused" && audioRef.current) {
        audioRef.current.play();
        setStatus("playing");
        onPlay?.();
        return;
      }

      // Resume from pause — Web Speech
      if (status === "paused" && engine === "webspeech" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        setStatus("playing");
        onPlay?.();
        return;
      }

      // Fresh start
      stoppedRef.current = false;
      setErrorMsg(null);
      onPlay?.();

      if (engine === "openai") {
        playSectionOpenAI(0);
      } else {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        playSectionWebSpeech(0);
      }
    }, [sections, status, engine, onPlay, playSectionOpenAI, playSectionWebSpeech]);

    const pause = useCallback(() => {
      if (engine === "openai" && audioRef.current) {
        audioRef.current.pause();
      } else if (engine === "webspeech" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setStatus("paused");
      onPause?.();
    }, [engine, onPause]);

    const isPlaying = status === "playing" || status === "loading";

    // Expose imperative handle for parent control
    useImperativeHandle(
      ref,
      () => ({ play, pause, stop, isPlaying }),
      [play, pause, stop, isPlaying],
    );

    // Auto-play when director starts
    useEffect(() => {
      if (autoPlay && !autoPlayedRef.current && sections.length > 0) {
        autoPlayedRef.current = true;
        play();
      }
      if (!autoPlay) autoPlayedRef.current = false;
    }, [autoPlay, sections.length, play]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stoppedRef.current = true;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        // Revoke cached object URLs
        cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
        cacheRef.current.clear();
      };
    }, []);

    // ── Status label ──
    const statusLabel = (() => {
      switch (status) {
        case "loading":
          return "synthesising…";
        case "playing":
          return `speaking ${currentSection >= 0 ? currentSection + 1 : ""}/${sections.length}`;
        case "paused":
          return "paused";
        case "error":
          return "error";
        default:
          return "ready";
      }
    })();

    return (
      <div className="flex flex-col gap-2 px-4 py-2.5 rounded-lg bg-slate-800/60 border border-cyan-900/30">
        {/* Transport controls + status */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={isPlaying ? pause : play}
            disabled={status === "loading"}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 transition-colors disabled:opacity-50"
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
            disabled={status === "ready"}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
            title="Stop"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="1" />
            </svg>
          </button>

          {/* Engine badge */}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-500 uppercase tracking-widest select-none">
            {engine === "openai" ? "nova" : "browser"}
          </span>

          {/* Status */}
          <span className="text-[10px] uppercase tracking-widest text-cyan-600/60 ml-auto select-none">
            {statusLabel}
          </span>
        </div>

        {/* Error message */}
        {status === "error" && errorMsg && (
          <p className="text-[10px] text-red-400/80 px-1">{errorMsg}</p>
        )}
      </div>
    );
  },
);

export default BriefingAudioControls;
