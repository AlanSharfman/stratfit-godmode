export type VoiceTone = "neutral" | "analytical" | "urgent" | "optimistic";

export interface VoiceCommentaryInput {
  summary: string;
  keyInsights: string[];
  riskSignals: string[];
  tone: VoiceTone;
}

export interface VoiceCommentaryOutput {
  script: string;
  estimatedDurationSec: number;
}

export function generateVoiceCommentaryStub(
  input: VoiceCommentaryInput
): VoiceCommentaryOutput {
  const script = [
    input.summary,
    ...input.keyInsights,
    ...input.riskSignals,
  ].join(". ");

  return {
    script,
    estimatedDurationSec: Math.max(5, script.split(" ").length / 2),
  };
}
