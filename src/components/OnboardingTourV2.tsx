// src/components/OnboardingTourV2.tsx
// STRATFIT GOD-MODE Onboarding Tour v2
// Visual, anchored, premium "SHOW ME" experience

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  title: string;
  description: string;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to STRATFIT",
    description: "Your business health, visualized as terrain. Let's explore.",
    targetSelector: "body",
    position: "center",
  },
  {
    title: "KPI Console",
    description: "Your business health, at a glance. Real-time metrics that matter.",
    targetSelector: "[data-tour='kpis']",
    position: "bottom",
  },
  {
    title: "Scenario Selector",
    description: "Switch between Base / Upside / Downside / Extreme scenarios.",
    targetSelector: "[data-tour='scenario']",
    position: "right",
  },
  {
    title: "Mountain Terrain",
    description: "This terrain is your risk & momentum landscape. Watch it respond to your decisions.",
    targetSelector: "[data-tour='mountain']",
    position: "bottom",
  },
  {
    title: "AI Strategic Insights",
    description: "Narrated strategy, not just numbers. Your personal CFO advisor.",
    targetSelector: "[data-tour='ai']",
    position: "top",
  },
  {
    title: "Business Levers",
    description: "Move levers. Watch the terrain respond. Test decisions before committing.",
    targetSelector: "[data-tour='sliders']",
    position: "top",
  },
  {
    title: "God-Mode Connected",
    description: "Click any KPI to see which levers affect it. Everything is connected.",
    targetSelector: "[data-tour='kpis']",
    position: "bottom",
  },
  {
    title: "Save & Compare",
    description: "Save scenarios locally. Compare outcomes. Make informed decisions.",
    targetSelector: "[data-tour='save']",
    position: "right",
  },
  {
    title: "Ready to Explore",
    description: "You're now ready to explore your strategic landscape. Start with any lever.",
    targetSelector: "body",
    position: "center",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

interface OnboardingTourV2Props {
  onComplete: () => void;
}

export default function OnboardingTourV2({ onComplete }: OnboardingTourV2Props) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const currentStep = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  // Update target rect when step changes
  useEffect(() => {
    const target = document.querySelector(currentStep.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step, currentStep.targetSelector]);

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }
  }, [step, onComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || currentStep.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 24;
    const style: React.CSSProperties = {
      position: "fixed",
    };

    switch (currentStep.position) {
      case "bottom":
        style.top = `${targetRect.bottom + padding}px`;
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.transform = "translateX(-50%)";
        break;
      case "top":
        style.bottom = `${window.innerHeight - targetRect.top + padding}px`;
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.transform = "translateX(-50%)";
        break;
      case "right":
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.left = `${targetRect.right + padding}px`;
        style.transform = "translateY(-50%)";
        break;
      case "left":
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.right = `${window.innerWidth - targetRect.left + padding}px`;
        style.transform = "translateY(-50%)";
        break;
    }

    return style;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-[200]"
            style={{
              background:
                targetRect && currentStep.position !== "center"
                  ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${
                      targetRect.top + targetRect.height / 2
                    }px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0, 0, 0, 0.85) ${
                      Math.max(targetRect.width, targetRect.height) / 2 + 100
                    }px)`
                  : "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(4px)",
            }}
            onClick={handleSkip}
          />

          {/* Spotlight highlight ring */}
          {targetRect && currentStep.position !== "center" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="fixed z-[201] pointer-events-none"
              style={{
                left: targetRect.left - 8,
                top: targetRect.top - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                border: "3px solid rgba(34, 211, 238, 0.6)",
                borderRadius: "16px",
                boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.8), 0 0 40px rgba(34, 211, 238, 0.4), inset 0 0 40px rgba(34, 211, 238, 0.1)",
              }}
            />
          )}

          {/* Tour tooltip */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed z-[202] w-[520px]"
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border-2 border-cyan-500/40 bg-slate-950/98 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.9),0_0_0_1px_rgba(34,211,238,0.2)] backdrop-blur-xl">
              {/* Progress bar */}
              <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </div>

              {/* Content */}
              <div className="mb-6">
                <h2 className="mb-3 text-2xl font-bold text-white">{currentStep.title}</h2>
                <p className="text-lg leading-relaxed text-slate-300">{currentStep.description}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Step {step + 1} of {TOUR_STEPS.length}
                </div>
                <div className="flex gap-3">
                  {step > 0 && (
                    <button
                      onClick={handlePrev}
                      className="rounded-lg border-2 border-slate-600/60 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-700 hover:text-white"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105"
                  >
                    {step < TOUR_STEPS.length - 1 ? "Next" : "Start Exploring"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed right-8 top-8 z-[203] rounded-xl border-2 border-slate-600/60 bg-slate-900/90 px-6 py-3 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-cyan-500 hover:bg-slate-800 hover:text-white"
          >
            Skip Tour
          </motion.button>
        </>
      )}
    </AnimatePresence>
  );
}
