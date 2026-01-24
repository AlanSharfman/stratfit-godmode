// src/hooks/useVoiceInterface.ts
// STRATFIT — Voice Mode Interface
// "Her" Algorithm — Upbeat, Female, Natural voice synthesis
// Uses Web Speech API with instant interrupt for responsive feedback

import { useEffect, useRef } from 'react';
import { useUIStore } from '../state/uiStore';

export const useVoiceInterface = (textToSpeak: string | null) => {
  const isVoiceEnabled = useUIStore((s) => s.isVoiceEnabled);
  const lastSpokenRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if speech synthesis not available
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    
    const synth = window.speechSynthesis;
    
    // If no text or voice disabled, cancel any ongoing speech
    if (!textToSpeak || !isVoiceEnabled) {
      synth.cancel();
      lastSpokenRef.current = null;
      return;
    }
    
    // Don't repeat the same text
    if (textToSpeak === lastSpokenRef.current) {
      return;
    }
    
    // 1. CANCEL previous speech immediately (The "Interrupt" Protocol)
    synth.cancel();
    
    // Small delay to ensure cancel completes
    const speakTimeout = setTimeout(() => {
      // 2. CONFIGURE the voice
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // TUNING FOR "UPBEAT FEMALE" — The "Her" Profile
      utterance.rate = 1.1;   // Brisk and energetic (Standard is 1.0)
      utterance.pitch = 1.05; // Slightly higher/brighter (Standard is 1.0)
      utterance.volume = 1.0; // Full volume for clarity
      
      // 3. VOICE SELECTION (The "Her" Algorithm)
      // Prioritize specific high-quality female voices
      const voices = synth.getVoices();
      
      const preferredVoice = voices.find(v => 
        // Chrome's "Google US English" — Neural/AI voice, naturally female-sounding
        v.name === 'Google US English' || 
        // Windows high-quality female
        v.name.includes('Microsoft Zira') || 
        // Mac default female (excellent quality)
        v.name.includes('Samantha') || 
        // iOS/Mac high quality female
        v.name.includes('Victoria') ||
        // UK female voice
        v.name.includes('Google UK English Female') ||
        // Another Mac option
        v.name.includes('Karen') ||
        // General fallback — any voice with "female" in the name
        v.name.toLowerCase().includes('female')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else {
        // Secondary fallback: Try to find any English voice that's not "Male"
        const englishFemale = voices.find(v => 
          v.lang.startsWith('en') && 
          !v.name.toLowerCase().includes('male') &&
          !v.name.toLowerCase().includes('david') &&
          !v.name.toLowerCase().includes('daniel')
        );
        if (englishFemale) {
          utterance.voice = englishFemale;
        }
      }
      
      // 4. SPEAK
      synth.speak(utterance);
      lastSpokenRef.current = textToSpeak;
    }, 50);
    
    // Cleanup on unmount or change
    return () => {
      clearTimeout(speakTimeout);
      // Note: We don't cancel here to avoid cutting off mid-sentence
      // The cancel() at the start of the effect handles interrupts
    };
  }, [textToSpeak, isVoiceEnabled]);
};

// Hook to preload voices (call once on app init)
export const usePreloadVoices = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    
    // Voices may load async, trigger the load
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Log available voices for debugging
        console.log('🎙️ Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
      }
    };
    
    loadVoices();
    
    // Some browsers need this event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
};

// Utility to get all available voices (for debugging or future voice selector)
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};
