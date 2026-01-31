import { trainScoringModel } from "./verdict-trainer.js";

export async function generateVerdict(runMeta) {
  const model = await trainScoringModel();
  const isApproved = model.approve(runMeta);

  return {
    verdict: isApproved ? "APPROVE" : "REJECT",
    rationale: `Compared to historical approved runs:
- Alpha ≥ ${model.avgAlpha.toFixed(2)}%
- Volatility ≤ ${model.maxVol.toFixed(2)}%
- Skew ≥ ${model.skewTolerance.toFixed(2)}
Current run: Alpha ${runMeta.alpha}%, Vol ${runMeta.volatility}%, Skew ${runMeta.skew}`,
    confidence: isApproved ? 90 : 60,
  };
}


