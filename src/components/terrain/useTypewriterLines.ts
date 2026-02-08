// src/components/terrain/useTypewriterLines.ts
// STRATFIT — Typewriter animation hook for Considerations panel
// Speed: 18–25ms per char · Stagger: 250ms per line · Total under ~3.5s
// Only retype when snapshotKey changes. Not on every render.

import { useState, useEffect, useRef, useCallback } from "react";

interface TypewriterOptions {
  /** Milliseconds per character (default 20) */
  charSpeed?: number;
  /** Milliseconds stagger between lines (default 250) */
  lineStagger?: number;
  /** Whether typewriter is enabled (skip animation if false) */
  enabled?: boolean;
}

/**
 * Returns an array of partially-typed strings that animate in sequentially.
 * Lines only retype when `snapshotKey` changes — never on re-render.
 */
export function useTypewriterLines(
  lines: string[],
  snapshotKey: string,
  options: TypewriterOptions = {}
): string[] {
  const { charSpeed = 20, lineStagger = 250, enabled = true } = options;

  const [displayed, setDisplayed] = useState<string[]>(() =>
    enabled ? lines.map(() => "") : [...lines]
  );
  const rafRef = useRef<number | null>(null);
  const prevKeyRef = useRef<string>(snapshotKey);

  const animate = useCallback(() => {
    if (!enabled) {
      setDisplayed([...lines]);
      return;
    }

    // Track animation state
    let lineIdx = 0;
    let charIdx = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    const current = lines.map(() => "");
    let staggerRemaining = 0;

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      elapsed += dt;

      if (lineIdx >= lines.length) {
        // Done
        setDisplayed([...lines]);
        return;
      }

      if (staggerRemaining > 0) {
        staggerRemaining -= dt;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Type characters for current line
      const charsToType = Math.max(1, Math.floor(dt / charSpeed));
      for (let c = 0; c < charsToType && lineIdx < lines.length; c++) {
        if (charIdx < lines[lineIdx].length) {
          charIdx++;
          current[lineIdx] = lines[lineIdx].slice(0, charIdx);
        } else {
          // Line complete — move to next with stagger
          lineIdx++;
          charIdx = 0;
          staggerRemaining = lineStagger;
          break;
        }
      }

      setDisplayed([...current]);

      if (lineIdx < lines.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [lines, charSpeed, lineStagger, enabled]);

  useEffect(() => {
    // Only retype when snapshotKey changes
    if (prevKeyRef.current !== snapshotKey) {
      prevKeyRef.current = snapshotKey;

      // Cancel any ongoing animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      animate();
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [snapshotKey, animate]);

  // Initial animation on mount
  useEffect(() => {
    animate();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return displayed;
}





