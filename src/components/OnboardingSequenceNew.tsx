// src/components/OnboardingSequenceNew.tsx
// STRATFIT — Anchor-Based Spotlight Onboarding Tour
// LOCKED COPY - DO NOT MODIFY TEXT

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingSequenceProps {
  onComplete: () => void;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function OnboardingSequence({ onComplete }: OnboardingSequenceProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Slow pacing - ~4-5 seconds per scene
    const timers = [
      setTimeout(() => setStep(1), 5000),   // Scene 1
      setTimeout(() => setStep(2), 10000),  // Scene 2
      setTimeout(() => setStep(3), 15000),  // Scene 3
      setTimeout(() => setStep(4), 20000),  // Scene 4
      setTimeout(() => setStep(5), 25000),  // Scene 5
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
      }, 30000), // Complete after 30 seconds
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed top-8 right-8 z-[102] rounded-xl border-2 border-slate-600/60 bg-slate-900/90 px-6 py-3 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-cyan-500 hover:bg-slate-800 hover:text-white shadow-xl"
          >
            Skip intro
          </motion.button>

          {/* Title Scene (Step 0) */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-1/2 left-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 text-center"
              >
                <h1 className="text-7xl font-bold text-white mb-6 tracking-tight">
                  STRATFIT
                </h1>
                <p className="text-2xl text-cyan-400 font-light tracking-wide">
                  AI-powered scenario intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scene 1: System intro */}
          <AnimatePresence>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-1/2 left-1/2 z-[101] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                <p className="text-2xl leading-relaxed text-white font-light text-center">
                  STRATFIT shows how decisions change outcomes — before you commit to them.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scene 2: Terrain spotlight */}
          <AnimatePresence>
            {step === 2 && (
              <>
                {/* Spotlight on mountain/terrain area */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[200px] left-1/2 -translate-x-1/2 z-[99] h-[450px] w-[850px] rounded-2xl border-4 border-cyan-400/60 shadow-[0_0_60px_rgba(34,211,238,0.4)] pointer-events-none"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[680px] left-1/2 z-[101] w-[700px] -translate-x-1/2 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <p className="text-2xl leading-relaxed text-white font-light text-center">
                    This terrain is your business as a system — shaped by growth, efficiency, and risk.
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Scene 3: Slider spotlight */}
          <AnimatePresence>
            {step === 3 && (
              <>
                {/* Spotlight on first slider (right panel) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[200px] right-[40px] z-[99] h-[500px] w-[380px] rounded-2xl border-4 border-cyan-400/60 shadow-[0_0_60px_rgba(34,211,238,0.4)] pointer-events-none"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[260px] right-[450px] z-[101] w-[550px] rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <p className="text-xl leading-relaxed text-white font-light mb-4">
                    Adjust an assumption.
                  </p>
                  <p className="text-xl leading-relaxed text-cyan-300 font-light">
                    The system recalculates in real time.
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Scene 4: KPI spotlight */}
          <AnimatePresence>
            {step === 4 && (
              <>
                {/* Spotlight on KPI row (top left) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[30px] left-[40px] z-[99] h-[140px] w-[1350px] rounded-2xl border-4 border-cyan-400/60 shadow-[0_0_60px_rgba(34,211,238,0.4)] pointer-events-none"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[200px] left-1/2 z-[101] w-[700px] -translate-x-1/2 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <p className="text-2xl leading-relaxed text-white font-light text-center">
                    These instruments reflect outcomes — cash, runway, risk, and value.
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Scene 5: AI panel spotlight */}
          <AnimatePresence>
            {step === 5 && (
              <>
                {/* Spotlight on AI panel (bottom) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed bottom-[20px] left-[40px] right-[40px] z-[99] h-[240px] rounded-2xl border-4 border-cyan-400/60 shadow-[0_0_60px_rgba(34,211,238,0.4)] pointer-events-none"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed top-[180px] left-1/2 z-[101] w-[700px] -translate-x-1/2 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <p className="text-xl leading-relaxed text-white font-light mb-4 text-center">
                    When the system moves, STRATFIT explains why.
                  </p>
                  <p className="text-xl leading-relaxed text-slate-400 font-light text-center">
                    Not advice — interpretation.
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Final Scene (Step 6) */}
          <AnimatePresence>
            {step === 6 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-1/2 left-1/2 z-[101] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-cyan-500/40 bg-slate-950/95 p-10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl text-center"
              >
                <p className="text-2xl leading-relaxed text-white font-light mb-6">
                  You choose the direction.
                </p>
                <p className="text-2xl leading-relaxed text-cyan-400 font-light">
                  STRATFIT reveals the consequences.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
