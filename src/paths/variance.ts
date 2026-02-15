export function varianceAt(t: number) {
    // deterministic placeholder variance curve
    // low at start, wider mid, narrows toward end
    const v = Math.sin(t * Math.PI);
    return 0.4 + v * 0.6;
}
