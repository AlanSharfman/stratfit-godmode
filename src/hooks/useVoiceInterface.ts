// src/hooks/useVoiceInterface.ts
// STRATFIT — Voice Mode Interface
// Uses OpenAI TTS (Nova voice) when API key is set, falls back to browser speech.

import { useEffect, useRef } from 'react';
import { useUIStore } from '../state/uiStore';
import { synthesizeSpeech, hasOpenAIKey } from '@/voice/openaiTTS';

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const priority = [
    "Google UK English Female",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Aria",
    "Samantha",
    "Karen",
    "Moira",
    "Tessa",
    "Microsoft Zira Desktop",
    "Microsoft Zira",
    "Google US English",
  ];
  for (const name of priority) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  const femaleGuess = voices.find((v) => /female/i.test(v.name));
  if (femaleGuess) return femaleGuess;
  return voices.find((v) =>
    v.lang.startsWith('en') &&
    !['david', 'daniel', 'mark', 'alex', 'fred', 'george', 'thomas'].some((m) =>
      v.name.toLowerCase().includes(m)
    )
  ) ?? null;
}

let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;
function startKeepAlive() {
  if (_keepAliveTimer) return;
  _keepAliveTimer = setInterval(() => {
    if (!window.speechSynthesis.speaking) { stopKeepAlive(); return; }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10_000);
}
function stopKeepAlive() {
  if (_keepAliveTimer) { clearInterval(_keepAliveTimer); _keepAliveTimer = null; }
}

let _currentAudio: HTMLAudioElement | null = null;

export const useVoiceInterface = (textToSpeak: string | null) => {
  const isVoiceEnabled = useUIStore((s) => s.isVoiceEnabled);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!textToSpeak || !isVoiceEnabled) {
      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
      window.speechSynthesis?.cancel();
      stopKeepAlive();
      lastSpokenRef.current = null;
      return;
    }

    if (textToSpeak === lastSpokenRef.current) return;

    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    window.speechSynthesis?.cancel();
    stopKeepAlive();
    lastSpokenRef.current = textToSpeak;

    if (hasOpenAIKey()) {
      synthesizeSpeech(textToSpeak, { voice: "nova", speed: 0.88 })
        .then((result) => {
          const audio = new Audio(result.url);
          _currentAudio = audio;
          audio.onended = () => { URL.revokeObjectURL(result.url); _currentAudio = null; };
          audio.play().catch(() => {});
        })
        .catch((err) => {
          console.warn("[useVoiceInterface] OpenAI TTS failed, falling back:", err);
          fallbackBrowserTTS(textToSpeak);
        });
    } else {
      const timer = setTimeout(() => fallbackBrowserTTS(textToSpeak), 80);
      return () => clearTimeout(timer);
    }
  }, [textToSpeak, isVoiceEnabled]);
};

function fallbackBrowserTTS(text: string) {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  utterance.pitch = 0.96;
  utterance.volume = 1.0;
  const chosen = pickVoice(voices);
  if (chosen) utterance.voice = chosen;
  utterance.onstart = () => startKeepAlive();
  utterance.onend = () => stopKeepAlive();
  utterance.onerror = () => stopKeepAlive();
  window.speechSynthesis.speak(utterance);
}

export const usePreloadVoices = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => { window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);
};

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};
