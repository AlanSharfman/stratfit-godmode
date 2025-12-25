import { useEffect, useMemo, useRef, useState } from "react";

type BriefingKey = "terrain" | "variance" | "actuals";

const BRIEFINGS: Record<
  BriefingKey,
  { title: string; lines: string[]; autoDismissMs: number }
> = {
  terrain: {
    title: "Terrain System Briefing",
    lines: [
      "This terrain is a live model of your business system.",
      "",
      "Peaks represent momentum created by demand, pricing power, and execution velocity.",
      "Valleys represent friction — cost pressure, operating drag, and concentrated risk.",
      "",
      "As you move levers, the surface morphs to reveal balance, stress, and resilience in real time.",
    ],
    autoDismissMs: 14000,
  },
  variance: {
    title: "Variance Mode Briefing",
    lines: [
      "Variance compares the active scenario to your Base Case.",
      "",
      "Use it to quantify the impact of lever changes across key metrics.",
      "This is where strategy becomes measurable — delta, percent change, and CFO commentary.",
    ],
    autoDismissMs: 12000,
  },
  actuals: {
    title: "Actuals Mode Briefing",
    lines: [
      "Actuals grounds scenarios in reality.",
      "",
      "This view will map real performance vs scenario targets, highlight drift, and surface drivers.",
      "Once connected to data sources, this becomes your early-warning + accountability layer.",
    ],
    autoDismissMs: 12000,
  },
};

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeLocalStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * Very subtle tick using WebAudio (no asset files).
 * NOTE: Audio will only work reliably after a user gesture; we keep it opt-in.
 */
function useTelegramTick(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const tick = () => {
    if (!enabled) return;

    // Create / reuse AudioContext
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      ctxRef.current = new Ctx();
    }

    const ctx = ctxRef.current!;
    // Some browsers require resume() after user gesture; we attempt, no harm if already running.
    void ctx.resume().catch(() => {});

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    // “soft mechanical tick”: short, quiet, slightly high
    o.type = "square";
    o.frequency.value = 1150;

    g.gain.value = 0.0;
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.02, now + 0.002);
    g.gain.linearRampToValueAtTime(0.0, now + 0.016);

    o.start(now);
    o.stop(now + 0.02);
  };

  return tick;
}

export default function BriefingPanel({
  briefingKey,
  open,
  soundEnabled,
  onClose,
  onSeen,
  forceNonce,
}: {
  briefingKey: BriefingKey;
  open: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onSeen: () => void;
  /**
   * Changing this value forces a re-type (used for hover re-trigger).
   */
  forceNonce: number;
}) {
  const briefing = BRIEFINGS[briefingKey];
  const fullText = useMemo(() => briefing.lines.join("\n"), [briefing.lines]);

  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  const tick = useTelegramTick(soundEnabled);

  // Track first open for "seen"
  const hasMarkedSeenRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Mark "seen" once when opened
    if (!hasMarkedSeenRef.current) {
      hasMarkedSeenRef.current = true;
      onSeen();
    }

    setTyped("");
    setTypingDone(false);

    let i = 0;
    const interval = window.setInterval(() => {
      const ch = fullText[i];
      if (ch === undefined) {
        window.clearInterval(interval);
        setTypingDone(true);
        return;
      }

      setTyped((t) => t + ch);

      // Tick only on “printable” characters (avoid constant clicking on whitespace)
      if (ch.trim().length > 0) tick();

      i++;
    }, 26);

    const timeout = window.setTimeout(() => {
      onClose();
    }, briefing.autoDismissMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
    // forceNonce re-triggers typing when user hovers/clicks info again
  }, [open, fullText, briefing.autoDismissMs, tick, onClose, onSeen, forceNonce]);

  if (!open) return null;

  return (
    <div className="mt-3 max-w-2xl rounded-lg border border-white/10 bg-black/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-wide text-white/70">
          {briefing.title}
        </div>

        <button
          onClick={onClose}
          className="text-[11px] text-white/45 hover:text-white/70 transition"
          aria-label="Close briefing"
          title="Close"
        >
          ✕
        </button>
      </div>

      <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-white/70">
        {typed}
        {!typingDone && <span className="opacity-50">▌</span>}
      </pre>
    </div>
  );
}

