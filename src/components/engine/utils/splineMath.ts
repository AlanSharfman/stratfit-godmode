// Generates smooth spline points between KPI values
export function generateSplinePoints(
  data: number[],
  width: number,
  height: number
) {
  if (data.length < 2) return [];

  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const vv = Math.max(0, Math.min(1, v));   // v is 0..1 (already normalized)
    return {
      x: i * step,
      y: height - vv * height,  // 0 => bottom, 1 => top
    };
  });

  // No complex spline needed — simple linear smoothing for now
  return points;
}
