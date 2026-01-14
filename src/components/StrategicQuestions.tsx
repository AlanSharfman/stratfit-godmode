// src/components/StrategicQuestions.tsx
// STRATFIT — Guided Strategic Interrogation Panel
// Curated, high-signal, clickable questions that trigger deterministic analysis

import React, { useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore, ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// TYPES
// ============================================================================

interface StrategicPrompt {
  id: string;
  text: string;
  dominantConstraint: "time" | "liquidity" | "momentum" | "efficiency" | "risk" | "structure";
  primaryKpis: number[]; // KPI indices to highlight
  getResponse: (state: AnalysisState) => AnalysisResponse;
}

interface AnalysisState {
  scenario: ScenarioId;
  riskLevel: number;
  runway: number;
  momentum: number;
  burnQuality: number;
  cashPosition: number;
}

interface AnalysisResponse {
  observation: string;
  risk: string;
  action: string;
}

// ============================================================================
// PROMPT CONFIGURATIONS
// ============================================================================

const OPERATOR_PROMPTS: StrategicPrompt[] = [
  {
    id: "growth-break",
    text: "What breaks first if growth accelerates?",
    dominantConstraint: "efficiency",
    primaryKpis: [3, 4], // Burn, Risk
    getResponse: (state) => {
      if (state.burnQuality < 40) {
        return {
          observation: "Burn quality is already stressed. Acceleration would compound operational drag before revenue scales.",
          risk: "Hiring ahead of revenue creates structural deficit. Cash efficiency degrades non-linearly.",
          action: "Sequence growth investments against revenue milestones, not ambition."
        };
      }
      return {
        observation: "Current efficiency supports moderate acceleration. Primary tension shifts to hiring velocity.",
        risk: "Operational capacity becomes the constraint before capital does.",
        action: "Pre-position operational infrastructure before pushing demand."
      };
    }
  },
  {
    id: "current-tradeoff",
    text: "What trade-off am I making right now?",
    dominantConstraint: "structure",
    primaryKpis: [2, 3], // Momentum, Burn
    getResponse: (state) => {
      if (state.momentum > 60 && state.burnQuality < 50) {
        return {
          observation: "Trading burn efficiency for growth momentum. The system is prioritizing expansion over resilience.",
          risk: "This trade-off compounds. Each month of high burn narrows future optionality.",
          action: "Acknowledge the trade-off explicitly. Set a review trigger at defined burn threshold."
        };
      }
      if (state.runway < 12) {
        return {
          observation: "Trading strategic flexibility for survival. Short runway forces near-term thinking.",
          risk: "Constrained runway limits ability to weather execution variance.",
          action: "Extend runway before making irreversible strategic commitments."
        };
      }
      return {
        observation: "Current posture balances growth and efficiency. No dominant trade-off detected.",
        risk: "Equilibrium states can mask emerging tensions. Monitor leading indicators.",
        action: "Maintain current trajectory. Reassess if any single metric moves beyond tolerance."
      };
    }
  },
  {
    id: "risk-lever",
    text: "Which lever increases risk the fastest?",
    dominantConstraint: "risk",
    primaryKpis: [4], // Risk
    getResponse: (state) => {
      if (state.scenario === "stress" || state.scenario === "downside") {
        return {
          observation: "In stressed scenarios, hiring intensity amplifies risk fastest. Each new commitment extends fixed cost exposure.",
          risk: "Headcount cannot be unwound quickly. Creates structural rigidity in downside.",
          action: "Shift to variable cost structures where possible. Preserve optionality."
        };
      }
      return {
        observation: "Expansion velocity carries highest risk multiplier. Market timing compounds execution variance.",
        risk: "Aggressive expansion in uncertain conditions creates exposure asymmetry.",
        action: "Calibrate expansion pace to conviction level. Uncertainty demands restraint."
      };
    }
  },
  {
    id: "fragility",
    text: "Where is the system fragile?",
    dominantConstraint: "structure",
    primaryKpis: [0, 4], // Runway, Risk
    getResponse: (state) => {
      if (state.runway < 15) {
        return {
          observation: "Time is the fragility. Limited runway creates forced-hand scenarios that compound suboptimal decisions.",
          risk: "Fragility here is existential. Options narrow faster than performance can improve.",
          action: "Address runway before optimizing anything else."
        };
      }
      if (state.riskLevel > 50) {
        return {
          observation: "Concentration risk dominates. System depends on assumptions that haven't been stress-tested.",
          risk: "Single points of failure exist. Variance in key assumptions cascades.",
          action: "Identify top 3 assumptions. Build contingency for each."
        };
      }
      return {
        observation: "No critical fragility detected. System has adequate buffers.",
        risk: "Latent fragilities may emerge under stress. Current stability is conditional.",
        action: "Scenario-test against 2x demand drop and 1.5x burn increase."
      };
    }
  }
];

const INVESTOR_PROMPTS: StrategicPrompt[] = [
  {
    id: "return-constraint",
    text: "What constrains returns in this scenario?",
    dominantConstraint: "structure",
    primaryKpis: [0, 6], // Runway, Value
    getResponse: (state) => {
      if (state.runway < 15) {
        return {
          observation: "Time constrains returns. Limited runway forces suboptimal exits or dilutive financing.",
          risk: "Path dependency increases. Fewer strategic options means lower expected value.",
          action: "Factor runway extension into investment thesis."
        };
      }
      return {
        observation: "Execution variance is the primary return constraint. Model assumptions carry significant sensitivity.",
        risk: "Returns depend on assumptions that have not been de-risked through traction.",
        action: "Milestone-based deployment recommended."
      };
    }
  },
  {
    id: "downside-risk",
    text: "What risk dominates in the downside?",
    dominantConstraint: "risk",
    primaryKpis: [4, 0], // Risk, Runway
    getResponse: (state) => {
      if (state.scenario === "stress" || state.scenario === "downside") {
        return {
          observation: "Liquidity risk dominates. Downside scenarios compress runway faster than operations can adapt.",
          risk: "Cash exhaustion timeline accelerates non-linearly in stress scenarios.",
          action: "Require capital reserves or covenant protections."
        };
      }
      return {
        observation: "Execution risk dominates. Downside is primarily a function of delivery variance, not market conditions.",
        risk: "Team and operational capacity become binding constraints.",
        action: "Diligence operational readiness, not just market opportunity."
      };
    }
  },
  {
    id: "value-sensitivity",
    text: "How sensitive is value to execution?",
    dominantConstraint: "efficiency",
    primaryKpis: [6, 2], // Value, Momentum
    getResponse: (state) => {
      const sensitivity = state.momentum > 50 ? "high" : "moderate";
      if (sensitivity === "high") {
        return {
          observation: "Value is highly sensitive to execution. Current momentum creates expectations that must be sustained.",
          risk: "Execution miss compounds. Market re-rates aggressively on deceleration.",
          action: "Underwrite execution risk explicitly. Adjust return expectations for variance."
        };
      }
      return {
        observation: "Value sensitivity is moderate. Base case does not depend on exceptional execution.",
        risk: "Upside requires execution. Base case is achievable with competent management.",
        action: "Standard execution monitoring appropriate."
      };
    }
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

interface StrategicQuestionsProps {
  onPromptClick: (response: AnalysisResponse, kpis: number[], constraint: string) => void;
  isAnalyzing: boolean;
}

export default function StrategicQuestions({ onPromptClick, isAnalyzing }: StrategicQuestionsProps) {
  const viewMode = useScenarioStore((s) => s.viewMode);
  const scenario = useScenarioStore((s) => s.scenario);
  
  const {
    activeScenarioId,
    engineResults,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const engineResult = engineResults?.[activeScenarioId];
  const kpiValues = engineResult?.kpis || {};

  const prompts = viewMode === "investor" ? INVESTOR_PROMPTS : OPERATOR_PROMPTS;

  // Build current analysis state from store
  const analysisState: AnalysisState = useMemo(() => ({
    scenario,
    riskLevel: 100 - (kpiValues.riskIndex?.value ?? 50), // Convert health → danger
    runway: kpiValues.runway?.value ?? 18,
    momentum: kpiValues.momentum?.value ?? 50,
    burnQuality: kpiValues.burnQuality?.value ?? 55,
    cashPosition: (kpiValues.cashPosition?.value ?? 300) / 100,
  }), [scenario, kpiValues]);

  const handleClick = useCallback((prompt: StrategicPrompt) => {
    if (isAnalyzing) return;
    const response = prompt.getResponse(analysisState);
    onPromptClick(response, prompt.primaryKpis, prompt.dominantConstraint);
  }, [analysisState, isAnalyzing, onPromptClick]);

  return (
    <div className={`strategic-questions ${isAnalyzing ? 'analyzing' : ''}`}>
      <div className="sq-prompts">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            className="sq-prompt"
            onClick={() => handleClick(prompt)}
            disabled={isAnalyzing}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sq-icon">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>

      <style>{`
        .strategic-questions {
          padding: 12px 16px 16px;
          transition: opacity 0.2s;
          flex-shrink: 0;
          background: rgba(20, 25, 32, 0.5);
        }

        .strategic-questions.analyzing {
          opacity: 0.5;
          pointer-events: none;
        }

        .sq-prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sq-prompt {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(25, 30, 38, 0.7);
          border: 1px solid rgba(50, 60, 75, 0.35);
          border-radius: 8px;
          color: rgba(200, 215, 230, 0.75);
          font-size: 11.5px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sq-prompt .sq-icon {
          flex-shrink: 0;
          color: rgba(34, 211, 238, 0.5);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .sq-prompt:hover:not(:disabled) {
          background: rgba(34, 211, 238, 0.08);
          border-color: rgba(34, 211, 238, 0.35);
          color: rgba(255, 255, 255, 0.9);
        }

        .sq-prompt:hover:not(:disabled) .sq-icon {
          color: rgba(34, 211, 238, 0.8);
          transform: translateX(2px);
        }

        .sq-prompt:active:not(:disabled) {
          background: rgba(34, 211, 238, 0.12);
          transform: scale(0.99);
        }

        .sq-prompt:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}

