// src/hooks/useTypewriter.ts
// GOD MODE — Typewriter Effect Hook
// Creates a cinematic text reveal effect for AI commentary

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // ms per character
  delay?: number; // initial delay before starting
  enabled?: boolean; // whether to start typing
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 20,
  delay = 0,
  enabled = true,
  onComplete,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  
  // Keep onComplete ref updated without triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Clear any existing timeouts
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    // Reset state
    setDisplayText('');
    setIsComplete(false);
    setIsTyping(false);
    indexRef.current = 0;

    // Don't start if not enabled or no text
    if (!enabled || !text) {
      return;
    }

    // Initial delay before starting
    startTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(true);
      
      const typeChar = () => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = window.setTimeout(typeChar, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      };

      typeChar();
    }, delay);

    return () => {
      if (startTimeoutRef.current) {
        window.clearTimeout(startTimeoutRef.current);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, enabled]);

  return { displayText, isTyping, isComplete };
}
