export async function trainScoringModel() {
  const history = await fetch("/data/decision-history.json").then((r) => r.json());

  const approvals = history.filter((r) => r.approved);
  if (!approvals.length) {
    // Safe fallback model
    return {
      avgAlpha: 0,
      maxVol: Infinity,
      skewTolerance: -Infinity,
      approve() {
        return false;
      },
    };
  }

  // Simple heuristics from historical average
  const avgAlpha = mean(approvals.map((r) => r.alpha));
  const maxVol = max(approvals.map((r) => r.volatility));
  const skewTolerance = min(approvals.map((r) => r.skew));

  return {
    avgAlpha,
    maxVol,
    skewTolerance,
    approve(run) {
      return run.alpha >= avgAlpha && run.volatility <= maxVol && run.skew >= skewTolerance;
    },
  };
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
}
function max(arr) {
  return Math.max(...arr);
}
function min(arr) {
  return Math.min(...arr);
}


