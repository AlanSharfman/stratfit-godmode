// src/components/OnboardingSequence.tsx
// STRATFIT — Comprehensive 60-second onboarding experience

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingSequenceProps {
  onComplete: () => void;
}

export default function OnboardingSequence({ onComplete }: OnboardingSequenceProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 5000),   // Step 1: Mountain metaphor explained
      setTimeout(() => setStep(2), 11000),  // Step 2: Reading the terrain
      setTimeout(() => setStep(3), 17000),  // Step 3: KPI Console + hover magic
      setTimeout(() => setStep(4), 23000),  // Step 4: Four scenarios explained
      setTimeout(() => setStep(5), 29000),  // Step 5: Growth levers
      setTimeout(() => setStep(6), 35000),  // Step 6: Efficiency levers
      setTimeout(() => setStep(7), 41000),  // Step 7: Risk levers
      setTimeout(() => setStep(8), 47000),  // Step 8: View modes (Terrain/Variance/Actuals)
      setTimeout(() => setStep(9), 53000),  // Step 9: AI Intelligence panel
      setTimeout(() => setStep(10), 59000), // Step 10: Why STRATFIT is world-first
      setTimeout(() => setStep(11), 65000), // Step 11: PDF Report generation
      setTimeout(() => setStep(12), 71000), // Step 12: Ready to explore
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
      }, 74000), // Complete after 74 seconds
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed top-6 right-6 z-[102] rounded-xl border border-slate-600/60 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            Skip intro
          </motion.button>

          {/* Step 0: Welcome + What is STRATFIT */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-1/2 left-1/2 z-[101] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(34,211,238,0.2)] backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
                    <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                      <path d="M2 17L12 22L22 17M2 12L12 17L22 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-cyan-300">Welcome to STRATFIT</div>
                    <div className="text-sm text-slate-400">Executive Scenario Intelligence Platform</div>
                  </div>
                </div>
                
                <p className="mb-4 text-base leading-relaxed text-slate-200">
                  STRATFIT is a <strong className="text-white">live business model</strong> that turns your metrics into terrain. 
                  Make decisions before they happen by exploring different futures.
                </p>
                
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
                  <div className="text-xs font-bold uppercase tracking-wide text-cyan-300 mb-2">What You'll Learn</div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Why STRATFIT is a world-first platform</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>How to read the mountain terrain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>What each business lever controls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>How to compare scenarios and track actuals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>How AI guides your strategic decisions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>How to generate board-ready PDF reports</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        i === 0 ? "bg-cyan-400 w-6" : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: The Mountain Metaphor */}
          <AnimatePresence>
            {step === 1 && (
              <>
                {/* Highlight center terrain */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[180px] left-1/2 -translate-x-1/2 z-[101] h-[500px] w-[900px] rounded-2xl border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[101] w-[650px] rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-cyan-300 mb-3">Why a Mountain?</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    Your business is not a spreadsheet — it's a <strong className="text-white">living system</strong> with momentum and friction. 
                    The mountain makes this visible.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 text-base">⛰️</span>
                        <div>
                          <div className="font-semibold text-cyan-300">Peaks = Momentum</div>
                          <div className="text-slate-400">High demand, pricing power, execution velocity</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 text-base">🏜️</span>
                        <div>
                          <div className="font-semibold text-amber-300">Valleys = Friction</div>
                          <div className="text-slate-400">Cost pressure, operational drag, concentrated risk</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 1 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 2: Reading the Terrain */}
          <AnimatePresence>
            {step === 2 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[180px] left-1/2 -translate-x-1/2 z-[101] h-[500px] w-[900px] rounded-2xl border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.5)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[101] w-[650px] rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-emerald-300 mb-3">How to Read the Mountain</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    The terrain <strong className="text-white">morphs in real time</strong> as you adjust business levers. 
                    Colors and elevation tell the story.
                  </p>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-8 rounded bg-gradient-to-r from-emerald-500 to-cyan-400 border border-cyan-300/30"></div>
                      <div>
                        <div className="font-semibold text-emerald-300">High Elevation (Cyan/Green)</div>
                        <div className="text-slate-400">Strong position — healthy growth, controlled burn, low risk concentration</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-8 rounded bg-gradient-to-r from-amber-600 to-orange-500 border border-amber-300/30"></div>
                      <div>
                        <div className="font-semibold text-amber-300">Low Elevation (Orange/Red)</div>
                        <div className="text-slate-400">Pressure zones — high burn, execution risk, or market volatility</div>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <div className="font-semibold text-slate-300 mb-1">💡 Pro Tip</div>
                      <div className="text-slate-400">
                        Watch the terrain ripple when you move sliders. Peaks shift, valleys deepen — this is your business responding.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 2 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 3: KPI Console + Hover Magic */}
          <AnimatePresence>
            {step === 3 && (
              <>
                {/* Highlight KPI console at top */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[101] h-[80px] w-[700px] rounded-xl border-2 border-violet-400 shadow-[0_0_30px_rgba(167,139,250,0.5)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed top-[170px] left-1/2 -translate-x-1/2 z-[101] w-[650px] rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-violet-300 mb-3">The KPI Console</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    Four metrics that matter most — <strong className="text-white">live-calculated</strong> from your lever positions.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-bold text-cyan-300 mb-1">💰 ARR</div>
                      <div className="text-slate-400">Annual Recurring Revenue — how fast you're growing</div>
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="font-bold text-emerald-300 mb-1">📊 Burn Rate</div>
                      <div className="text-slate-400">Monthly cash consumption — how long your runway is</div>
                    </div>
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="font-bold text-amber-300 mb-1">⏱️ Runway</div>
                      <div className="text-slate-400">Months until you need funding — your survival clock</div>
                    </div>
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="font-bold text-rose-300 mb-1">🎯 CAC</div>
                      <div className="text-slate-400">Customer Acquisition Cost — efficiency of your sales motion</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-violet-700 bg-violet-900/20 p-3">
                    <div className="font-semibold text-violet-300 mb-1 flex items-center gap-2">
                      <span>✨</span>
                      <span>Hover Magic</span>
                    </div>
                    <div className="text-slate-400 text-xs">
                      Hover over any KPI card — watch the related levers <strong className="text-white">glow</strong> and the mountain <strong className="text-white">highlight</strong> affected regions. This shows cause and effect.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 3 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 4: Four Scenarios Explained */}
          <AnimatePresence>
            {step === 4 && (
              <>
                {/* Highlight scenario selector */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[70px] left-[20px] z-[101] h-[80px] w-[280px] rounded-xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed top-[170px] left-[20px] z-[101] w-[550px] rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-cyan-300 mb-3">Four Scenarios, One Engine</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    Each scenario uses the <strong className="text-white">same metrics engine</strong> with different lever positions. Explore alternate futures.
                  </p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">BASE</span>
                      <div className="text-slate-400">
                        Current trajectory — balanced growth, moderate risk
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">AGGRESSIVE</span>
                      <div className="text-slate-400">
                        Max growth mode — high burn, high velocity, higher risk
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">CONSERVATIVE</span>
                      <div className="text-slate-400">
                        Survival mode — extend runway, reduce burn, sacrifice growth
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">CRISIS</span>
                      <div className="text-slate-400">
                        Downside case — market shock, exec risk, emergency response
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-cyan-700 bg-cyan-900/20 p-3">
                    <div className="text-slate-300 text-xs">
                      <strong className="text-white">Pro tip:</strong> Compare scenarios side-by-side to understand tradeoffs. What do you gain? What do you risk?
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 4 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 5: Growth Levers */}
          <AnimatePresence>
            {step === 5 && (
              <>
                {/* Highlight left panel - growth section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[160px] left-[20px] z-[101] h-[200px] w-[280px] rounded-xl border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed top-[160px] left-[320px] z-[101] w-[500px] rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-emerald-300 mb-3">Growth Levers</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    These control your <strong className="text-white">revenue trajectory</strong>. Higher values = faster growth, but often higher burn.
                  </p>
                  
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="font-bold text-emerald-300 mb-1">📈 Demand Strength</div>
                      <div className="text-slate-400">
                        Marketing spend, sales velocity, product-market fit. Higher = more leads, faster acquisition.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="font-bold text-emerald-300 mb-1">💵 Pricing Power</div>
                      <div className="text-slate-400">
                        Ability to raise prices without losing customers. Higher = better margins, stronger revenue per customer.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="font-bold text-emerald-300 mb-1">🚀 Expansion Velocity</div>
                      <div className="text-slate-400">
                        Speed of market entry, product launches, team scaling. Higher = faster growth, more burn, execution risk.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 5 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 6: Efficiency Levers */}
          <AnimatePresence>
            {step === 6 && (
              <>
                {/* Highlight left panel - efficiency section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[380px] left-[20px] z-[101] h-[200px] w-[280px] rounded-xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed top-[380px] left-[320px] z-[101] w-[500px] rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-cyan-300 mb-3">Efficiency Levers</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    These control your <strong className="text-white">capital efficiency</strong>. How much runway do you get per dollar?
                  </p>
                  
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-bold text-cyan-300 mb-1">💎 Cost Discipline</div>
                      <div className="text-slate-400">
                        Vendor management, infrastructure optimization, spending control. Higher = lower burn, longer runway.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-bold text-cyan-300 mb-1">👥 Hiring Intensity</div>
                      <div className="text-slate-400">
                        Pace of team growth across departments. Higher = faster execution, steeper burn, culture risk.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-bold text-cyan-300 mb-1">⚙️ Operating Drag</div>
                      <div className="text-slate-400">
                        Overhead, process friction, technical debt. Lower = better efficiency, faster decision-making.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 6 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 7: Risk Levers */}
          <AnimatePresence>
            {step === 7 && (
              <>
                {/* Highlight left panel - risk section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[600px] left-[20px] z-[101] h-[140px] w-[280px] rounded-xl border-2 border-rose-400 shadow-[0_0_30px_rgba(251,113,133,0.4)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed top-[600px] left-[320px] z-[101] w-[500px] rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-rose-300 mb-3">Risk Levers</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    These represent <strong className="text-white">external threats</strong> and internal weaknesses. Higher = more danger.
                  </p>
                  
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="font-bold text-rose-300 mb-1">🌊 Market Volatility</div>
                      <div className="text-slate-400">
                        Economic headwinds, competitive pressure, churn risk. Higher = unpredictable revenue, lower multiples.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="font-bold text-rose-300 mb-1">⚠️ Execution Risk</div>
                      <div className="text-slate-400">
                        Product delays, team turnover, operational breakdowns. Higher = missed targets, emergency fundraising.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-rose-700 bg-rose-900/20 p-3">
                    <div className="text-slate-300 text-xs">
                      <strong className="text-white">Remember:</strong> Risk levers affect the mountain's valleys. High risk creates deeper pressure zones.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 7 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 8: View Modes - Terrain / Variance / Actuals */}
          <AnimatePresence>
            {step === 8 && (
              <>
                {/* Highlight center tabs */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[160px] left-1/2 -translate-x-1/2 z-[101] h-[60px] w-[400px] rounded-xl border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[101] w-[650px] rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-amber-300 mb-3">Three Views of Reality</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    Switch between views to see different dimensions of your business. Each view uses the same data, different lens.
                  </p>
                  
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-bold text-cyan-300 mb-1 flex items-center gap-2">
                        <span>⛰️</span>
                        <span>TERRAIN</span>
                      </div>
                      <div className="text-slate-400">
                        The main mountain view — see your business as a living system. Peaks = momentum, valleys = friction.
                        Watch the landscape morph as you adjust levers.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                      <div className="font-bold text-violet-300 mb-1 flex items-center gap-2">
                        <span>📊</span>
                        <span>VARIANCES</span>
                      </div>
                      <div className="text-slate-400">
                        Compare scenarios side-by-side. See the <strong className="text-white">delta</strong> between Base Case and your selected scenario.
                        What changes? ARR? Burn? Runway? This is your tradeoff analysis.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="font-bold text-emerald-300 mb-1 flex items-center gap-2">
                        <span>📈</span>
                        <span>ACTUALS</span>
                      </div>
                      <div className="text-slate-400">
                        Track real performance vs. your scenarios. Upload actual data to see if you're on track.
                        The mountain updates with <strong className="text-white">reality markers</strong> showing where you actually landed.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-amber-700 bg-amber-900/20 p-3">
                    <div className="text-slate-300 text-xs">
                      <strong className="text-white">💡 Pro workflow:</strong> Start with Terrain to explore, switch to Variances to compare, then Actuals to track execution.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 8 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 9: AI Intelligence Panel */}
          <AnimatePresence>
            {step === 9 && (
              <>
                {/* Highlight right AI panel */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[160px] right-[20px] z-[101] h-[600px] w-[320px] rounded-2xl border-2 border-purple-400 shadow-[0_0_40px_rgba(192,132,252,0.5)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="fixed top-[200px] right-[360px] z-[101] w-[550px] rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-purple-300 mb-3">AI Intelligence Panel</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    The AI watches your terrain and surfaces <strong className="text-white">strategic insights</strong> in real time.
                  </p>
                  
                  <div className="space-y-3 text-xs mb-4">
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="font-bold text-purple-300 mb-1">🧠 Live Insights Stream</div>
                      <div className="text-slate-400">
                        As you move sliders, AI analyzes the changes and generates insights. "Your runway just dropped 4 months."
                        "This move increases execution risk by 30%." Real-time decision support.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="font-bold text-purple-300 mb-1">❓ Strategic Questions</div>
                      <div className="text-slate-400">
                        AI poses questions you should be asking: "What if market volatility doubles?"
                        "Can you sustain this burn rate?" Click to auto-adjust levers and see the answer.
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="font-bold text-purple-300 mb-1">⚡ Anomaly Detection</div>
                      <div className="text-slate-400">
                        Purple pulse indicators show when the AI spots something unusual — a risk spike, unexpected efficiency gain, or hidden tradeoff.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-700 bg-purple-900/20 p-3">
                    <div className="text-slate-300 text-xs">
                      <strong className="text-white">Why AI?</strong> You can't see every second-order effect. AI catches what you miss — compounding risks, hidden leverage points, non-obvious paths.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 9 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 10: Why STRATFIT is World-First */}
          <AnimatePresence>
            {step === 10 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 z-[101] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(34,211,238,0.2)] backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
                    <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-cyan-300">World-First Technology</div>
                    <div className="text-sm text-slate-400">Why STRATFIT is unique</div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="text-sm font-bold text-cyan-300 mb-2">🌍 No Spreadsheet Has Ever Done This</div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      Traditional tools give you <strong className="text-white">static numbers</strong> in rows and columns. 
                      STRATFIT gives you a <strong className="text-white">living terrain</strong> that shows system dynamics — 
                      how growth, efficiency, and risk interact in real time. You see second-order effects before they happen.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <div className="text-sm font-bold text-purple-300 mb-2">🎯 Built for High-Stakes Decisions</div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      Use STRATFIT when the future isn't clear: Should you raise now or extend runway? 
                      Go aggressive or conservative? What if the market crashes? 
                      <strong className="text-white"> Explore scenarios before betting the company.</strong>
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="text-sm font-bold text-emerald-300 mb-2">⚡ Real-Time Physics, Not Formulas</div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      The mountain uses <strong className="text-white">computational physics</strong> to model your business as a system. 
                      Change one lever, watch everything ripple. See compression, momentum, friction — 
                      the forces that drive your metrics.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="text-sm font-bold text-amber-300 mb-2">🚀 From Insight to Action in 60 Seconds</div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      Move a slider, see the terrain change, read the AI insight, generate a PDF report. 
                      <strong className="text-white"> That's faster than opening Excel.</strong> Built for executives who need answers now.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        i === 10 ? "bg-cyan-400 w-6" : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 11: PDF Report Generation */}
          <AnimatePresence>
            {step === 11 && (
              <>
                {/* Highlight Save button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-[70px] right-[20px] z-[101] h-[50px] w-[180px] rounded-xl border-2 border-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.5)]"
                />
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="fixed top-[140px] right-[20px] z-[101] w-[600px] rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  <div className="text-sm font-bold uppercase tracking-wide text-indigo-300 mb-3">Board-Ready PDF Reports</div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-200">
                    Click <strong className="text-white">Save</strong> to generate a comprehensive PDF report. 
                    Perfect for board meetings, investor updates, and strategic planning sessions.
                  </p>
                  
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-300 mb-2">📄 What's Included</div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">Terrain Snapshot:</strong> Full-color 3D mountain render showing current state</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">KPI Summary:</strong> ARR, Burn Rate, Runway, CAC with trend indicators</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">Lever Settings:</strong> Current positions for all 8 business levers</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">Scenario Comparison:</strong> Side-by-side variance analysis vs Base Case</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">AI Strategic Insights:</strong> Key recommendations and risk warnings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">Executive Summary:</strong> One-page brief of critical findings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong className="text-white">Actuals Tracking:</strong> Performance vs projections (if data uploaded)</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-indigo-700 bg-indigo-900/20 p-3">
                    <div className="text-slate-300 text-xs">
                      <strong className="text-white">💼 Use case:</strong> Generate before board meetings to show different funding scenarios. 
                      Export all four scenarios to compare aggressive vs conservative paths side-by-side.
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === 11 ? "bg-cyan-400 w-6" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Step 12: Ready to Explore */}
          <AnimatePresence>
            {step === 12 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 z-[101] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(34,211,238,0.2)] backdrop-blur-xl"
              >
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
                    <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-white mb-3">You're Ready to Command</div>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  You now understand the mountain, the levers, the scenarios, and the AI. 
                  <strong className="text-slate-300"> Start exploring.</strong> The terrain will guide you.
                </p>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
                  <div className="text-xs font-bold uppercase tracking-wide text-cyan-300 mb-2">Quick Start</div>
                  <div className="text-xs text-slate-300 text-left space-y-1">
                    <div>1. Click <strong className="text-white">Aggressive Growth</strong> scenario</div>
                    <div>2. Move the <strong className="text-white">Demand Strength</strong> slider</div>
                    <div>3. Watch the mountain respond</div>
                    <div>4. Check what the AI says</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Click anywhere to begin. Press ESC anytime to show this guide again.
                </div>

                <div className="mt-6 flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        i === 12 ? "bg-cyan-400 w-6" : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
