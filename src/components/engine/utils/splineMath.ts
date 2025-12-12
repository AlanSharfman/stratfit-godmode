// Generates simple points between values (safe, deterministic)
export function generateSplinePoints(data: number[], width: number, height: number) {
  if (!Array.isArray(data) || data.length < 2) return [];

  const step = width / (data.length - 1);
  return data.map((v, i) => ({
    x: i * step,
    y: height - v * height, // expects v normalized 0..1
  }));
}

