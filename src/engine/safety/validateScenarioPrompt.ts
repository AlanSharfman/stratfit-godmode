/**
 * STRATFIT — Prompt Validation Layer
 *
 * Classifies user prompts before they enter the scenario pipeline.
 * Invalid, unclear, or unsafe prompts are blocked with structured
 * feedback — raw text never reaches the simulation engine.
 */

export type ValidationClass =
  | "valid"
  | "unclear"
  | "incomplete"
  | "unrealistic"
  | "irrelevant"
  | "unsafe"

export interface PromptValidation {
  validationClass: ValidationClass
  reason: string
  suggestedNextPrompts?: string[]
}

const MIN_LENGTH = 3
const MAX_LENGTH = 500

const UNSAFE_PATTERNS = [
  /\b(hack|exploit|steal|illegal|fraud|launder)\b/i,
  /\b(kill|destroy|attack|weapon)\b/i,
  /\b(insider\s+trad)/i,
]

const IRRELEVANT_PATTERNS = [
  /\b(weather|recipe|sport|movie|joke|song|poem)\b/i,
  /\b(make\s+(it|the)\s+(look|feel)\s+(cool|nice|pretty|better))\b/i,
  /\b(what\s+color|change\s+background|add\s+emoji)\b/i,
  /\b(tell\s+me\s+a\s+(joke|story))\b/i,
  /\b(who\s+(is|are|was))\b/i,
]

const UNREALISTIC_PATTERNS = [
  /\b(billion|trillion)\s*(dollar|usd|\$)/i,
  /\b(100x|1000x)\b/i,
  /\bgrow\s+\d{4,}%/i,
  /\b(infinite|unlimited)\b/i,
  /\byacht|ferrari|mansion\b/i,
]

const STRATEGIC_SIGNALS = [
  /\b(hire|recruit|headcount|team|staff)\b/i,
  /\b(price|pricing|revenue|margin|arpu)\b/i,
  /\b(raise|fund|capital|series|seed|invest)\b/i,
  /\b(grow|expand|launch|scale|market|partner)\b/i,
  /\b(cut|reduce|optimise|optimize|automate|lean)\b/i,
  /\b(lose|risk|churn|recession|downturn|crisis|competitor)\b/i,
  /\b(burn|runway|liquidity|cash|enterprise\s*value)\b/i,
  /\b(what\s+if|scenario|simulate|test|model)\b/i,
  /\b(acquisition|merger|ipo|exit|pivot)\b/i,
  /\b(product|saas|subscription|contract|customer)\b/i,
  /\b(sales|marketing|engineering|ops)\b/i,
  /\d+%/,
  /\$\d/,
]

const VAGUE_ONLY_PATTERNS = [
  /^(fix|improve|help|do|make|change|update)\s*(everything|it|things|stuff)?[.!?]?$/i,
  /^(go|run|start|begin)[.!?]?$/i,
  /^(yes|no|ok|sure|maybe|idk|hmm)[.!?]?$/i,
]

function countStrategicSignals(text: string): number {
  return STRATEGIC_SIGNALS.reduce((n, rx) => n + (rx.test(text) ? 1 : 0), 0)
}

export function validateScenarioPrompt(prompt: string): PromptValidation {
  const text = prompt.trim()

  if (!text || text.length < MIN_LENGTH) {
    return {
      validationClass: "incomplete",
      reason: "The prompt is too short to interpret as a strategic scenario.",
      suggestedNextPrompts: [
        "Hire a senior engineering team",
        "Raise prices by 15%",
        "Cut burn rate to extend runway",
      ],
    }
  }

  if (text.length > MAX_LENGTH) {
    return {
      validationClass: "incomplete",
      reason: "The prompt exceeds the maximum length. Please condense to a single strategic decision.",
    }
  }

  for (const rx of UNSAFE_PATTERNS) {
    if (rx.test(text)) {
      return {
        validationClass: "unsafe",
        reason: "This prompt contains language outside the scope of strategic business simulation.",
      }
    }
  }

  for (const rx of IRRELEVANT_PATTERNS) {
    if (rx.test(text)) {
      return {
        validationClass: "irrelevant",
        reason: "STRATFIT analyses strategic business decisions. This prompt does not describe a business scenario.",
        suggestedNextPrompts: [
          "What if we lose our biggest customer?",
          "Raise a $5M Series A",
          "Expand into a new market",
        ],
      }
    }
  }

  for (const rx of UNREALISTIC_PATTERNS) {
    if (rx.test(text)) {
      return {
        validationClass: "unrealistic",
        reason: "The scenario parameters exceed realistic bounds for a startup or growth-stage company.",
        suggestedNextPrompts: [
          "Raise a $5M Series A",
          "Double marketing spend",
          "Hire 10 engineers",
        ],
      }
    }
  }

  for (const rx of VAGUE_ONLY_PATTERNS) {
    if (rx.test(text)) {
      return {
        validationClass: "unclear",
        reason: "The prompt is too vague for the simulation engine to interpret. Please describe a specific strategic decision.",
        suggestedNextPrompts: [
          "Hire a CTO",
          "Cut burn rate by 20%",
          "Launch enterprise pricing tier",
        ],
      }
    }
  }

  const signals = countStrategicSignals(text)
  if (signals === 0) {
    const words = text.split(/\s+/).length
    if (words <= 2) {
      return {
        validationClass: "unclear",
        reason: "The prompt lacks enough context for scenario interpretation. Add detail about the business decision you want to test.",
        suggestedNextPrompts: [
          "What if we hire a VP of Sales?",
          "Reduce headcount by 15%",
          "Raise prices and accept higher churn",
        ],
      }
    }
    return {
      validationClass: "unclear",
      reason: "No clear strategic intent detected. Try phrasing as a specific business decision with measurable impact.",
      suggestedNextPrompts: [
        "What if we raise a bridge round?",
        "Go product-led growth",
        "Lose 20% of revenue from churn",
      ],
    }
  }

  return {
    validationClass: "valid",
    reason: "Prompt accepted for scenario simulation.",
  }
}
