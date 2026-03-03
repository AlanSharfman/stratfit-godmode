// src/features/intelligence/intelligenceState.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence State Machine
//
// Governs the Executive Briefing lifecycle:
//   idle → entering → playing → exiting → complete → idle
//
// No illegal transitions allowed. Duration-gated entering/exiting phases.
// ═══════════════════════════════════════════════════════════════════════════

export type IntelligenceState =
  | "idle"
  | "entering"
  | "playing"
  | "exiting"
  | "complete"

export interface IntelligenceController {
  state: IntelligenceState
  /** Begin the briefing sequence: idle → entering */
  play(): void
  /** Interrupt and exit: any → exiting */
  stop(): void
  /** Pause (hold state, stop clock) — only valid in 'playing' */
  pause(): void
  /** Resume from pause */
  resume(): void
  /** True when paused during 'playing' */
  isPaused: boolean
  /** Playback clock in ms since 'playing' started */
  clockMs: number
  /** Enter transition progress 0..1 */
  enterProgress: number
  /** Exit transition progress 0..1 */
  exitProgress: number
}

/* ── Durations ── */

export const ENTER_DURATION_MS = 800
export const EXIT_DURATION_MS = 600

/* ── Transition guard ── */

const LEGAL_TRANSITIONS: Record<IntelligenceState, IntelligenceState[]> = {
  idle: ["entering"],
  entering: ["playing", "exiting"],
  playing: ["exiting"],
  exiting: ["complete"],
  complete: ["idle"],
}

export function canTransition(
  from: IntelligenceState,
  to: IntelligenceState,
): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false
}

/* ── State machine implementation (vanilla, framework-agnostic) ── */

export type StateChangeCallback = (
  newState: IntelligenceState,
  prevState: IntelligenceState,
) => void

export function createIntelligenceController(
  onChange?: StateChangeCallback,
): IntelligenceController {
  let _state: IntelligenceState = "idle"
  let _paused = false
  let _clockMs = 0
  let _enterProgress = 0
  let _exitProgress = 0
  let _enterTimer: ReturnType<typeof setTimeout> | null = null
  let _exitTimer: ReturnType<typeof setTimeout> | null = null

  function transition(to: IntelligenceState) {
    if (!canTransition(_state, to)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[IntelligenceState] Illegal transition: ${_state} → ${to}`,
        )
      }
      return
    }
    const prev = _state
    _state = to
    onChange?.(to, prev)
  }

  function clearTimers() {
    if (_enterTimer) {
      clearTimeout(_enterTimer)
      _enterTimer = null
    }
    if (_exitTimer) {
      clearTimeout(_exitTimer)
      _exitTimer = null
    }
  }

  const controller: IntelligenceController = {
    get state() {
      return _state
    },
    get isPaused() {
      return _paused
    },
    get clockMs() {
      return _clockMs
    },
    get enterProgress() {
      return _enterProgress
    },
    get exitProgress() {
      return _exitProgress
    },

    play() {
      if (_state === "complete") {
        // Reset first
        transition("idle")
      }
      if (_state !== "idle") return

      _clockMs = 0
      _paused = false
      _enterProgress = 0
      _exitProgress = 0

      transition("entering")

      // Animate enter progress
      const enterStart = performance.now()
      const enterTick = () => {
        if (_state !== "entering") return
        const elapsed = performance.now() - enterStart
        _enterProgress = Math.min(elapsed / ENTER_DURATION_MS, 1)
        if (_enterProgress >= 1) {
          _enterProgress = 1
          transition("playing")
          return
        }
        _enterTimer = setTimeout(enterTick, 16) as any
      }
      _enterTimer = setTimeout(enterTick, 16) as any
    },

    stop() {
      clearTimers()

      if (_state === "idle" || _state === "complete") return
      if (_state === "exiting") return // already exiting

      _paused = false
      _exitProgress = 0

      transition("exiting")

      // Animate exit progress
      const exitStart = performance.now()
      const exitTick = () => {
        if (_state !== "exiting") return
        const elapsed = performance.now() - exitStart
        _exitProgress = Math.min(elapsed / EXIT_DURATION_MS, 1)
        if (_exitProgress >= 1) {
          _exitProgress = 1
          transition("complete")
          // Auto-reset to idle after a frame
          setTimeout(() => {
            if (_state === "complete") transition("idle")
          }, 100)
          return
        }
        _exitTimer = setTimeout(exitTick, 16) as any
      }
      _exitTimer = setTimeout(exitTick, 16) as any
    },

    pause() {
      if (_state === "playing" && !_paused) {
        _paused = true
      }
    },

    resume() {
      if (_state === "playing" && _paused) {
        _paused = false
      }
    },
  }

  return controller
}

/* ── Clock ticker (call from useFrame or rAF) ── */

export function tickClock(
  controller: IntelligenceController,
  deltaMs: number,
): void {
  if (
    controller.state === "playing" &&
    !controller.isPaused
  ) {
    ;(controller as any)._clockMs =
      ((controller as any)._clockMs ?? controller.clockMs) + deltaMs
    // Direct mutation for performance — controller is the single owner
    Object.defineProperty(controller, "clockMs", {
      get() {
        return (controller as any)._clockMs
      },
      configurable: true,
    })
  }
}
