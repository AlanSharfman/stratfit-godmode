export function noise2D(x: number, y: number, seed: number) {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 101.3) * 43758.5453123;
    // Center around zero [-1, 1] so noise creates BOTH peaks and troughs
    return (s - Math.floor(s)) * 2 - 1;
}
