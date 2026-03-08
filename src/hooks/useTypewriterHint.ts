import { useEffect, useMemo, useState } from "react";

type TypewriterOptions = {
  phrases: string[];
  typeMs?: number;
  eraseMs?: number;
  holdMs?: number;
  betweenMs?: number;
};

export function useTypewriterHint(opts: TypewriterOptions) {
  const {
    phrases,
    typeMs = 45,
    eraseMs = 22,
    holdMs = 1200,
    betweenMs = 350,
  } = opts;

  const safePhrases = useMemo(
    () => (phrases?.length ? phrases : ["Ask a strategic decision…"]),
    [phrases]
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    const phrase = safePhrases[phraseIndex] ?? safePhrases[0];

    if (!isErasing) {
      if (text.length < phrase.length) {
        timer = window.setTimeout(() => {
          setText(phrase.slice(0, text.length + 1));
        }, typeMs);
      } else {
        timer = window.setTimeout(() => setIsErasing(true), holdMs);
      }
    } else {
      if (text.length > 0) {
        timer = window.setTimeout(() => {
          setText(phrase.slice(0, text.length - 1));
        }, eraseMs);
      } else {
        timer = window.setTimeout(() => {
          setIsErasing(false);
          setPhraseIndex((i) => (i + 1) % safePhrases.length);
        }, betweenMs);
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [betweenMs, eraseMs, holdMs, isErasing, phraseIndex, safePhrases, text, typeMs]);

  return text;
}
