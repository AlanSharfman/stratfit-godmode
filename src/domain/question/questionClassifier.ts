export enum QuestionCategory {
  FINANCIAL = "FINANCIAL",
  STRATEGIC = "STRATEGIC",
  OPERATIONAL = "OPERATIONAL",
  UNKNOWN = "UNKNOWN",
}

const financialKeywords = [
  "hire",
  "budget",
  "revenue",
  "cash",
  "burn",
  "runway",
  "funding",
  "cost",
  "pricing",
  "forecast",
  "profit",
  "loss",
  "margin",
];

const strategicKeywords = [
  "expand",
  "market",
  "strategy",
  "acquire",
  "growth",
  "launch",
];

const operationalKeywords = [
  "process",
  "team",
  "workflow",
  "delivery",
  "capacity",
];

export function classifyQuestion(text: string): QuestionCategory {
  const q = text.toLowerCase();

  if (financialKeywords.some((k) => q.includes(k))) {
    return QuestionCategory.FINANCIAL;
  }

  if (strategicKeywords.some((k) => q.includes(k))) {
    return QuestionCategory.STRATEGIC;
  }

  if (operationalKeywords.some((k) => q.includes(k))) {
    return QuestionCategory.OPERATIONAL;
  }

  return QuestionCategory.UNKNOWN;
}
