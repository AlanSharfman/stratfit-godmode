// src/hooks/useVoiceInterface.ts
// STRATFIT — Voice Mode Interface
// NASA Documentary Profile — clear, crisp, awe-inspiring female voice
// Anti-jitter: Chrome speechSynthesis keepAlive + guarded cancellation

import { useEffect, useRef } from 'react';
import { useUIStore } from '../state/uiStore';

/**
 * Voice priority — NASA documentary female.
 * Google UK English Female is the gold standard on Chrome.
 * Samantha / Karen are the best macOS options.
 * Microsoft Aria is the best Windows neural voice.
 */
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const priority = [
    "Google UK English Female",   // Chrome — best clarity, natural female
    "Microsoft Aria Online (Natural) - English (United States)", // Edge neural
    "Microsoft Aria",
    "Samantha",                   // macOS — warm, authoritative
    "Karen",                      // macOS Australian — crisp and clean
    "Moira",                      // macOS Irish — rich tone
    "Tessa",                      // macOS South African — clear diction
    "Microsoft Zira Desktop",
    "Microsoft Zira",
    "Google US English",
  ];
  for (const name of priority) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  // Any voice with "female" in name
  const femaleGuess = voices.find((v) => /female/i.test(v.name));
  if (femaleGuess) return femaleGuess;
  // Any English voice that isn't a known male
  return voices.find((v) =>
    v.lang.startsWith('en') &&
    !['david', 'daniel', 'mark', 'alex', 'fred', 'george', 'thomas'].some((m) =>
      v.name.toLowerCase().includes(m)
    )
  ) ?? null;
}

// Chrome bug: speechSynthesis silently pauses after ~15 seconds.
// Fix: nudge it every 10s while speaking.
let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  if (_keepAliveTimer) return;
  _keepAliveTimer = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      stopKeepAlive();
      return;
    }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10_000);
}

function stopKeepAlive() {
  if (_keepAliveTimer) {
    clearInterval(_keepAliveTimer);
    _keepAliveTimer = null;
  }
}

export const useVoiceInterface = (textToSpeak: string | null) => {
  const isVoiceEnabled = useUIStore((s) => s.isVoiceEnabled);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    if (!textToSpeak || !isVoiceEnabled) {
      synth.cancel();
      stopKeepAlive();
      lastSpokenRef.current = null;
      return;
    }

    if (textToSpeak === lastSpokenRef.current) return;

    synth.cancel();
    stopKeepAlive();

    // 80ms buffer — ensures cancel() flushes before new utterance queues
    const timer = setTimeout(() => {
      const voices = synth.getVoices();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // ── NASA Documentary Female Profile ──────────────────────────────────
      // Slow, deliberate, measured — like narrating the cosmos
      utterance.rate   = 0.88;  // Unhurried, authoritative pacing
      utterance.pitch  = 0.96;  // Slightly below neutral — gravitas, not squeaky
      utterance.volume = 1.0;

      const chosen = pickVoice(voices);
      if (chosen) utterance.voice = chosen;

      utterance.onstart = () => startKeepAlive();
      utterance.onend   = () => stopKeepAlive();
      utterance.onerror = () => stopKeepAlive();

      synth.speak(utterance);
      lastSpokenRef.current = textToSpeak;
    }, 80);

    return () => clearTimeout(timer);
  }, [textToSpeak, isVoiceEnabled]);
};

// Hook to preload voices (call once on app init)
export const usePreloadVoices = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);
};

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};
