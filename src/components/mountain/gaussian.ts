export function gaussian(
    x: number,
    center: number,
    width = 0.12
  ) {
    const d = x - center;
    return Math.exp(-(d * d) / (2 * width * width));
  }
  