// Generates smooth spline points between KPI values
export function generateSplinePoints(
  data: number[],
  width: number,
  height: number
) {
  if (data.length < 2) return [];

  const step = width / (data.length - 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: height - (v / 100) * height, // convert KPI value to vertical position
  }));

  // No complex spline needed — simple linear smoothing for now
  return points;
}
