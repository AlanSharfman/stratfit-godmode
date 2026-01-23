// src/hooks/useTypewriter.ts
// GOD MODE — Typewriter Effect Hook
// Creates a cinematic text reveal effect for AI commentary

import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // ms per character
  delay?: number; // initial delay before starting
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 20,
  delay = 0,
  onComplete,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setIsComplete(false);
    setIsTyping(false);
    indexRef.current = 0;

    if (!text) return;

    // Initial delay
    const startTimeout = window.setTimeout(() => {
      setIsTyping(true);
      
      const typeChar = () => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = window.setTimeout(typeChar, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
          onComplete?.();
        }
      };

      typeChar();
    }, delay);

    return () => {
      window.clearTimeout(startTimeout);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete]);

  return { displayText, isTyping, isComplete };
}

// Utility to skip to end
export function useTypewriterWithSkip(options: UseTypewriterOptions) {
  const [skipped, setSkipped] = useState(false);
  const result = useTypewriter({
    ...options,
    text: skipped ? options.text : options.text,
  });

  const skip = () => {
    setSkipped(true);
  };

  return {
    ...result,
    displayText: skipped ? options.text : result.displayText,
    isComplete: skipped || result.isComplete,
    skip,
  };
}

