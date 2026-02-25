import { useEffect } from "react";
import { DEMO_NARRATION } from "./demoNarration";

const NASA_VOICE_PRIORITY = [
  "Google UK English Female",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Aria",
  "Samantha",
  "Karen",
  "Moira",
  "Microsoft Zira Desktop",
  "Microsoft Zira",
];

function pickNarrationVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of NASA_VOICE_PRIORITY) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  return voices.find((v) => /female/i.test(v.name)) ?? null;
}

export function useDemoNarration(stage: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const line = DEMO_NARRATION.find((n) => n.stage === stage);
    if (!line) return;

    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const timer = setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(line.text);
      // NASA documentary — clear, flowing, no jitter
      utter.rate   = 0.88;
      utter.pitch  = 0.96;
      utter.volume = 1.0;

      const apply = () => {
        const chosen = pickNarrationVoice(synth.getVoices());
        if (chosen) utter.voice = chosen;

        // Chrome anti-jitter keepAlive
        let keepAlive: ReturnType<typeof setInterval> | null = null;
        utter.onstart = () => {
          keepAlive = setInterval(() => {
            if (!synth.speaking) { clearInterval(keepAlive!); return; }
            synth.pause(); synth.resume();
          }, 10_000);
        };
        utter.onend   = () => { if (keepAlive) clearInterval(keepAlive); };
        utter.onerror = () => { if (keepAlive) clearInterval(keepAlive); };

        synth.speak(utter);
      };

      const voices = synth.getVoices();
      if (voices.length > 0) {
        apply();
      } else {
        synth.onvoiceschanged = () => { synth.onvoiceschanged = null; apply(); };
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [stage, enabled]);
}
